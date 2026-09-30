# Secret providers

Keep secrets out of Git altogether: store them in OpenBao or HashiCorp Vault, and let a Git stack's [`secrets.refs.yaml`](/guide/secrets#choosing-keys-with-secrets-refs-yaml) point at them. The file holds references, never values; the controller resolves them at deploy time with credentials it keeps itself.

```yaml
# secrets.refs.yaml — safe to commit
DB_PASSWORD: ref+vault://secret/blog/db#/password
API_KEY:     ref+sops://secrets.enc.yaml#/API_KEY
```

Providers available today:

| Scheme | Reads from | Needs a connection |
|---|---|---|
| `ref+vault://` | OpenBao or HashiCorp Vault, KV v1 or v2, token or AppRole login | yes |
| `ref+sops://` | The stack's own `secrets.enc.yaml` | no |

## How a deploy resolves them

```mermaid
sequenceDiagram
    participant A as Agent
    participant C as Controller
    participant V as OpenBao / Vault

    A->>A: git clone, finds secrets.refs.yaml
    A->>C: POST /agent/resolve (deployment_id, refs file)
    C->>C: check every path against the stack's allowed paths
    C->>V: log in (AppRole) or use the token
    V-->>C: secret fields
    C-->>A: only the variables the file asks for
    A->>A: write .env, docker compose up, delete .env
```

*The agent never talks to the secret manager and never holds its credentials; it only receives the final variables, for the length of one `docker compose up`.*

## 1. Prepare OpenBao / Vault

Wharf needs a read-only identity per stack (or one for all of them). With AppRole, on the OpenBao side:

```bash
bao policy write wharf-blog - <<'EOF'
path "secret/data/blog/*" { capabilities = ["read"] }
EOF

bao auth enable approle
bao write auth/approle/role/wharf-blog \
    token_policies=wharf-blog \
    token_ttl=1h \
    secret_id_ttl=0 \
    secret_id_num_uses=0 \
    secret_id_bound_cidrs=192.168.1.10/32   # the controller's address

bao read auth/approle/role/wharf-blog/role-id
bao write -f auth/approle/role/wharf-blog/secret-id
```

A few choices matter:

- **`secret_id_num_uses=0`.** Wharf logs in again whenever its cached token expires, so a secret ID limited to N uses stops working after N logins.
- **A long (or no) `secret_id_ttl`, rotated on a calendar.** An expired secret ID is the most common cause of a sudden failure, see [below](#errors-you-may-see).
- **A CIDR binding** limits where the secret ID is accepted.
- In a KV v2 policy the path has `data/` in it (`secret/data/blog/*`); in a Wharf reference it does not (`secret/blog/db`), Wharf adds it.

A plain token works too, but a token that expires (or isn't periodic) becomes the same kind of sudden failure.

## 2. Add a connection

**Secret providers** (admin only) lists the shared connections. A connection is an address plus, optionally, default credentials.

![Secret providers page](/screenshots/secret-providers.png)

| Field | Meaning |
|---|---|
| Address | The server's URL, e.g. `https://openbao.example.lan:8200` |
| KV engine version | `2` (default) or `1` |
| Namespace | Optional |
| AppRole auth mount | `approle` unless you enabled it elsewhere |
| CA certificate | Only for a server signed by a private CA |
| Token, or role ID + secret ID | Default credentials, optional. Write-only: never shown again once saved |

**Test** logs in with the default credentials and tells you whether it worked.

## 3. Attach it to a stack

Open a Git stack, and under **Secret references** choose **Add OpenBao / Vault**.

![Secret references panel on a stack page](/screenshots/stack-secret-references.png)

There are three ways to connect:

| Mode | Address | Credentials | Use it when |
|---|---|---|---|
| A shared connection, as is | the connection's | the connection's defaults | every stack may use the same identity |
| A shared connection, with its own credentials | the connection's | this stack's | one server, a role per stack |
| A connection of its own | this stack's | this stack's | a stack talks to a different server |

Changing a shared connection's address changes it for every stack that inherits it, and their credentials are then sent to the new address; the connection page warns you.

![Attaching a connection to a stack](/screenshots/secret-binding.png)

**Allowed paths** are required, one per line. A path covers itself and everything below it, compared by whole segments: `secret/blog` allows `secret/blog/db`, not `secret/blogger`. A reference outside them fails the deploy without ever reaching the server. This is what separates two stacks that share the same credentials, so keep it as tight as the stack allows (`*` allows every path).

## 4. Reference the secrets

```yaml
DB_PASSWORD: ref+vault://secret/blog/db#/password
```

`secret` is the KV mount, `blog/db` the secret's path and `password` the field. The other rules (all values are references, no query string, all or nothing) are on the [Secrets](/guide/secrets#choosing-keys-with-secrets-refs-yaml) page. A reference never carries an address or credentials, so a repository can only ask for a path, never redirect Wharf to another server.

## Errors you may see

They appear in the deployment output and name the key that failed; every failing key is listed at once, and nothing is deployed if any fails.

| Message | Meaning |
|---|---|
| `login refused: invalid role or secret ID` | The secret ID is wrong, expired or destroyed. Replace it in the connection or in the stack's credentials, then **Test** |
| `permission denied by the OpenBao policy for …` | The role's policy doesn't cover that path |
| `no secret at …` / `field "x" not found at …` | The secret or its field doesn't exist |
| `OpenBao is sealed or not ready (503)` | Unseal it; nothing can be resolved until then |
| `cannot reach OpenBao at …` / `timed out talking to OpenBao …` | Network, address or TLS (a private CA goes in the connection) |
| `path "…" is outside the prefixes allowed for this stack` | Add the path to the stack's allowed paths, or fix the reference |
| `this stack has no vault connection` | The file uses `ref+vault://` but nothing is attached |

Polling only deploys when the branch moves, so it does not retry a failed deploy on the same commit: once the cause is fixed, use **Deploy now**.

A failing login shows up later than the change that caused it. Wharf keeps the token it got for as long as it lives (minus 30 seconds), so a secret ID destroyed at noon can keep working until the next login, then fail on a deploy at midnight. **Test** a connection right after rotating a credential.

## Good to know

- **Credentials never leave the controller.** They are stored in its isolated key store next to the other secrets, are part of an encrypted [backup](/guide/backup-restore), and are never shown again, in the UI or the audit log.
- **Redirects are not followed**, so a token can't be forwarded to another host by the server's answer.
- **Deleting** a connection that a stack still uses is refused; the message lists the stacks.
- **The audit log** records each resolution (`secrets.resolve`, or `secrets.resolve_failed`) with the variable names and which connection was used, never a value.
- **Agents must be up to date.** A stack with a secret connection is refused, with a clear message, on an agent older than 0.5.0, instead of deploying with empty variables. See [Hosts](/guide/hosts#agent-version).
