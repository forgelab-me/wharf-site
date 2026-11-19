# Infisical

Reads secrets from Infisical, the cloud service or a self-hosted instance, with a machine identity. How connections and stacks fit together is on the [Secret providers](/guide/secret-providers) page; this one is what is specific to Infisical.

References read `ref+infisical://<project id>/<environment>[/<secret path>]#/<secret name>`:

```yaml
# secrets.refs.yaml
DB_PASSWORD: ref+infisical://3f2a9c1e-0000-0000-0000-000000000000/prod/db#/password
API_KEY:     ref+infisical://3f2a9c1e-0000-0000-0000-000000000000/prod#/api_key
```

- The **project id** is the project's ID (Project settings), not its name or slug.
- The **environment** is the environment's slug (`dev`, `staging`, `prod`...).
- The **secret path** is the folder inside the environment, without a leading `/`. Leave it out for the root folder.
- The **secret name** after `#/` is the secret's key. A secret has a single value, which is what Wharf reads (its comment and metadata are ignored).

## 1. Prepare Infisical

Wharf needs a read-only machine identity per stack, or one for all of them. With Universal Auth:

1. **Organization settings → Access Control → Machine Identities**: create an identity.
2. Add a **Universal Auth** method to it, and create a **client secret** (keep its TTL and number of uses unlimited, or Wharf stops logging in once they run out). Restrict the **trusted IPs** to the controller's address.
3. Add the identity to the project(s) it should read, with a role that can only **read secrets** in the environments and folders you want.

Infisical's own role is a stronger wall than any Wharf rule, since it holds even if Wharf is misconfigured. Use both: the role for what the identity can ever read, [path rules](/guide/path-rules) for what each stack may.

A machine identity access token works too, but one that expires becomes a sudden failure. Prefer Universal Auth, where Wharf logs in again by itself.

## 2. Add a connection

Under **Settings → Secret providers**, choose **Infisical**.

| Field | Meaning |
|---|---|
| Site URL | `https://app.infisical.com` (US cloud, the default), `https://eu.infisical.com`, or your instance's URL. No credentials, query or fragment in it |
| CA certificate | Only for a self-hosted instance signed by a private CA |
| Path rules | Optional, see [Path rules](/guide/path-rules) |
| Access token, or client ID + client secret | Default credentials, optional and write-only. Either an access token, or both halves of Universal Auth, not both kinds |

**Test** logs in (with Universal Auth) and asks Infisical for the identity's own details. It proves the credentials, the site URL and the network, but not that a given secret exists, and it does not check path rules.

## One project per stack, or a shared one

The path a stack may read starts with the project id and the environment, so [path rules](/guide/path-rules) work on them:

- **A folder per stack**: rule `3f2a9c1e-0000-0000-0000-000000000000/prod/{stack}`, with each stack's secrets in a folder named after it.
- **Allowed paths on the stack**: type `3f2a9c1e-0000-0000-0000-000000000000/prod/blog` when you attach the stack.

To use the same `secrets.refs.yaml` on several stacks, write `{stack}` in the path: `ref+infisical://<project id>/prod/{stack}#/password`. See [One file for several stacks](/guide/secret-references#one-file-for-several-stacks).

## Errors you may see

They appear in the deployment output and name the key that failed; see [Secret references](/guide/secret-references#when-a-deploy-fails) for how a failure is reported.

| Message | Meaning |
|---|---|
| `login refused: …` | The client ID or secret is wrong, expired, or the identity's trusted IPs do not include the controller. Replace it, then **Test** |
| `permission denied by Infisical for …` | The identity has no access to that project, environment or folder, or its token was revoked |
| `no secret at …` | No secret of that name in that project, environment and folder. A wrong project id or environment slug looks the same |
| `path must be <project id>/<environment>[/<secret path>]` | The reference has only a project |
| `Infisical answered 4xx/5xx: …` | Infisical's own message |
| `cannot reach Infisical at …` / `timed out talking to Infisical …` | Network, URL or TLS (a private CA goes in the connection). From the controller's side, so check its DNS and firewall |
| `Infisical answered with a redirect (…), which is not followed` | Point the connection at the final address |
| `path "…" is outside the prefixes allowed for this stack` | See [Secret references](/guide/secret-references#when-a-deploy-fails) |

A failing login shows up later than the change that caused it. Wharf keeps the access token it got for as long as it lives (minus 30 seconds), so a client secret revoked at noon can keep working until the next login. **Test** a connection right after rotating a credential.

## Good to know

- **One request per secret.** Unlike OpenBao, where a path holds several fields read at once, each Infisical secret is its own request.
- **Secret references and imports.** Infisical's own `${...}` references inside a value and folder imports are resolved by Infisical, as it does by default.
- **Redirects are not followed**, so a token cannot be forwarded to another host by the server's answer.
- **Credentials** are write-only, held in the controller's isolated key store, and part of an encrypted [backup](/guide/backup-restore).
