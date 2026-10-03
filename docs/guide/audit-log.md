# Audit log

Admin-only, under **Settings → Audit log**. An append-only record of who did what, and of what Wharf did on its own: sign-in/sign-out (local and SSO), container restart/stop, a stack's whole lifecycle (create/deploy/undeploy/delete/rename/trigger/image policy/secrets), hosts (approve/reject/rename/address), users, Git connections, registry credentials, SSO configuration, the volume file browser, secret connections and references, vulnerability scanning, and the deployments Wharf starts by itself (a new commit seen by polling, an automatic image update).

| Column | What it shows |
|---|---|
| Time | When it happened |
| User | Who did it — the signed-in username, or a fixed name when nobody clicked: `webhook` for a deploy triggered by an external Git host, `polling` for one started by a new commit on a polling stack, `auto-update` for one started by an image policy set to auto, `agent` for a secret resolution during a deploy |
| Action | A short machine-readable label, e.g. `stack.deploy`, `user.role_change` |
| Target | What it acted on — a stack name, a username, a host id |
| Detail | Whatever else is worth knowing, e.g. the new role, the trigger mode switched to, the short commit of a polled deploy (`commit 0123456`), or the service, image and new digest of an automatic update |

A secret, password, or token value never appears here, in any column — only that the action happened. Setting a registry credential logs the host and username, never the password; configuring SSO logs the issuer and client id, never the client secret.

## Filtering

A free-text box filters by whatever's visible in the table — user, action, or target — client-side, no page reload. The page itself shows the 500 most recent entries currently in the log.

## Retention

By default nothing is ever deleted. A panel below the log lets you set how many days to keep entries for, per category — sign-in/sign-out, containers, stacks, hosts, users, Git connections, registry credentials, SSO, images, volumes, networks, notifications, backup, secrets, and vulnerability scanning each have their own independent setting. Leave a category blank or at `0` and it's kept forever; that's the default for every category until you change it. A background check runs once a day and prunes whatever's now older than its category's limit.

There's no single global setting — a homelab that only cares about container restarts for a week but wants every stack-lifecycle event kept indefinitely sets those two differently, rather than picking one number for everything.

## What Wharf does by itself

A deployment Wharf starts on its own is recorded the same way as one you start, under a fixed user so it is easy to tell apart:

| Action | User | Target and detail |
|---|---|---|
| `stack.deploy_polling` | `polling` | The stack, and the short commit it moved to |
| `stack.image_update_auto` | `auto-update` | The stack, and the service, image and short digest of the update |
| `stack.deploy_webhook` | `webhook` | The stack |

Only a deploy that was actually queued is logged. The first check of a new polling stack, which only records a starting point, is not; neither is an automatic update skipped because a deployment of that stack is already waiting. The stack's own page still lists every deployment with its trigger (`polling`, `image-update`, `webhook`, `manual`).

## What isn't logged

A container that crashes, or that Docker restarts under its own `restart:` policy: Wharf shows the container's current state but does not keep a history of restarts. An agent that goes dark is a [notification](/guide/notifications), not an audit entry. Read-only actions (viewing a page, listing containers), and a few flows where landing on a brand-new page is already the confirmation — creating a stack or a Git connection takes you straight to it, which is proof enough without a duplicate log line.
