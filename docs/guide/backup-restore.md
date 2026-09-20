# Backup & Restore

Admin-only, under **Settings → Backup & Restore**. One file with everything that makes a controller *this* controller: every stack, host, user and audit entry, every stored secret and private key, and — critically — the controller's own identity, the certificate every enrolled agent has already pinned. Without that identity, restoring onto a fresh machine would force every agent to be re-enrolled from scratch; with it, they reconnect as if nothing happened.

## Downloading a backup

Taken live, safe to run any time — it doesn't pause or lock anything. An optional passphrase encrypts the whole file (using [age](https://age-encryption.org)'s passphrase mode); leave it blank for a plain file, which contains every secret and private key in the clear.

::: warning
There's no recovery if you lose the passphrase on an encrypted backup. Keep it somewhere separate from the file itself.
:::

## Restoring

Uploading a backup **stages** it — it doesn't apply immediately. The current data isn't touched until the controller restarts (`docker compose up -d --force-recreate`, or an equivalent restart of the container); this is deliberate, not a missing feature. Both databases are open live via SQLite connections and the identity is already bound into the running HTTPS listener by the time a restore is uploaded — none of that can be safely swapped out from under itself while the process keeps running.

On the next restart, the previously-live `wharf.db`, `keys.db`, and identity aren't deleted, only renamed aside with a timestamp suffix. A restore that turns out to be a mistake is recoverable by hand from the data directory, not gone for good.

## What's checked before it's staged

A backup is a `.tar.gz`, optionally wrapped in age encryption. Before anything is staged, Wharf checks it's a complete backup of the expected format — missing any of the databases, the identity files, or the manifest refuses the upload outright rather than staging something partial.
