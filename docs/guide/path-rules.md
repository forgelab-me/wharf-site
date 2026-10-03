# Path rules

A Git stack's [`secrets.refs.yaml`](/guide/secret-references) says which secrets it reads, and it lives in Git: whoever can push to that repository chooses the paths. **Path rules** are how you decide, once, on a [secret connection](/guide/secret-providers), what every stack that uses it may read, so that `blog` cannot read the secrets of `shop`, whatever its file says.

A rule is checked by the controller on every deploy, before anything is read from the provider. A reference outside the rules fails the deployment without ever reaching OpenBao or Bitwarden.

## Where to set them

**Settings → Secret providers →** open a connection (or add one) **→ Path rules**. One rule per line. Rules are optional: a connection without any behaves as it always did, with allowed paths typed [stack by stack](/guide/secret-providers#which-paths-the-stack-may-read).

Once a connection has rules, attaching a stack needs no path at all. The stack's page shows what the rules give it, for instance `homelab/blog_*`, on the **Secret references** panel.

## How a rule reads

A rule is a path, split into segments by `/`, with two things you can use in it:

| In a rule | Means |
|---|---|
| `{stack}` | The stack's id (see [below](#the-stack-id)) |
| `*` | Any characters, **inside one segment** only. It never crosses a `/` |

A rule allows what it names **and everything below it**: `secret/{stack}` lets the stack `blog` read `secret/blog` and `secret/blog/db`. Comparison is case-sensitive.

## The stack id

`{stack}` is the stack's **id**, not its name: the lowercase text in its address (`/stacks/my-blog`). Wharf makes it from the name when you create the stack, and it never changes afterwards, so renaming a stack does not break its secrets.

| Stack name | Stack id |
|---|---|
| `blog` | `blog` |
| `My Blog` | `my-blog` |
| `Pi-hole` | `pi-hole` |
| `Home Assistant` | `home-assistant` |
| `uptime_kuma` | `uptimekuma` (characters other than letters, digits and `-` are dropped) |

The binding form and the stack's page show the rule with the id already put in, so you can see exactly what a stack is given.

## Examples

### OpenBao or Vault: a folder per stack

Rule: `secret/{stack}`

You keep each stack's secrets under `secret/<stack>/…`:

```yaml
# stack "blog"
DB_PASSWORD: ref+vault://secret/blog/db#/password
```

| Stack | Reference | Allowed |
|---|---|---|
| `blog` | `secret/blog/db` | yes |
| `blog` | `secret/blog` | yes |
| `blog` | `secret/shop/db` | no, another stack's folder |
| `blog` | `secret/blogger/db` | no, a different folder that happens to start the same way |
| `blog` | `secret/blog-staging/db` | no, that is the stack `blog-staging` |

### OpenBao or Vault: a folder per stack, and one shared folder

Rules:

```
secret/{stack}
secret/shared
```

Every stack reads its own folder and `secret/shared` (an SMTP password everyone uses, say). A rule with no `{stack}` is simply a fixed path that every stack on the connection may read. Use this only for secrets that really are common to all of them.

### Bitwarden Secrets Manager: a project per stack

Rule: `{stack}`

Name each project after its stack:

```yaml
# stack "blog"
DB_PASSWORD: ref+bws://blog/db_password#/value
```

| Stack | Reference | Allowed |
|---|---|---|
| `blog` | `blog/db_password` | yes |
| `shop` | `blog/db_password` | no |

This needs one project per stack, which goes beyond Bitwarden's free plan (three projects at the time of writing).

### Bitwarden Secrets Manager: one shared project, secrets named after the stack

Rule: `homelab/{stack}_*`

Everything lives in one project, `homelab`, and each secret's key starts with its stack's id and an underscore. This works on the free plan.

```yaml
# stack "blog"
DB_PASSWORD:   ref+bws://homelab/blog_db_password#/value
SMTP_PASSWORD: ref+bws://homelab/blog_smtp#/value
```

| Stack | Reference | Allowed |
|---|---|---|
| `blog` | `homelab/blog_db_password` | yes |
| `blog` | `homelab/blog_smtp` | yes |
| `blog` | `homelab/shop_smtp` | no, named after another stack |
| `blog` | `homelab/blogger_db` | no |
| `blog` | `homelab/blog-staging_db` | no, that is `blog-staging`'s |
| `blog-staging` | `homelab/blog-staging_db` | yes |
| `blog-staging` | `homelab/blog_db` | no |

::: warning The rule is the only wall here
Bitwarden gives a machine account access to a whole project. With one shared project the token used by Wharf can read every stack's secrets, and the rule is the only thing that keeps `blog` away from `shop`'s. If that is not enough, use a project per stack.
:::

### A shared secret on top of a stack's own

Rules:

```
homelab/{stack}_*
homelab/shared_*
```

Secrets named `shared_smtp`, `shared_registry`… in the same project are readable by every stack, next to each stack's own `blog_…` ones.

### The same repository on several servers

A rule limits what a stack may read. To let one `secrets.refs.yaml` serve a stack per server, write `{stack}` in the references too (`ref+bws://homelab/{stack}_PIHOLE#/value`): with the rule `homelab/{stack}_*`, `dnsweaver-1` reads `homelab/dnsweaver-1_PIHOLE` and `dnsweaver-2` reads `homelab/dnsweaver-2_PIHOLE`. Create one secret per stack in the provider, named after it. See [One file for several stacks](/guide/secret-references#one-file-for-several-stacks).

### Any provider whose paths start with a container name

Rule: `*/{stack}_*`

The first segment can be a wildcard when it is not the part that tells stacks apart: `Perso/blog_db` and `Work/blog_db` are both allowed for `blog`, `Perso/shop_db` is not.

## Extra paths for one stack

Once a connection has rules, a stack can still be given more by an administrator, in the paths box of its attachment form (titled **Extra paths (optional)** when the connection has rules, **Allowed paths** when it has none): for instance `kv/common` for one stack that needs a secret the others do not.

![The paths box of a stack whose connection has rules](/screenshots/path-rules-extra.png)

- They add to the rules, they never replace them.
- A lone `*` is refused there: it would give the stack everything, which is what rules exist to prevent.
- If several stacks need the same extra path, a second rule on the connection (`kv/common`) is simpler.

## Rules that are refused

They are checked when you save, because each one would let a stack read what it should not:

| Rule | Why it is refused |
|---|---|
| `{stack}-*` | `-` can be part of a stack id: `blog` would read `blog-staging-db`, which belongs to `blog-staging`. The id must be followed by `/`, `_` or the end of the rule. `{stack}x` and `{stack}*` fail for the same reason |
| `*` or `*/*` | Allows every path. A rule made only of `*` is no rule |
| `a**b` | Use a single `*` |
| `../{stack}`, `a//b`, `/{stack}`, `{stack}/` | `..`, empty segments and leading or trailing slashes are not allowed |
| `{name}_*` | `{stack}` is the only placeholder |

`_` and `/` are safe after `{stack}` because a stack id never contains them.

## When a deploy fails

The deployment output names the key and the rule that applied:

```
DB_PASSWORD (bws://): path "homelab/shop_db" is outside the prefixes allowed for this stack (rule homelab/blog_*)
```

Check, in this order:

1. **The id.** The rule has `blog` put in it, not the stack's name. `My Blog` is `my-blog`.
2. **The spelling and the case.** `Blog_db` does not match `blog_*`.
3. **The separator.** With `homelab/{stack}_*`, the key must start with `blog_`: `blog-db` or `blogdb` do not.
4. **The number of segments.** For Bitwarden a reference is exactly `project/key`.
5. **The rule is read at the next deploy.** Saving a rule changes nothing for a stack until it deploys again.

## Good to know

- **Adding rules to a connection that already has stacks:** a stack attached with a `*` before no longer gets everything once the connection has rules. A stack whose allowed paths are specific keeps them, on top of the rules.
- **The Test button** only logs in to the provider; it does not check rules.
- **Rules come on top of the provider's own protections**, they do not replace them. With OpenBao, a token limited by a policy to `secret/data/blog/*` is a stronger wall than any rule: use both.
- **A connection a stack has all to itself** (its own address and credentials) can have its own rules too.
