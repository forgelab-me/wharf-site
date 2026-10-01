# Stacks

A stack is one `docker compose` project, deployed to exactly one host. Nothing about the compose file itself is Wharf-specific — any file that already works with `docker compose up` works here, referencing a stack's [secrets](/guide/secrets) the normal way:

```yaml
services:
  app:
    image: ghcr.io/example/app:1.4.0
    restart: unless-stopped
    ports:
      - "8080:80"
    environment:
      DATABASE_URL: postgres://app:${DB_PASSWORD}@db:5432/app
    depends_on:
      - db
  db:
    image: postgres:16
    restart: unless-stopped
    environment:
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - db-data:/var/lib/postgresql/data

volumes:
  db-data:
```

`${DB_PASSWORD}` here is exactly the kind of value a stack's secrets deliver — see [Secrets](/guide/secrets) for where it actually comes from (a Git stack's `secrets.enc.yaml`, or a local stack's own encrypted block) and why it shows up masked wherever Wharf displays this container's environment later.

## Creating a stack

**Source** — Git repository or a Compose file authored directly in the UI ("local"). A local stack has no Git history; editing it records a revision so nothing is lost, but there's no branch/commit to point at.

**Git repository fields** — repo URL (SSH or HTTPS), branch, and the path to the compose file inside it.

**Credential** (Git only) — either a **dedicated SSH key** generated just for this stack (shown as a read-only Deploy Key to add to the repository after creation), or a **shared connection** already set up under [Git connections](/guide/git-connections). Use a shared connection when several stacks live in the same Git host/account — one key or token to maintain instead of one per stack.

## Triggers

- **Manual** — nothing happens until someone clicks Deploy.
- **Webhook** — the stack's page shows a URL and a secret. Point your Git host's webhook at that URL: GitHub signs its payload with `X-Hub-Signature-256` (paste the secret into the webhook config), GitLab sends it as a plain token in `X-Gitlab-Token`, anything else can send it as an `X-Webhook-Secret` header — including calling it by hand:

  ```bash
  curl -X POST https://<controller>:9443/hooks/<stack id> \
    -H "X-Webhook-Secret: <secret shown on the stack's page>"
  ```

  A verified request enqueues a deploy immediately; the payload itself is never parsed — a stack has exactly one configured branch, so any authenticated call just redeploys that.
- **Polling** — Wharf checks the branch on a cron schedule (`* * * * *`, standard 5-field syntax) and deploys when the remote HEAD has moved.

::: tip The first poll never deploys
The very first check on a new polling stack only records a starting point — it never deploys. That's deliberate: it gives you time to add the deploy key to the Git host and push encrypted secrets before the first real deploy happens. Once ready, either wait for the next scheduled tick or click **Deploy now** yourself.
:::

**Target host** — which connected agent runs this stack. The dropdown only shows approved hosts, so with none yet, there's nothing to pick — get at least one connected under [Hosts](/guide/hosts) first. A stack can technically exist with no target host assigned (the form doesn't hard-block it), but it simply can't be deployed until one is.

![New stack form](/screenshots/stack-form.png)

## The stacks list

The list is an overview of everything you manage, with live figures. Each stack is a row:

- **State**: `running 3/3` when all its containers run, `partial 2/3` when some do not, `stopped 0/3`, `failed · 0/3` when its last deployment failed, `deploying` while one is queued or running. Hover it for the last deployment's status.
- **Vulnerabilities**: the worst of its images, when [scanning](/guide/vulnerability-scanning) is on.
- **CPU, memory, network and disk**: the stack's total; for network and disk a rate (kB/s) rather than a total since the containers started.

![The stacks list: one row per stack with live figures, two rows unfolded into container cards](/screenshots/stacks.png)

Click a row, or **Expand all**, to unfold one **card per container**: its image, its vulnerabilities, its published ports and volumes, and four curves of the last five minutes. A stack with no container running keeps its cards, greyed and without curves. Rows are folded by default; what you unfolded is remembered by your browser, not by Wharf.

The figures refresh every 5 seconds, only while the tab is visible, and the controller measures each host once whatever the number of open pages. Good to know:

- **It needs agent 0.7.0** on the host. An older agent shows an "update the agent" note in place of the figures; the rest of the list is unaffected.
- **Only the stacks Wharf manages** are measured, and only their running containers. Containers Wharf did not deploy are not.
- **There is no history.** The curves start when you open the page; Wharf keeps nothing between visits.
- **CPU is Docker's own figure**: a percentage of one core, so it can exceed 100% on a busy multi-threaded container, and a stack's CPU is the sum of its containers'.
- **The figures are exact** because the agent reads them from the Docker engine's API. If the agent cannot reach the Docker socket (a remote `DOCKER_HOST`), it falls back to `docker stats`, which rounds to three digits: the rates of a container that has moved gigabytes then come out in coarse steps.

## Working with a stack

- **Name** — editable any time from the stack's own page; nothing else (deployments, image policies, secrets) keys on it, only on the stack's id, so renaming is always safe.
- **Trigger** — changeable any time after creation too, not just at setup (Git stacks only). Switching to **polling** without an existing schedule starts you at `*/15 * * * *`, immediately editable; switching to **webhook** without an existing secret generates one. Switch away and back and whatever secret/schedule you already had is preserved, not regenerated.
- **Deploy now** — enqueues a deployment right away regardless of trigger mode.
- **Undeploy** — stops and removes the stack's containers on its host; the stack's own record (history, keys) stays.
- **Delete** — permanent, and refused while the stack still looks deployed (undeploy first) or while a deployment is mid-flight.
- A deployment's status (queued → running → succeeded/failed) updates live on the page with a spinner while in progress, and a toast once it's done — no manual refresh needed.
- **Edit** (local stacks) — changing the compose file records the previous version as a revision first; nothing is ever lost. Editing doesn't redeploy by itself — deploy afterward to apply it.
- **Containers** — the stack's own running containers, with status and clickable published ports (once the target host has an [address](/guide/hosts#name-and-address) set), right on the stack page — click a name for that container's full detail page (logs, resources, processes).
- **Polling stacks** also get a **Check now** button — runs a real check immediately instead of waiting for the schedule, useful right after pushing a change you don't want to wait for.

- **Topology** — the stack's sources, containers, volumes and networks drawn as a graph under the containers table; see the [topology graph](/guide/topology).

![Stack detail page with its topology and live deployment status](/screenshots/stack-view.png)

## Next

- [Secrets](/guide/secrets) — encrypting values for a stack, Git or local.
- [Image update policies](/guide/image-policies) — keeping a stack's images current.
