# Topology graph

The page of a stack and the page of a host each have a **Topology** panel: the same containers, volumes and networks the other pages list, drawn so that you can see how they connect. It is a picture of what is running now, read from what the agents report. Nothing in it can be clicked to change anything: every box is a link to the page of the thing it shows.

## A stack

![A stack's topology: its sources, its containers, and the volumes and network they use](/screenshots/topology-stack.png)

Read it from left to right.

- **Sources** are what feeds the stack: its Git repository (and branch), each [secret provider](/guide/secret-providers) it is bound to, its local secrets, and its [image policies](/guide/image-policies) with how many have an update waiting.
- **Stack** is the stack itself, with its last deployment (deployed, failed, queued…) and its host.
- **Containers** show the service name, the image (name and tag), whether it is running, and, if [vulnerability scanning](/guide/vulnerability-scanning) is on, the worst vulnerability of its image.
- **Volumes and networks** are the ones those containers use. A solid line is a volume a container mounts, a dashed line a network it joins; a volume shared by two services is one box with two lines. The compose project's prefix is dropped from the names (`monitoring_grafana-data` reads `grafana-data`); hover a box for the full name.

A stack with no container on its host has no graph.

## A host

![A host's topology: its containers by stack, with image, vulnerabilities, networks and volumes](/screenshots/topology-host.png)

The host's containers are grouped **by stack**, one table per stack, and the containers Wharf does not manage (not deployed by a stack, or from a stack that no longer exists) are in a dashed group at the end. A stack's header says how many of its containers are running and carries the worst vulnerability of the lot; a stack with an image that could not be scanned never looks cleaner than what is known.

Each container is one row:

- **Container**: its state (green running, amber restarting or paused, grey stopped) and its name, a link to its page.
- **Image**: name and tag; hover for the full reference. Hidden on a narrow window.
- **Vulnerabilities**: the worst of its image, when [scanning](/guide/vulnerability-scanning) is on.
- **Networks**: every network it is on, each a colored pill. A network keeps its color wherever it appears, so a frontend on a reverse proxy's network and on its stack's backend network shows the proxy's color and the backend's color. Docker's own networks (`bridge`, `host`, `none`) are grey.
- **Volumes**: the Docker volumes it mounts, linked to their page; hover to see who else uses one.

Under the tables, a legend names each network and says who is on it: **shared by** the stacks that have a container on it, or **internal to** one stack. That is what tells you which stacks are connected, and through which network. A last line counts the volumes no container uses.

## Good to know

- It needs nothing beyond what agents already send. An agent that does not report a container's volumes or networks gives boxes without lines, not an error.
- Only **Docker volumes** appear, named or anonymous (an anonymous one has a long hexadecimal name). A bind mount, a host folder mapped into a container, is not a volume and is left out, so a container that only uses bind mounts shows no volume.
- Wharf does not read a reverse proxy's labels, so there is no "Traefik routes to this container" line.
- On a host with many containers the page gets long and scrolls; nothing is cut.
