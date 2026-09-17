# Git connections

A shared SSH key or HTTP credential, reusable across multiple stacks instead of generating one deploy key per repository. Create one under **Settings → Git connections**, then pick "Use a shared connection" when creating (or editing) a stack.

## Creating a connection

Give it a name, then pick a type:

- **SSH key** — either **Generate** a fresh RSA-4096 keypair (the default, and the one that also works with Azure DevOps — see below) or **Import an existing key** by pasting an existing private key in. An imported key is sent straight to the secrets-service and never returned by any endpoint afterward; if it's reused anywhere else outside Wharf, consider rotating it there too.
- **Username / password (or token)** — paste a Personal Access Token, GitLab Deploy Token, or similar (Wharf can't mint one itself — create it on the Git host first). Sent as an `Authorization` header at clone time, never embedded in the repository URL. A GitHub App usually wants its slug as the username; a fixed-token setup often just wants something like `x-access-token`.

![New Git connection form](/screenshots/git-connection-form.png)

## Regenerate key

Replaces an SSH connection's key pair on the spot — useful if a key turns out to be the wrong type or is suspected compromised.

::: tip Azure DevOps needs RSA
Azure DevOps' SSH deploy key field rejects ed25519 outright ("Invalid key: Valid keys will start with `ssh-rsa`"). Wharf generates RSA-4096 keys by default specifically because of this — it works everywhere ed25519 would have, plus Azure DevOps.
:::

The old public key stops working immediately once you regenerate; update it as a Deploy Key everywhere it was pasted.

![Git connections list](/screenshots/git-connections.png)

## Renaming, replacing a credential, deleting

A connection's **Name** is editable any time from its own page. An `http_password` connection's username/password can be replaced the same way as a [registry credential](/guide/registries#editing-a-registry) — leave the password blank to keep the one already stored. **Delete** is refused while any stack still uses the connection; repoint those stacks first (to a different connection or a dedicated key) — a connection several stacks share should never disappear out from under them by accident.
