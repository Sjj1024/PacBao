import { defineConfig } from 'vitepress'

const sharedNav = {
    zh: [
        { text: '首页', link: '/' },
        { text: '下载', link: '/download' },
        { text: '使用指南', link: '/guide/introduction' },
        { text: '常见问题', link: '/question/index' },
        { text: '赞助我们', link: '/sponsor/index' },
    ],
    en: [
        { text: 'Home', link: '/en/' },
        { text: 'Download', link: '/en/download' },
        { text: 'Get Started', link: '/en/guide/getting-started' },
        {
            text: 'Support',
            items: [
                { text: 'Sponsor', link: '/en/support/sponsor' },
                { text: 'Custom Development', link: '/en/support/custom' },
            ],
        },
    ],
}

const sharedSidebar = {
    zh: [
        {
            text: '了解 PacBao',
            items: [
                { text: '产品介绍', link: '/guide/introduction' },
                { text: '快速开始', link: '/guide/getting-started' },
                { text: '多端支持', link: '/guide/platforms' },
                { text: '常见问题', link: '/guide/faq' },
            ],
        },
    ],
    en: [
        {
            text: 'About PacBao',
            items: [
                { text: 'Introduction', link: '/en/guide/introduction' },
                { text: 'Get Started', link: '/en/guide/getting-started' },
                { text: 'Platforms', link: '/en/guide/platforms' },
                { text: 'FAQ', link: '/en/guide/faq' },
            ],
        },
    ],
}

/**
 * PacBao official site — product-facing copy, zh / en.
 */
export default defineConfig({
    title: 'PacBao',
    cleanUrls: true,
    lastUpdated: true,

    head: [
        ['link', { rel: 'icon', href: '/logo.png' }],
        ['meta', { name: 'theme-color', content: '#0ea5e9' }],
    ],

    locales: {
        root: {
            label: '简体中文',
            lang: 'zh-CN',
            description:
                '把网址打包成多端应用 — Android / iOS / Windows / macOS',
            themeConfig: {
                nav: sharedNav.zh,
                sidebar: {
                    '/guide/': sharedSidebar.zh,
                },
                footer: {
                    message: '把网站变成多端应用入口',
                    copyright: 'Copyright © 2026 PacBao',
                },
                outline: {
                    label: '本页目录',
                    level: [2, 3],
                },
                docFooter: {
                    prev: '上一页',
                    next: '下一页',
                },
                lastUpdated: {
                    text: '最后更新',
                },
                returnToTopLabel: '回到顶部',
                sidebarMenuLabel: '菜单',
                darkModeSwitchLabel: '主题',
                langMenuLabel: '切换语言',
            },
        },
        en: {
            label: 'English',
            lang: 'en-US',
            description:
                'Turn websites into multi-platform apps — Android / iOS / Windows / macOS',
            themeConfig: {
                nav: sharedNav.en,
                sidebar: {
                    '/en/guide/': sharedSidebar.en,
                },
                footer: {
                    message: 'Turn websites into multi-platform app entries',
                    copyright: 'Copyright © 2026 PacBao',
                },
                outline: {
                    label: 'On this page',
                    level: [2, 3],
                },
                docFooter: {
                    prev: 'Previous',
                    next: 'Next',
                },
                lastUpdated: {
                    text: 'Last updated',
                },
                returnToTopLabel: 'Back to top',
                sidebarMenuLabel: 'Menu',
                darkModeSwitchLabel: 'Theme',
                langMenuLabel: 'Change language',
            },
        },
    },

    themeConfig: {
        logo: '/logo.png',
        siteTitle: 'PacBao',
        socialLinks: [{ icon: 'github', link: 'https://github.com/PakePlus' }],
        search: {
            provider: 'local',
            options: {
                locales: {
                    root: {
                        translations: {
                            button: {
                                buttonText: '搜索',
                                buttonAriaLabel: '搜索文档',
                            },
                            modal: {
                                noResultsText: '未找到相关结果',
                                resetButtonTitle: '清除查询',
                                footer: {
                                    selectText: '选择',
                                    navigateText: '切换',
                                    closeText: '关闭',
                                },
                            },
                        },
                    },
                    en: {
                        translations: {
                            button: {
                                buttonText: 'Search',
                                buttonAriaLabel: 'Search docs',
                            },
                            modal: {
                                noResultsText: 'No results found',
                                resetButtonTitle: 'Clear query',
                                footer: {
                                    selectText: 'to select',
                                    navigateText: 'to navigate',
                                    closeText: 'to close',
                                },
                            },
                        },
                    },
                },
            },
        },
    },
})
