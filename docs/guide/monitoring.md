# Health checks

Wharf's own [notifications](/guide/notifications) tell you when an agent goes dark or a deployment fails. They are sent *by the controller*, so they stop exactly when the controller does. To know that the controller itself is down, something outside it has to ask. The controller and the agent therefore each have a health check that Docker, `docker ps` and any monitoring tool can read.

| | How it answers | Healthy means |
|---|---|---|
| **Controller** | `GET /healthz`, no login | Both of its databases respond |
| **Agent** | `wharf-agent healthcheck`, no port | The controller answers it and, once approved, the host state keeps reaching the controller |

Both images carry a `HEALTHCHECK`, so `docker ps` shows `(healthy)` or `(unhealthy)` next to each container with nothing to configure. Docker only *marks* a container unhealthy: it does not restart it. Use the status to alert, or add a tool such as [autoheal](https://github.com/willfarrell/docker-autoheal) if you want a restart.

## The controller

`GET /healthz` is served on the UI ports (`8080` over HTTP, `9443` over HTTPS) and needs no session:

```bash
curl -i http://wharf.example.lan:8080/healthz
```

| Answer | Meaning |
|---|---|
| `200` and the body `ok` | The main database and the secrets store both responded |
| `503` and the body `unhealthy` | One of them did not respond within 3 seconds |

The body never says more than that, on purpose: the route has no login, so it reveals no version and does not name what failed. The cause is in the controller's log (`healthz: unhealthy: main database: …`, at most once a minute). The agents' port, `8443`, does not serve it, since it requires a client certificate.

The image checks `http://127.0.0.1:8080/healthz` every 30 seconds, from inside the container, so it works whatever ports you publish.

### Watching it from outside

Point your monitoring at it. With [Uptime Kuma](https://github.com/louislam/uptime-kuma), for example, add an **HTTP(s)** monitor on `https://wharf.example.lan:9443/healthz` expecting status `200`, and tick *Ignore TLS/SSL errors* if you use the controller's self-signed certificate.

If a reverse proxy or an SSO gateway (Authelia, Authentik…) sits in front of Wharf, let `/healthz` through without a login, or the probe will get the login page instead of the answer.

## The agent

The agent listens on no port: it connects out to the controller. Opening one only for a health check would add an attack surface for little, so its health is a small state file the running agent keeps up to date, read by `wharf-agent healthcheck`. It reports healthy when:

- **the controller answered the agent in the last minute** (the agent asks every 10 seconds), so the network, the pinned certificate and the agent's identity all work; and
- **once the host is approved, its state reached the controller in the last two minutes** (it is pushed at least every 45 seconds), so Docker answers and the tunnel is up. A freshly approved agent has 150 seconds to push its first state.

An agent **waiting for approval** is healthy: the controller answers, and waiting is its normal state. When the check fails, it says why:

```bash
docker exec wharf-agent wharf-agent healthcheck
# unhealthy: the controller has not answered for over a minute
# unhealthy: no host state has reached the controller recently (Docker or the tunnel)
```

Read the status the way Docker shows it:

```bash
docker inspect --format '{{.State.Health.Status}}' wharf-agent
```

An agent image from before the health check shows no status in `docker ps`.

## What they don't cover

- **Your stacks.** A container that crashes, or that Docker restarts under its `restart:` policy, is not tracked: Wharf shows its current state, and the [audit log](/guide/audit-log#what-isnt-logged) does not keep a history of restarts. For an application that can hang while its process runs, give it its own `healthcheck:` in its compose file; Docker then reports `unhealthy` for that container too, and the Containers page shows its state.
- **Metrics.** There is no metrics endpoint. The pages of Wharf show live figures, and the health checks above only say whether it works.
