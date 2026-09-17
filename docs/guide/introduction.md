# What is Wharf?

Wharf is a self-hosted GitOps deployment controller and agent for **Docker standalone and Compose** — deliberately not Swarm, not Kubernetes. If you're not running one of those orchestrators, there's nothing here trying to manage them anyway.

## Why

Docker only ships a real secret primitive (`docker secret create` — encrypted at rest, mounted as tmpfs, never written to a container's writable layer) under **Swarm**. In standalone and non-Swarm Compose, a `secrets:` block is just a bind mount in disguise: no encryption at rest, no access control beyond ordinary file permissions.

Wharf exists to close that gap end to end. Every design decision is measured against one question: does this compensate for something standalone Docker's engine genuinely lacks, or is it just deployment convenience? Convenience has its place, but never at the expense of the security properties that are the actual reason this project exists.

## What it does

- **GitOps stacks** — deploy from a Git repository (SSH or HTTPS, per-stack or shared credentials) or author a Compose file directly in the UI. Manual, webhook, or polling triggers.
- **Encrypted secrets, server-held keys** — each stack gets its own [age](https://age-encryption.org) keypair; the private half never leaves the controller. Accepts secrets encrypted as a plain age file or as real [SOPS](https://github.com/getsops/sops) output (age backend) — bring the workflow you already use.
- **Fleet of agents over mTLS** — agents enroll with a self-signed, fingerprint-pinned connection ("connect first, approve later") and execute deploys locally; no shared credentials sprayed across hosts.
- **Live fleet visibility** — containers, images, volumes, and networks across every connected host, kept in sync over a persistent tunnel: logs, process lists, resource charts, on-demand disk usage, all without the controller ever polling an agent it doesn't have to.
- **Image auto-update policies** — pin, auto-redeploy, or just flag when a tag's digest moves, checked against any registry that speaks the Docker Registry v2 protocol (Docker Hub, GHCR, GitLab, ACR, self-hosted Harbor/Nexus — discovered dynamically, not hardcoded per vendor).
- **Private registry credentials** — named, typed entries used both for the digest check and for the actual `docker login` an agent performs before pulling on deploy.
- **Multi-user with roles** — admin/operator accounts, plus OIDC/SSO for any standard-compliant provider (Authelia, Keycloak, Authentik, ...), with optional AD/LDAP-group-to-role mapping and an optional local-auth lockout for SSO-only shops.

![Dashboard overview](/screenshots/dashboard.png)

## Architecture

Two processes, talking over two different channels:

- The **controller** serves the UI and holds two physically separate stores — the main database (stacks, hosts, deployments, image policies) and an isolated `secrets-service` store (private keys, registry credentials), opened by a different code path with its own file permissions. A SQL-injection bug in the main store still can't read a private key it was never given a handle to.
- An **agent** runs on every Docker host, holding `docker.sock` — nothing else does. It reaches the controller over one persistent mTLS tunnel that carries state (containers/images/volumes/networks), commands (restart, deploy, decrypt-relay), and nothing else. It talks to a Git host and a registry **directly** — that traffic never passes through the controller at all.

<figure>
<svg viewBox="0 0 860 380" role="img" aria-label="Wharf's architecture: a browser talks to the Controller's UI; the Controller holds two separate stores, a main database and an isolated secrets-service; the Controller and each host's Agent talk over one persistent mTLS tunnel carrying state, commands, and a secrets relay; the Agent reaches a Git host and a registry directly, not through the Controller." xmlns="http://www.w3.org/2000/svg">
  <defs>
    <marker id="arrow2" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor" />
    </marker>
    <marker id="arrow2Accent" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="#2dd4bf" />
    </marker>
  </defs>

  <!-- Browser -->
  <rect x="20" y="150" width="140" height="60" rx="8" fill="none" stroke="currentColor" stroke-opacity="0.5" />
  <text x="90" y="185" text-anchor="middle" font-size="13" font-weight="600" fill="currentColor">Browser</text>

  <!-- arrow browser -> controller -->
  <line x1="160" y1="180" x2="196" y2="180" stroke="currentColor" stroke-opacity="0.5" marker-end="url(#arrow2)" />
  <text x="178" y="165" text-anchor="middle" font-size="10" fill="currentColor" fill-opacity="0.7">UI</text>

  <!-- Controller -->
  <rect x="200" y="40" width="280" height="260" rx="8" fill="none" stroke="currentColor" stroke-opacity="0.5" />
  <text x="215" y="62" font-size="13" font-weight="600" fill="currentColor">Controller</text>

  <rect x="218" y="78" width="118" height="104" rx="6" fill="none" stroke="currentColor" stroke-opacity="0.4" />
  <text x="277" y="100" text-anchor="middle" font-size="11.5" font-weight="600" fill="currentColor">Main DB</text>
  <text x="277" y="120" text-anchor="middle" font-size="10" fill="currentColor" fill-opacity="0.65">stacks · hosts</text>
  <text x="277" y="136" text-anchor="middle" font-size="10" fill="currentColor" fill-opacity="0.65">deployments</text>
  <text x="277" y="152" text-anchor="middle" font-size="10" fill="currentColor" fill-opacity="0.65">image policies</text>

  <rect x="344" y="78" width="118" height="104" rx="6" fill="#2dd4bf" fill-opacity="0.08" stroke="#2dd4bf" stroke-opacity="0.6" />
  <text x="403" y="100" text-anchor="middle" font-size="11.5" font-weight="600" fill="#2dd4bf">secrets-service</text>
  <text x="403" y="120" text-anchor="middle" font-size="10" fill="currentColor" fill-opacity="0.75">private keys</text>
  <text x="403" y="136" text-anchor="middle" font-size="10" fill="currentColor" fill-opacity="0.75">registry creds</text>
  <text x="403" y="152" text-anchor="middle" font-size="10" font-weight="600" fill="#2dd4bf">isolated store</text>

  <text x="340" y="270" text-anchor="middle" font-size="10" fill="currentColor" fill-opacity="0.6">agent channel — :8443 (mTLS)</text>

  <!-- arrow controller <-> agent -->
  <line x1="480" y1="185" x2="606" y2="185" stroke="#2dd4bf" marker-start="url(#arrow2Accent)" marker-end="url(#arrow2Accent)" />
  <text x="543" y="175" text-anchor="middle" font-size="10" fill="#2dd4bf">state · commands</text>
  <text x="543" y="205" text-anchor="middle" font-size="10" fill="#2dd4bf">secrets relay</text>

  <!-- Agent -->
  <rect x="610" y="150" width="160" height="70" rx="8" fill="none" stroke="currentColor" stroke-opacity="0.5" />
  <text x="690" y="176" text-anchor="middle" font-size="13" font-weight="600" fill="currentColor">Agent</text>
  <text x="690" y="194" text-anchor="middle" font-size="10" fill="currentColor" fill-opacity="0.65">one per connected host</text>
  <text x="690" y="209" text-anchor="middle" font-size="10" fill="currentColor" fill-opacity="0.65">holds docker.sock</text>

  <!-- Git host -->
  <rect x="610" y="20" width="160" height="60" rx="8" fill="none" stroke="currentColor" stroke-opacity="0.5" />
  <text x="690" y="45" text-anchor="middle" font-size="13" font-weight="600" fill="currentColor">Git host</text>
  <text x="690" y="63" text-anchor="middle" font-size="10" fill="currentColor" fill-opacity="0.6">(external)</text>

  <!-- Registry -->
  <rect x="610" y="300" width="160" height="60" rx="8" fill="none" stroke="currentColor" stroke-opacity="0.5" />
  <text x="690" y="325" text-anchor="middle" font-size="13" font-weight="600" fill="currentColor">Registry</text>
  <text x="690" y="343" text-anchor="middle" font-size="10" fill="currentColor" fill-opacity="0.6">(external)</text>

  <!-- arrow agent -> git host -->
  <line x1="690" y1="150" x2="690" y2="84" stroke="currentColor" stroke-opacity="0.5" marker-end="url(#arrow2)" />
  <text x="702" y="118" font-size="10" fill="currentColor" fill-opacity="0.7">git clone</text>

  <!-- arrow agent -> registry -->
  <line x1="690" y1="220" x2="690" y2="296" stroke="currentColor" stroke-opacity="0.5" marker-end="url(#arrow2)" />
  <text x="702" y="262" font-size="10" fill="currentColor" fill-opacity="0.7">docker pull</text>
</svg>
<figcaption>The controller and each host's agent share one persistent mTLS tunnel; a Git host and a registry are reached by the agent directly, never proxied through the controller.</figcaption>
</figure>

The controller also talks to a registry on its own, separately from any agent — checking whether a tracked image's tag has moved to a new digest (see [image update policies](/guide/image-policies)) doesn't need a host at all.

## Next

Head to the [quick start](/guide/quick-start) to get a controller and an agent running, or jump straight to a specific area in the sidebar.
