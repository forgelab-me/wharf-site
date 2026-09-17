# Quick start

```bash
mkdir wharf && cd wharf
cat > .env <<'EOF'
WHARF_ADMIN_USER=admin
WHARF_ADMIN_PASSWORD=change-me-immediately
EOF
cat > docker-compose.yml <<'EOF'
services:
  controller:
    image: ghcr.io/forgelab-me/wharf-server:latest
    restart: unless-stopped
    ports:
      - "8080:8080"   # UI (HTTP)
      - "8443:8443"   # agent enrollment/command channel
      - "9443:9443"   # UI (HTTPS)
    environment:
      WHARF_ADMIN_USER: ${WHARF_ADMIN_USER:?WHARF_ADMIN_USER must be set in .env}
      WHARF_ADMIN_PASSWORD: ${WHARF_ADMIN_PASSWORD:?WHARF_ADMIN_PASSWORD must be set in .env}
    volumes:
      - wharf-data:/data

volumes:
  wharf-data:
EOF
docker compose up -d
```

Building from source instead? No local Go toolchain needed either way — `docker build -f server/Dockerfile server` from a clone of the repo builds the same image `docker compose` would otherwise pull.

The controller serves the UI on `:8080` (HTTP) and `:9443` (HTTPS), and the agent enrollment/command channel on `:8443`. Sign in at `http://localhost:8080` with the admin credentials from `.env` — you'll be forced to change that password on first login.

## Connecting an agent

Grab the controller's certificate fingerprint from the **Hosts** page in the UI, then on the machine you want to deploy to:

```bash
docker run -d \
  --name wharf-agent \
  --restart unless-stopped \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v /opt/wharf-agent/identity:/var/lib/wharf-agent/identity \
  -v /opt/wharf-agent/stacks:/opt/wharf-agent/stacks \
  ghcr.io/forgelab-me/wharf-agent:latest \
  --controller=https://<controller-host>:8443 \
  --controller-fingerprint=sha256:<fingerprint-shown-in-the-ui>
```

The Hosts page has this exact command ready to copy, fingerprint already filled in — safer than retyping it, since a wrong fingerprint just fails to connect rather than connecting to the wrong controller.

The new agent shows up **pending** on the Hosts page the moment it connects. Nothing deploys to it until an admin clicks **Approve**; **Reject** removes the enrollment outright (it can always retry and re-appear) — see [Hosts](/guide/hosts).

![Hosts page, pending approval card](/screenshots/hosts.png)

## Next

Once you have at least one approved host, head to [Stacks](/guide/stacks) to deploy something.
