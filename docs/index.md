---
layout: home

hero:
  name: Wharf
  text: GitOps for Docker standalone + Compose
  tagline: No Swarm, no Kubernetes — a self-hosted deployment controller and agent for the Docker most self-hosters actually run.
  actions:
    - theme: brand
      text: What is Wharf?
      link: /guide/introduction
    - theme: alt
      text: Quick start
      link: /guide/quick-start
    - theme: alt
      text: GitHub
      link: https://github.com/forgelab-me/wharf-server

features:
  - title: Encrypted secrets, server-held keys
    details: Each stack gets its own age keypair; the private half never leaves the controller. Accepts plain age or real SOPS output, or reads from OpenBao, Vault or Bitwarden by reference.
  - title: A fleet of agents over mTLS
    details: Agents enroll with a self-signed, fingerprint-pinned connection — connect first, approve later. No shared credentials sprayed across hosts.
  - title: Live fleet visibility
    details: Containers, images, volumes, and networks across every connected host, pushed over a persistent tunnel — logs, processes, resource charts, on demand. The stacks list shows each stack's state, CPU, memory, network and disk live.
  - title: A graph of what runs
    details: A topology panel on every stack and host draws the containers, volumes and networks and how they connect, from what the agents report.
  - title: Image auto-update policies
    details: Pin, auto-redeploy, or just flag when a tag's digest moves, against any registry that speaks the Docker Registry v2 protocol.
  - title: Vulnerability scanning
    details: Optional. Shows the known CVEs of every image your fleet runs, and of the update that would come next, before you apply it. A view, not a gate.
  - title: Multi-user, with real SSO
    details: Admin/operator roles, OIDC for any standard-compliant provider, and optional AD/LDAP-group-to-role mapping.
  - title: GitOps or just paste a compose file
    details: Deploy from a Git repository on a schedule or webhook, or author a stack directly in the UI — manual, webhook, and polling triggers all work either way.
  - title: Volume backups
    details: Named volumes copied to a SMB share on a schedule, encrypted and deduplicated with restic, with retention and a restore into a new volume.
  - title: An operational safety net
    details: An append-only audit log, encrypted backup and restore of both databases and the controller's identity, and webhook notifications for what goes wrong.
---
