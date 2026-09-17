# Private registries

Admin-only, under **Settings → Registry**. Any number of named registry credentials, of any type — Docker Hub, GHCR, GitLab, Azure Container Registry, or a custom/self-hosted one. Host is free text, so anything speaking the Docker Registry v2 protocol works; the **Type** dropdown is purely cosmetic (label + a suggested host) and never affects how Wharf actually talks to it — a "Custom" entry against a self-hosted Harbor works exactly like a "GitHub" entry against `ghcr.io`. Picking a type pre-fills a sensible host:

| Type | Host |
|---|---|
| Docker Hub | `docker.io` |
| GHCR | `ghcr.io` |
| GitLab | `registry.gitlab.com` |
| Azure Container Registry | *(your own `<name>.azurecr.io`)* |
| Custom / self-hosted | *(your own host)* |

Each credential does double duty:

1. The [image update check](/guide/image-policies) authenticates with it against that host.
2. An agent logs in with it before pulling on every deploy — whether that stack lives in Git or was authored in Wharf.

![Registries list](/screenshots/registries.png)

## Editing a registry

**Edit** pre-fills a credential's name/type/username for changing without retyping the password — leave the password field blank to keep the one already stored. The host itself can't be changed in place, since it's the credential's key; remove and re-add to move a credential to a different host. **Remove** asks for confirmation first — the image-update check and every future deploy pull fall back to anonymous/public access the moment it's gone.
