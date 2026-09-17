# Hosts

A host is a Docker machine running `wharf-agent`. Nothing deploys anywhere until a host is enrolled *and* approved.

## Add an agent

The Hosts page has a ready-to-copy `docker run` command with the controller's certificate fingerprint already filled in. Run it on the target machine; the agent shows up under **Pending approval** the moment it connects for the first time.

::: warning Keep the stacks volume a bind mount at the same path
The generated command mounts `-v /opt/wharf-agent/stacks:/opt/wharf-agent/stacks` — host path and container path identical, not a named volume. That's required, not cosmetic: the agent runs `docker compose` from inside its own container but against the *host's* Docker daemon (it only has the host's `docker.sock`, cf. [Host details](#host-details)), so a [`file:`-sourced compose secret](/guide/secrets#local-stacks) resolves to an absolute path the agent computes from its own filesystem view — and that exact path has to exist on the host's filesystem too, for the daemon to bind-mount it. Swap this for a named volume (or a bind mount at a different path) and any `file:`-sourced secret fails to deploy with `bind source path does not exist`; env-substituted (`${KEY}`) and `environment:`-sourced secrets are unaffected either way.
:::

## Approve or reject

Click **Approve** on a pending host. It moves to **Connected hosts**, and only from that point on can a stack be deployed to it. **Reject** removes the enrollment instead — there's nothing to undo, and a rejected agent can simply retry later and show up again as a fresh pending entry.

![Connected hosts table](/screenshots/hosts.png)

## Name and address

Both a host's **Name** and its **Address** (reachable IP or hostname) are editable any time, from the connected-hosts table or from the host's own detail page — a rename never affects deployments or fleet data, since everything actually keys on the host's id, not its display name. Set the address once per host and Wharf can turn a container's published ports into real clickable links on the Containers and stack pages; leave it blank and ports just show as plain text.

## Host details

Click a host's name to see its own page: live CPU/memory (aggregated across every container `docker stats` reports for that host — the agent only has `docker.sock`, not the host's own `/proc`, so this is "everything Docker is running there," not the whole machine) plus aggregate network/disk I/O, live while the page is open, no history kept. Below the charts, a **Disk** table — Docker's own footprint on that host: images, containers, volumes, and build cache, each with a count, total size, and how much of it is reclaimable, the same figures `docker system df` would report.

![Host detail page, live resource charts and disk footprint](/screenshots/host-detail.png)
