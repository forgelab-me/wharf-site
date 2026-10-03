# Bitwarden Secrets Manager

Reads secrets from Bitwarden Secrets Manager with a machine account. How connections and stacks fit together is on the [Secret providers](/guide/secret-providers) page; this one is what is specific to Bitwarden.

References read `ref+bws://<project>/<secret key>#/value`. A Secrets Manager secret has a key, a value and a note, so the field is `value` or `note`:

```yaml
# secrets.refs.yaml
DB_PASSWORD:   ref+bws://blog/db_password#/value
SMTP_PASSWORD: ref+bws://homelab/blog_smtp#/value
```

## 1. Download Bitwarden's tool

Wharf reads Secrets Manager through Bitwarden's own `bws` command-line tool, whose licence does not allow redistributing it. So it is **downloaded, not bundled**, and only when an administrator asks.

Under **Settings → Secret providers**, the **Bitwarden tool** section shows the licence and a checkbox. Once you accept, the controller downloads the pinned release from Bitwarden's release page, checks its SHA-256, and keeps it in the cache volume (`/cache`). Nothing is downloaded before that, and the downloads of other tools (such as [vulnerability scanners](/guide/vulnerability-scanning)) are unaffected. This is not legal advice: read the licence yourself.

Until it is installed, a reference fails with `the Bitwarden tool (bws) is not installed`. The cache volume belongs to one controller: install it on each controller that needs it.

## 2. Add a connection

Under **Settings → Secret providers**, choose **Bitwarden Secrets Manager**.

| Field | Meaning |
|---|---|
| Region | `us` (`vault.bitwarden.com`), `eu` (`vault.bitwarden.eu`) or `custom` |
| Server URL | Only with `custom`: a full http(s) URL, no credentials, query or fragment |
| Path rules | Optional, see [below](#one-project-per-stack-or-a-shared-one) |
| Machine account access token | From **Secrets Manager → Machine accounts**. Looks like `0.<id>.<secret>:<key>`. Write-only |

Give the machine account read access to the projects you use. **Test** lists the projects the machine account can see, so it proves the token, the region and the network, but not that a given secret exists, and it does not check path rules.

## One project per stack, or a shared one

Both are a [path rule](/guide/path-rules). Pick by how many projects your plan allows:

- **A project per stack**: rule `{stack}`, and name each project after its stack (`blog`). Nothing to type when you attach a stack. This needs one project per stack, which is more than the free plan's three.
- **A shared project**: rule `homelab/{stack}_*`, and name each secret after its stack (`blog_db_password`, `blog_smtp`) inside the project `homelab`. This works on the free plan. The machine account then reads the whole project, so the rule is the only thing keeping one stack from another's secrets.

To use the same `secrets.refs.yaml` on several stacks, write `{stack}` in the references as well: `ref+bws://homelab/{stack}_smtp#/value`. See [One file for several stacks](/guide/secret-references#one-file-for-several-stacks).

## Good to know

- **Names must be unique.** Bitwarden does not enforce it. If two projects share a name, or two secrets share a key in a project, the reference fails and says so, instead of picking one.
- **A secret is one field.** Unlike OpenBao, where a path holds several, a Bitwarden secret has a single value (and a note). A reference is exactly `<project>/<secret key>`, so a project name or a secret key containing `/` cannot be referenced.
- **The machine account must see the project.** A project it has no access to looks like a project that does not exist.
- **Cloud only for an individual.** Self-hosting Secrets Manager is limited to Bitwarden's Enterprise plan, so the controller must reach `vault.bitwarden.com` (or `.eu`), over HTTPS.
- **Private CA.** Set `SSL_CERT_FILE` on the controller, as for [vulnerability scanning](/guide/vulnerability-scanning).
- **No proxy.** `bws` runs with an empty environment apart from `SSL_CERT_FILE`, so a proxy configured on the controller (`HTTPS_PROXY`) is not used by it.
- **Free plan limits:** at the time of writing, three projects and three machine accounts. Check Bitwarden's current plans.
- **The access token** is write-only, and is passed to `bws` in its environment, never on the command line. It is removed from any message.

## Errors you may see

They appear in the deployment output and name the key that failed; see [Secret references](/guide/secret-references#when-a-deploy-fails) for how a failure is reported. When `bws` itself fails, the message is its own chain of causes, joined with `:`.

| Message | Meaning |
|---|---|
| `the Bitwarden tool (bws) is not installed` | Download it under Settings, Secret providers |
| `that does not look like a Secrets Manager access token` | The token must look like `0.<id>.<secret>:<key>` |
| `no project named "x" (the machine account may not have access to it)` | The project does not exist, or the machine account cannot read it |
| `2 projects are named "x": rename all but one` | Names must be unique |
| `no secret named "k" in project "x"` / `2 secrets are named …` | The key does not exist in that project, or is not unique |
| `a bws secret has a value and a note: use #/value or #/note` | The field after `#/` |
| `a bws reference is ref+bws://<project>/<secret key>#/value` | The path needs exactly a project and a key |
| `bws: error sending request …: client error (Connect): dns error: …` | The **controller** cannot resolve or reach Bitwarden. Check its DNS and outbound firewall; it is not a Bitwarden problem |
| `bws: Received error message from server: [400 Bad Request] {"error":"invalid_client"}` | The access token is wrong or revoked, or the region is not the account's |
| `bws: … [503 Service Unavailable] upstream connect error …` | Bitwarden's side, usually passing. Deploy again, and check Bitwarden's status page if it lasts |
| `bws did not answer in time` | The call exceeded 10 seconds |
| `path "…" is outside the prefixes allowed for this stack` | See [Secret references](/guide/secret-references#when-a-deploy-fails) |
