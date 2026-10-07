import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Wharf',
  description: 'A self-hosted GitOps deployment controller and agent for Docker standalone + Compose.',
  cleanUrls: true,
  lastUpdated: true,
  base: '/',
  head: [
    ['link', { rel: 'icon', href: '/favicon.svg' }],
  ],
  sitemap: {
    hostname: "https://wharf.forgelab.me"
  },

  themeConfig: {
    logo: '/favicon.svg',

    nav: [
      { text: 'Guide', link: '/guide/introduction' },
      { text: 'GitHub', link: 'https://github.com/forgelab-me/wharf-server' },
    ],

    sidebar: [
      {
        text: 'Introduction',
        items: [
          { text: 'What is Wharf?', link: '/guide/introduction' },
          { text: 'Quick start', link: '/guide/quick-start' },
        ],
      },
      {
        text: 'Fleet',
        items: [
          { text: 'Hosts', link: '/guide/hosts' },
          { text: 'Topology graph', link: '/guide/topology' },
        ],
      },
      {
        text: 'GitOps',
        items: [
          { text: 'Stacks', link: '/guide/stacks' },
          { text: 'Git connections', link: '/guide/git-connections' },
          { text: 'Image update policies', link: '/guide/image-policies' },
        ],
      },
      {
        text: 'Secrets',
        items: [
          { text: 'Secrets', link: '/guide/secrets' },
          { text: 'Secret references', link: '/guide/secret-references' },
          { text: 'Secret providers', link: '/guide/secret-providers' },
          { text: 'OpenBao / Vault', link: '/guide/openbao-vault' },
          { text: 'Bitwarden', link: '/guide/bitwarden' },
          { text: 'Path rules', link: '/guide/path-rules' },
        ],
      },
      {
        text: 'Docker resources',
        items: [
          { text: 'Containers, images, volumes, networks', link: '/guide/docker-resources' },
          { text: 'Volume backups', link: '/guide/volume-backups' },
          { text: 'Vulnerability scanning', link: '/guide/vulnerability-scanning' },
        ],
      },
      {
        text: 'Administration',
        items: [
          { text: 'Users & roles', link: '/guide/users' },
          { text: 'Authentication (SSO)', link: '/guide/authentication' },
          { text: 'Private registries', link: '/guide/registries' },
          { text: 'Audit log', link: '/guide/audit-log' },
          { text: 'Backup & Restore', link: '/guide/backup-restore' },
          { text: 'Notifications', link: '/guide/notifications' },
          { text: 'Health checks', link: '/guide/monitoring' },
        ],
      },
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/forgelab-me/wharf-server' },
    ],

    search: {
      provider: 'local',
    },

    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2026 forgelab-me',
    },

    editLink: {
      pattern: 'https://github.com/forgelab-me/wharf-site/edit/main/docs/:path',
    },
  },
})
