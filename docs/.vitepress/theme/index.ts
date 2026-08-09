import DefaultTheme from 'vitepress/theme'
import type { Theme } from 'vitepress'
import DownloadPanel from '../../components/DownloadPanel.vue'
import './custom.css'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('DownloadPanel', DownloadPanel)
  },
} satisfies Theme
