# Containers, images, volumes, networks

Live data pushed by each connected agent over its own persistent tunnel — the controller never has to poll a host for this.

## Containers

Every container across every connected host. Filters: by host, free-text search, **Only running**, and **My stacks only** (hide everything Wharf didn't deploy — dev databases, personal tools, whatever else happens to run on the same box). Click any column header to sort; a size-looking value (e.g. `2.39GB`) sorts by actual byte size, not as raw text. **Restart**/**Stop** are right there on each row — no need to open a container just to bounce it, and a toast confirms it happened without leaving whichever page (list or detail) you clicked from.

The **Stack** column shows the container's compose-project label whenever it has one, but only links to a stack page when that id is actually a stack Wharf manages — another tool (Portainer, a bare `docker compose` on the host) can stamp the exact same kind of label, and those show as plain text instead of a dead link.

![Containers list with filters](/screenshots/containers.png)

Click a container's name for its detail page:

- **Actions** — restart, stop, and, once it's stopped, **Remove** if Wharf didn't deploy it (see below).
- **Overview** — image (with an up-to-date/update-available badge if it's tracked by an image policy), host, status, ports (clickable if the host has an address set), which stack owns it.
- **Resources** — live CPU/memory chart while the page is open.
- **Processes** — `docker top` output.
- **Container details** — entrypoint, command, restart policy.
- **Environment variables** — masked by provenance; see [Secrets](/guide/secrets#what-gets-masked-in-the-ui).
- **Labels, Volumes, Connected networks.**
- **Logs** — the last 200 lines inline, scrolled to the newest by default, with a link to the full-page view.

![Container detail page](/screenshots/container-detail.png)

### Removing a container Wharf didn't deploy

A **Remove** button appears next to Restart/Stop, on the list and the detail page, only when a container is both stopped and not part of a stack Wharf manages — Portainer stacks, one-off `docker run`s, anything else already sitting on a host you've enrolled. It's there because those containers have no other way to leave the UI: undeploy only exists for a real Wharf stack, and there's otherwise no clean path but SSHing in and running `docker rm` yourself.

It's deliberately unavailable for anything still running (stop it first) and for a container that belongs to a stack Wharf actually deployed — that one goes through the stack's own **Undeploy**, which tears down every one of its containers together instead of picking them off individually.

### Full-page logs

A dedicated `/containers/{id}/logs` page for anything the inline preview is too small for: pick how far back to go (100 lines up to all of them), filter by text without leaving the page, auto-refresh every few seconds (it only jumps to the newest line if you were already at the bottom — reading further up is never interrupted), and a **Download** link for the raw text.

## Images, volumes, networks

Same host/search filters and sortable columns as Containers, plus an **In use / Unused** filter (a volume/network/image with nothing currently using it is flagged "unused" so you can spot cleanup candidates). Volume sizes load asynchronously, right after the page itself — real, on-demand disk usage per volume, not something guessed or kept running continuously in the background.

Click through to a detail page for the full picture: an image's layers and its Dockerfile-derived `CMD`/`ENTRYPOINT`/`ENV`; a volume's mount options and labels; a network's driver/scope/connected containers.

### Removing images, volumes, networks — admin only

Each of these three pages has a checkbox per row, a **Delete selected** button, and a **Clean up unused** button that pre-checks every row currently flagged "unused" and submits the same delete — one code path either way, so "Clean up unused" can never remove something the table itself doesn't already show as unused. A row's checkbox and both buttons only appear for admins; deleting is refused server-side for anyone else, not just hidden in the UI. Untagged/dangling images show up here too, not just named ones — Docker itself hides those from a plain `docker images` unless you pass `-a`, but they're exactly what a cleanup pass is usually for, so Wharf lists them.

![Bulk delete with Clean up unused on Images](/screenshots/images-bulk-delete.png)

### Browse a volume — admin only

A volume's detail page has a **Browse** button that opens its contents — every action (listing, navigating into a subdirectory, renaming, deleting, uploading, downloading, and editing a small text file) runs inside a throwaway container that mounts just that volume, and only ever operates on a volume Wharf already knows exists on that host. Nothing is cached anywhere else; a directory delete removes everything inside it, with a confirmation before it happens.

![Browsing a volume's contents](/screenshots/volume-browse.png)
