# Image update policies

On a stack's page, every image its services use gets a row under **Images** — except one already pinned to a digest in the compose file itself (`image: nginx@sha256:...`). There's no "latest digest" to check against a fixed one, so Wharf doesn't track it here at all; it just deploys exactly what the compose file says, same as `docker compose` would.

For everything else:

| Policy | Behavior |
|---|---|
| **Pinned** | Never checked. The default. |
| **Auto** | Redeployed automatically once the next scheduled check finds the registry's digest has moved. |
| **Propose** | Just flags "update available" here for you to apply by hand. |

A single global check runs every 15 minutes — not per stack, not configurable — and covers every tracked image across every stack in one pass, deduplicated by image reference so ten stacks on the same base image collapse into one registry call, not ten. Pinned images are skipped entirely; they're never part of that pass at all.

This needs a registry that speaks the Docker Registry v2 protocol — Docker Hub, GHCR, GitLab, Azure Container Registry, or a self-hosted Harbor/Nexus/Distribution all work, discovered dynamically via the registry's own `WWW-Authenticate` challenge rather than hardcoded per vendor. For a private image, add a matching credential under [Registry](/guide/registries) first.

![Images panel on a stack page, showing a pending update](/screenshots/image-policies.png)

The same registry credentials are also what an agent uses to `docker login` before pulling on every deploy, whether the stack lives in Git or was authored in Wharf — see [Registry](/guide/registries).
