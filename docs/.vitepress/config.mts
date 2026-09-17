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
        ],
      },
      {
        text: 'GitOps',
        items: [
          { text: 'Stacks', link: '/guide/stacks' },
          { text: 'Secrets', link: '/guide/secrets' },
          { text: 'Git connections', link: '/guide/git-connections' },
          { text: 'Image update policies', link: '/guide/image-policies' },
        ],
      },
      {
        text: 'Docker resources',
        items: [
          { text: 'Containers, images, volumes, networks', link: '/guide/docker-resources' },
        ],
      },
      {
        text: 'Administration',
        items: [
          { text: 'Users & roles', link: '/guide/users' },
          { text: 'Authentication (SSO)', link: '/guide/authentication' },
          { text: 'Private registries', link: '/guide/registries' },
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
