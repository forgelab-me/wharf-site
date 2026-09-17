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
    details: Each stack gets its own age keypair; the private half never leaves the controller. Accepts plain age or real SOPS output — bring the workflow you already use.
  - title: A fleet of agents over mTLS
    details: Agents enroll with a self-signed, fingerprint-pinned connection — connect first, approve later. No shared credentials sprayed across hosts.
  - title: Live fleet visibility
    details: Containers, images, volumes, and networks across every connected host, pushed over a persistent tunnel — logs, processes, resource charts, on demand.
  - title: Image auto-update policies
    details: Pin, auto-redeploy, or just flag when a tag's digest moves, against any registry that speaks the Docker Registry v2 protocol.
  - title: Multi-user, with real SSO
    details: Admin/operator roles, OIDC for any standard-compliant provider, and optional AD/LDAP-group-to-role mapping.
  - title: GitOps or just paste a compose file
    details: Deploy from a Git repository on a schedule or webhook, or author a stack directly in the UI — manual, webhook, and polling triggers all work either way.
---
