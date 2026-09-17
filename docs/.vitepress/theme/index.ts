// Wraps the default theme purely to wire up vitepress-mermaid-renderer --
// nothing else about the theme is customized. Mermaid needs an explicit
// light/dark palette (it has no "follow currentColor" mode like the
// hand-authored SVG diagrams elsewhere in these docs), so the renderer is
// (re)initialized whenever VitePress's own isDark flips, keeping diagrams
// in sync with the site's own theme toggle rather than a fixed palette.
import { h, nextTick, watch } from 'vue'
import type { Theme } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import { useData } from 'vitepress'
import { createMermaidRenderer } from 'vitepress-mermaid-renderer'

export default {
  extends: DefaultTheme,
  Layout: () => {
    const { isDark } = useData()

    const initMermaid = () => {
      createMermaidRenderer({
        theme: isDark.value ? 'dark' : 'forest',
        startOnLoad: false,
      })
    }

    nextTick(() => initMermaid())
    watch(() => isDark.value, () => initMermaid())

    return h(DefaultTheme.Layout)
  },
} satisfies Theme
