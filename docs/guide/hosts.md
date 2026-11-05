# Hosts

A host is a Docker machine running `wharf-agent`. Nothing deploys anywhere until a host is enrolled *and* approved.

## Add an agent

The Hosts page has a ready-to-copy `docker run` command with the controller's certificate fingerprint already filled in. Run it on the target machine; the agent shows up under **Pending approval** the moment it connects for the first time.

::: warning Keep the stacks volume a bind mount at the same path
The generated command mounts `-v /opt/wharf-agent/stacks:/opt/wharf-agent/stacks` — host path and container path identical, not a named volume. That's required, not cosmetic: the agent runs `docker compose` from inside its own container but against the *host's* Docker daemon (it only has the host's `docker.sock`, cf. [Host details](#host-details)), so a [`file:`-sourced compose secret](/guide/secrets#local-stacks) resolves to an absolute path the agent computes from its own filesystem view — and that exact path has to exist on the host's filesystem too, for the daemon to bind-mount it. Swap this for a named volume (or a bind mount at a different path) and any `file:`-sourced secret fails to deploy with `bind source path does not exist`; env-substituted (`${KEY}`) and `environment:`-sourced secrets are unaffected either way.
:::

## Approve or reject

Click **Approve** on a pending host. It moves to **Connected hosts**, and only from that point on can a stack be deployed to it. **Reject** removes the enrollment instead — there's nothing to undo, and a rejected agent can simply retry later and show up again as a fresh pending entry.

Until it is approved, a host can do nothing on the agent channel: the controller answers 403 to its commands, secret requests, reports and tunnel, whatever the interface shows.

A pending agent nobody approves is removed after 24 hours, and at most 50 can wait at once (a further one is refused with a 429, retry later). Both limits are environment variables of the controller: `WHARF_PENDING_TTL` (e.g. `12h`, `0` to keep them forever) and `WHARF_MAX_PENDING` (`0` for no limit). An agent that is still running when its entry disappears simply enrolls again and shows up as a new pending entry.

## Enrollment token

To enroll an agent without the manual approval, click **Generate an enrollment token** under *Add an agent*. The `docker run` command then includes `--enrollment-token=…`. The token:

- works **once** and expires after **one hour**;
- is shown **only once** — the controller keeps just a hash, so reload the page and it is gone (generate another);
- approves the agent that uses it on first contact, in place of the click on **Approve** — so the usual comparison of the agent's fingerprint is skipped for that agent. The token travels over the pinned TLS connection, but it stays readable in `docker inspect` until it is used or expires;
- is ignored by an agent the controller already knows, and refused (401) once used or expired.

Set `WHARF_REQUIRE_ENROLLMENT_TOKEN=true` on the controller to refuse every new agent that doesn't present a valid token — the manual approval flow is then closed. Agents already enrolled are not affected. Needs agent 0.10.0 or later to send the token.

## Certificate rotation

An agent's identity is a self-signed certificate pinned by the controller. From agent 0.10.0 the agent replaces it by itself once it is older than 90 days (`--rotate-after`, `0` to disable), with no re-approval and no action on your side. It generates the new key on the host, announces only the public certificate, and the controller accepts both until the new one is first used, then forgets the old one. A crash at any point is recovered at the next start. Rotation needs controller 0.21.0 or later; against an older one it is refused and retried every 10 minutes, with no effect on the agent.

To revoke a host you suspect is compromised, remove it (or reject it while pending): its certificate stops being accepted at once.

![Connected hosts table](/screenshots/hosts.png)

## Name and address

Both a host's **Name** and its **Address** (reachable IP or hostname) are editable any time, from the connected-hosts table or from the host's own detail page — a rename never affects deployments or fleet data, since everything actually keys on the host's id, not its display name. Set the address once per host and Wharf can turn a container's published ports into real clickable links on the Containers and stack pages; leave it blank and ports just show as plain text.

## Agent version

[Volume backups](/guide/volume-backups) need agent 0.9.1 or later: a host running an older agent is refused with a message that says so.

Each connected agent reports its own version on every state push, shown as a column on the hosts table and on the host's own page. An **update available** badge appears next to it once a newer `wharf-agent` release exists — checked every few hours against the real GitHub tags, same mechanism as the controller's own version badge in the sidebar. Purely informational: nothing here updates an agent automatically yet. (Agents from 0.6.0 also report each image's registry digest and the host's CPU architecture, which [vulnerability scanning](/guide/vulnerability-scanning) needs; an older agent still works, its containers just are not scanned. Agents from 0.7.0 also measure containers for the [stacks list](/guide/stacks#the-stacks-list)'s live figures.) Until it does, [`scripts/update-agent.sh`](https://github.com/forgelab-me/wharf-agent/blob/main/scripts/update-agent.sh) in the agent repo is a ready-made stand-in — run on the host itself, it pulls the current tag, compares digests, and only removes/recreates the container if there's actually a newer image, cron-friendly with `-y`.

## Host details

Click a host's name to see its own page: live CPU/memory (aggregated across every container `docker stats` reports for that host — the agent only has `docker.sock`, not the host's own `/proc`, so this is "everything Docker is running there," not the whole machine) plus aggregate network/disk I/O, live while the page is open, no history kept. Below the charts, a **Disk** table — Docker's own footprint on that host: images, containers, volumes, and build cache, each with a count, total size, and how much of it is reclaimable, the same figures `docker system df` would report.

Above the charts, a **Topology** panel lists the host's containers by stack, with their image, vulnerabilities, networks and volumes — see the [topology graph](/guide/topology).

![Host detail page, its topology, live resource charts and disk footprint](/screenshots/host-detail.png)
