# Secrets

Every stack gets its own [age](https://age-encryption.org) keypair. The public key is shown on the stack's page and is safe to share anywhere; the private key is generated and held by the controller's secrets custodian and never leaves it — not even to display.

## Local stacks

Paste a `KEY=value` block into the stack's form, one secret per line:

```
DB_PASSWORD=a-real-generated-password
API_TOKEN=sk-live-...
```

Wharf encrypts it before anything touches disk, and never shows the values again once saved.

**Saving replaces the whole block**, not individual lines. Use **Remove all secrets** to clear them entirely. Either way, a change only takes effect on the next deploy — a running deployment keeps what it already has.

## Git stacks

Encrypt a plain `secrets.yaml` to the stack's public key, and commit the result as `secrets.enc.yaml` next to the compose file:

```yaml
# secrets.yaml — never committed, only its encrypted output is
DB_PASSWORD: a-real-generated-password
API_TOKEN: sk-live-...
```

::: code-group

```bash [age]
age -r <public key> -o secrets.enc.yaml secrets.yaml
```

```bash [sops]
sops -e --age <public key> secrets.yaml > secrets.enc.yaml
```

:::

No `age`/`sops` installed locally? **Tools → Encrypt secrets** (admin only) does the same thing in the browser — paste or upload the plaintext, pick the stack from a dropdown (or paste a public key directly), choose plain age or SOPS, and copy or download the result. Nothing typed there is ever stored on the controller; it's the exact same one-shot operation as the CLI commands above, just without leaving the browser. SOPS output comes from the real `sops` binary, not a reimplementation, so it's identical to what the CLI would produce. A link right on this panel (**Encrypt it here instead**) jumps there with this stack's public key already filled in.

![Encrypt secrets form, with a SOPS result ready to copy or download](/screenshots/secrets-tool.png)

Wharf detects the format automatically. At deploy time, the agent finds `secrets.enc.yaml` right after cloning but can't read it — only the controller holds the private key. So the ciphertext goes to the controller over the agent's existing connection, and only the resulting plaintext comes back:

```mermaid
flowchart LR
    You(["Your machine"])
    Repo[("Git repository")]
    Agent["Agent (target host)"]
    Controller{{"Controller (secrets-service)"}}
    Deploy(["docker compose up"])

    You -- "encrypt, commit" --> Repo
    Repo -- "git clone at deploy" --> Agent
    Agent -- "ciphertext (mTLS)" --> Controller
    Controller -- "plaintext (mTLS)" --> Agent
    Agent -- "env vars + secret files" --> Deploy

    classDef accent fill:#2dd4bf22,stroke:#2dd4bf,color:#2dd4bf;
    class Controller accent;
```

*A Git stack's secrets never make the controller hold the ciphertext ahead of time — the agent finds it after cloning, and only the ciphertext (never the key) crosses the network to get decrypted.*

Same flow, one level of detail down — this is the part that actually stops an agent from decrypting anything it hasn't earned:

```mermaid
sequenceDiagram
    actor U as You
    participant G as Git repository
    participant A as Agent
    participant C as Controller (secrets-service)

    U->>G: commit secrets.enc.yaml (encrypted locally)
    A->>G: git clone at deploy
    A->>A: finds secrets.enc.yaml
    A->>C: POST /agent/decrypt (deployment_id, ciphertext)
    C->>C: verify mTLS cert owns this deployment
    C->>C: decrypt in-process, private key never leaves
    C-->>A: plaintext
    A->>A: write .env + secrets/KEY (file:-sourced keys only)
    A->>A: docker compose up
    A->>A: delete .env
```

*`POST /agent/decrypt` is scoped to one `deployment_id`, checked against the calling agent's own mTLS certificate — an agent can't decrypt another host's secrets by guessing or replaying a request, only the one ciphertext it just cloned for the deployment it's actually running.*

::: warning Windows line endings will break this
If your editor/OS/Git config rewrites the file's line endings (`autocrlf` is the usual culprit), decryption fails with a clear error. Mark the file as binary in `.gitattributes` before committing, then re-encrypt and re-commit:

```
secrets.enc.yaml -text
```
:::

## Choosing keys with `secrets.refs.yaml`

Optional, Git stacks only. By default every key of `secrets.enc.yaml` becomes a variable of the stack. Put a `secrets.refs.yaml` next to the compose file instead to list exactly which variables the stack gets, and where each value comes from:

```yaml
# secrets.refs.yaml — contains no secret, safe to commit
DB_PASSWORD: ref+sops://secrets.enc.yaml#/DB_PW
API_KEY:     ref+sops://secrets.enc.yaml#/API_KEY
```

A reference reads `ref+<scheme>://<path>#/<field>`. The left side is the variable your compose file sees, so a key can be renamed on the way (`DB_PW` above becomes `DB_PASSWORD`). Two schemes exist: `sops` reads the stack's own `secrets.enc.yaml` (either format, and only that file), and `vault` reads from OpenBao or HashiCorp Vault through a connection you set up once, see [Secret providers](/guide/secret-providers). Any other scheme fails the deploy with a clear message.

The rules are strict on purpose:

- **The file is the only source.** With a `secrets.refs.yaml`, keys of `secrets.enc.yaml` that no reference picks up are not deployed; the deployment output names them (never their values) so a forgotten one is easy to spot.
- **Every value must be a reference.** A literal such as `PASSWORD: hunter2` is refused, and so is a query string (`?address=…`): a reference says what to read, never where to connect.
- **All or nothing.** If any reference can't be resolved, nothing is deployed and the error lists every failing key.
- **No file, no change.** A stack without `secrets.refs.yaml` behaves exactly as before.

The agent sends the two files to the controller, which resolves the references and returns only the variables you asked for. The rest of the flow is the one above: `.env` written, `docker compose up`, `.env` deleted.

::: warning Update your agents first
An agent from before this feature ignores `secrets.refs.yaml` and would start the stack with empty variables. Update the agent on a host (see [Hosts](/guide/hosts)) before adding the file to a stack deployed there. A stack with a [secret provider](/guide/secret-providers) attached is refused on such an agent, instead of deploying with empty variables.
:::

## Using a secret in your compose file

Whether a secret came from the form (local stack) or `secrets.enc.yaml` / `secrets.refs.yaml` (Git stack), referencing it works the same way. Use `${KEY}` for a plain environment variable, or give the image a file instead, for anything that expects one:

```yaml
secrets:
  api_password:
    file: ./secrets/API_PASSWORD   # written by Wharf at deploy time

services:
  app:
    image: ghcr.io/example/app:1.4.0
    secrets:
      - api_password
    environment:
      API_PASSWORD_FILE: /run/secrets/api_password
```

Compose's own `environment:`-sourced `secrets:` works too, and can be mixed freely with the `_FILE` convention on the container side:

```yaml
secrets:
  api_password:
    environment: API_PASSWORD   # reads it from the .env Wharf writes for the deploy

services:
  app:
    image: ghcr.io/example/app:1.4.0
    secrets:
      - api_password
    environment:
      API_PASSWORD_FILE: /run/secrets/api_password
```

The top-level `secrets:` block's `file:`/`environment:` only controls where **Compose** gets the value from — never how the **container** receives it. Any container listing a secret under its own `secrets:` always gets it the same way, as a file at `/run/secrets/<name>`, regardless of which source form produced it. (Want a real environment variable inside the container instead of a file? Skip the `secrets:` mechanism entirely and use plain `${KEY}` substitution, as above.)

On disk, the two forms aren't equivalent: `file:` needs its `secrets/<KEY>` file to persist for as long as the container might restart, so Wharf keeps it — one file per key actually referenced this way, nothing for a key that isn't. `environment:` only needs the value in `.env` for the moment `docker compose up` runs; Wharf deletes that file right after, and the container keeps working fine. So `environment:` is the one that leaves nothing behind on the host once the deploy finishes.

::: tip
`file:` also needs the agent's stacks directory bind-mounted at a matching host/container path, which the [Hosts](/guide/hosts#add-an-agent) page's install command already sets up correctly. `environment:` has no such requirement — it doesn't touch a host bind mount at all.
:::

## Masking in the UI

On a container's detail page, secret-sourced values are masked automatically: for a local stack, any value matching one of the stack's decrypted secrets; for a Git stack (whose secrets the controller never holds centrally), any value the compose file set via `${...}`/`$VAR` substitution. A literal value like `TZ: 'America/Toronto'` still shows in plain text.
