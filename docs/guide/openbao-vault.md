# OpenBao / Vault

Reads secrets from OpenBao or HashiCorp Vault, KV engine version 1 or 2, with a token or an AppRole. How connections and stacks fit together is on the [Secret providers](/guide/secret-providers) page; this one is what is specific to OpenBao and Vault.

```yaml
# secrets.refs.yaml
DB_PASSWORD: ref+vault://secret/blog/db#/password
```

`secret` is the KV mount, `blog/db` the secret's path and `password` the field. A path holds several fields, unlike [Bitwarden](/guide/bitwarden).

## 1. Prepare OpenBao / Vault

Wharf needs a read-only identity per stack, or one for all of them. With AppRole, on the OpenBao side:

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
- **`data/` in the policy, not in the reference.** In a KV v2 policy the path has `data/` in it (`secret/data/blog/*`); in a Wharf reference it does not (`secret/blog/db`), Wharf adds it.

A plain token works too, but a token that expires, or is not periodic, becomes the same kind of sudden failure.

The policy is a stronger wall than any Wharf rule, since it holds even if Wharf is misconfigured. Use both: the policy for what the identity can ever read, [path rules](/guide/path-rules) for what each stack may.

## 2. Add a connection

Under **Settings → Secret providers**, choose **OpenBao / Vault**.

| Field | Meaning |
|---|---|
| Address | The server's URL, e.g. `https://openbao.example.lan:8200`. No credentials, query or fragment in it |
| KV engine version | `2` (default) or `1` |
| Namespace | Optional |
| AppRole auth mount | `approle` unless you enabled it elsewhere. Only used with a role ID and secret ID |
| CA certificate | Only for a server signed by a private CA |
| Path rules | Optional, see [Path rules](/guide/path-rules) |
| Token, or role ID + secret ID | Default credentials, optional and write-only. Either a token, or both halves of an AppRole, not both kinds |

**Test** logs in with the default credentials and tells you whether it worked.

## Errors you may see

They appear in the deployment output and name the key that failed; see [Secret references](/guide/secret-references#when-a-deploy-fails) for how a failure is reported.

| Message | Meaning |
|---|---|
| `login refused: invalid role or secret ID` | The secret ID is wrong, expired or destroyed. Replace it in the connection or in the stack's credentials, then **Test** |
| `permission denied by the OpenBao policy for …` | The role's policy does not cover that path |
| `no secret at …` / `field "x" not found at …` | The secret or its field does not exist |
| `no current version at …` | The secret was deleted or destroyed (KV v2) |
| `field "x" at … is not a string` | The field holds a number, a list or an object. Wharf reads text values |
| `OpenBao is sealed or not ready (503)` | Unseal it; nothing can be resolved until then |
| `OpenBao node is on standby (429)` | Point the connection at the active node, or at a load balancer |
| `cannot reach OpenBao at …` / `timed out talking to OpenBao …` | Network, address or TLS (a private CA goes in the connection). From the controller's side, so check its DNS and firewall |
| `OpenBao answered with a redirect (…), which is not followed` | Point the connection at the final address |
| `path must be <mount>/<secret path>` | The reference has only a mount |
| `path "…" is outside the prefixes allowed for this stack` | See [Secret references](/guide/secret-references#when-a-deploy-fails) |

A failing login shows up later than the change that caused it. Wharf keeps the token it got for as long as it lives (minus 30 seconds), so a secret ID destroyed at noon can keep working until the next login, then fail on a deploy at midnight. **Test** a connection right after rotating a credential.

## Good to know

- **Redirects are not followed**, so a token cannot be forwarded to another host by the server's answer.
- **Credentials** are write-only, held in the controller's isolated key store, and part of an encrypted [backup](/guide/backup-restore).
