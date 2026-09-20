# Audit log

Admin-only, under **Settings → Audit log**. An append-only record of who did what: container restart/stop, a stack's whole lifecycle (create/deploy/undeploy/delete/rename/trigger/image policy/secrets), hosts (approve/reject/rename/address), users, Git connections, registry credentials, SSO configuration, and the volume file browser.

| Column | What it shows |
|---|---|
| Time | When it happened |
| User | Who did it — the signed-in username, or `webhook` for a deploy triggered by an external Git host rather than a click |
| Action | A short machine-readable label, e.g. `stack.deploy`, `user.role_change` |
| Target | What it acted on — a stack name, a username, a host id |
| Detail | Whatever else is worth knowing, e.g. the new role, the trigger mode switched to |

A secret, password, or token value never appears here, in any column — only that the action happened. Setting a registry credential logs the host and username, never the password; configuring SSO logs the issuer and client id, never the client secret.

## Filtering

A free-text box filters by whatever's visible in the table — user, action, or target — client-side, no page reload. The page itself shows the 500 most recent entries; nothing older is deleted, just not shown yet.

## What isn't logged

Read-only actions (viewing a page, listing containers), and a few flows where landing on a brand-new page is already the confirmation — creating a stack or a Git connection takes you straight to it, which is proof enough without a duplicate log line.
