'use client'

import Link from 'next/link'
import dynamic from 'next/dynamic'
import { usePathname, useRouter } from 'next/navigation'
import { useCallback, useEffect, useId, useRef, useState } from 'react'
import {
    formErrorClass,
    formInputClass,
    formLabelClass,
    windowSizeInputClass,
} from '@/components/app-detail/form-field-styles'
import { FormSingleSelect } from '@/components/app-detail/form-single-select'
import { AppIconEditor } from '@/components/app-detail/app-icon-editor'
import {
    AppDetailHeader,
    type DetailSection,
    type MoreMenuAction,
} from '@/components/app-detail/app-detail-header'
import {
    PublishDialog,
    type PublishDialogLabels,
    type PublishDialogMode,
} from '@/components/app-detail/publish-dialog'
import { ReleaseHistorySection } from '@/components/app-detail/release-history-section'
import {
    PhoneConfigSection,
    type PhoneConfigLabels,
} from '@/components/app-detail/phone-config-section'
import {
    DesktopConfigSection,
    type DesktopConfigLabels,
    type DesktopWindowOptionKey,
} from '@/components/app-detail/desktop-config-section'
import {
    StartupConfigSection,
    type StartupConfigLabels,
} from '@/components/app-detail/startup-config-section'
import { headerIconButtonClass } from '@/components/home/header-actions'
import { useAuthUser } from '@/hooks/use-auth-user'
import {
    DEFAULT_ICON_BORDER_RADIUS,
    getDefaultIconTransform,
    type IconTransform,
} from '@/lib/app-icon-render'
import { MessageDialog } from '@/components/message-dialog'
import { ToastMessage } from '@/components/toast-message'
import { PageShell } from '@/components/layout/page-shell'
import { APP_DETAIL_STRINGS, type AppDetailStrings } from '@/locales/app-detail'
import { HOME_STRINGS } from '@/locales/home'
import { selectLocale, useLocaleStore } from '@/stores/locale-store'
import { appIdFromPathname } from '@/lib/app-detail-route'
import { createBuildTask, BuildTaskApiError } from '@/lib/build-task-api'
import { FileApiError, resolveIconPair, toIconSrc } from '@/lib/file-api'
import { migrateProjectIconsToDisk } from '@/lib/migrate-project-icons'
import {
    listenPackProgress,
    packAndroid,
    packIos,
    packMacos,
    packWebclip,
    packWindows,
    PackApiError,
    revealPath,
    templateEnsure,
} from '@/lib/pack-api'
import { openPreviewWindow } from '@/lib/preview-window'
import type { AppProject } from '@/lib/project-types'
import { useLoadingStore } from '@/stores/loading-store'
import { usePackStore } from '@/stores/pack-store'
import {
    applyFormToPpConfig,
    applyMobilePublishToPpConfig,
    applyPublishToPpConfig,
    buildMobilePublishTaskPayload,
    buildPpConfigFromApiProject,
    buildPublishTaskPayload,
    mobilePublishInitialValuesFromPpConfig,
    PUBLISH_METHOD_CLOUD,
    PUBLISH_METHOD_LOCAL,
    PUBLISH_METHOD_ELECTRON,
    PUBLISH_PLATFORM_ANDROID,
    PUBLISH_PLATFORM_IOS,
    PUBLISH_PLATFORM_IOSCLIP,
    PUBLISH_PLATFORM_WINDOWS,
    PUBLISH_PLATFORM_MACOS,
    PUBLISH_PLATFORM_LINUX_ARM,
    PUBLISH_PLATFORM_LINUX_X64,
    PUBLISH_PLATFORM_MAC_ARM,
    PUBLISH_PLATFORM_MAC_X64,
    PUBLISH_PLATFORM_WIN_ARM,
    PUBLISH_PLATFORM_WIN_X64,
    publishInitialValuesFromPpConfig,
    type PublishFormValues,
    type PpConfig,
} from '@/lib/ppconfig'
import {
    deleteProject as deleteProjectApi,
    getProject,
    ProjectApiError,
    updateProject as updateProjectApi,
} from '@/lib/project-api'
import {
    mergeProjectFromApi,
    selectDeleteProject,
    selectProjectById,
    selectUpdateProject,
    selectUpsertProject,
    useProjectStore,
} from '@/stores/project-store'

const ScriptEditorSection = dynamic(
    () =>
        import('@/components/app-detail/script-editor-section').then(
            (mod) => mod.ScriptEditorSection,
        ),
    {
        ssr: false,
        loading: () => (
            <div className="flex min-h-[28rem] items-center justify-center rounded-2xl border border-zinc-200 bg-zinc-950 text-sm text-zinc-400 dark:border-zinc-700">
                Loading editor?
            </div>
        ),
    },
)

type FormFields = 'show_name' | 'url' | 'app_id' | 'version'

type WindowMode = 'desktop' | 'android' | 'ios' | 'ipad' | 'custom'

const WINDOW_SIZE_PRESETS: Record<
    Exclude<WindowMode, 'custom'>,
    { width: number; height: number }
> = {
    desktop: { width: 1200, height: 800 },
    android: { width: 360, height: 800 },
    ios: { width: 375, height: 812 },
    ipad: { width: 768, height: 1024 },
}

const versionPattern = /^\d+\.\d+\.\d+$/

const AUTO_SAVE_DELAY_MS = 700

type FormSnapshotInput = {
    show_name: string
    url: string
    app_id: string
    version: string
    description: string
    keepWindow: boolean
    singleton: boolean
    icon: string
    iconSource: string
    iconBorderRadius: number
    iconTransform: IconTransform
}

function buildFormSnapshot(input: FormSnapshotInput): string {
    return JSON.stringify({
        show_name: input.show_name.trim(),
        url: input.url.trim(),
        app_id: input.app_id.trim(),
        version: input.version.trim() || '1.0.0',
        description: input.description.trim(),
        keepWindow: input.keepWindow,
        singleton: input.singleton,
        icon: input.icon,
        iconSource: input.iconSource,
        iconBorderRadius: input.iconBorderRadius,
        iconTransform: input.iconTransform,
    })
}

function buildLocalPackProject(input: {
    id: string
    name: string
    url: string
    packageId: string
    version: string
    description: string
    icon: string
    debug: boolean
    windowPersist: boolean
    singleton: boolean
    createdAt: number
}): AppProject {
    const now = Date.now()
    return {
        id: input.id,
        name: input.name,
        url: input.url,
        packageId: input.packageId,
        version: input.version,
        description: input.description,
        // May be a data/blob URL; packAndroid materializes it to a temp file.
        iconPath: input.icon.trim() || null,
        roundIcon: true,
        network: true,
        download: true,
        debug: input.debug,
        windowPersist: input.windowPersist,
        singleton: input.singleton,
        windowMode: 'desktop',
        windowWidth: 1200,
        windowHeight: 800,
        safeArea: 'all',
        orientation: 'all',
        webClipFullScreen: true,
        webClipRemovable: true,
        webClipOrganization: '',
        webClipDescription: input.description,
        injectJs: '',
        createdAt: input.createdAt,
        updatedAt: now,
    }
}

function publishDialogLabels(t: AppDetailStrings): PublishDialogLabels {
    return {
        title: t.publishDialogTitle,
        closeAria: t.publishDialogClose,
        methodLabel: t.publishMethodLabel,
        platformLabel: t.publishPlatformLabel,
        platformPlaceholder: t.publishPlatformPlaceholder,
        debugLabel: t.publishDebugLabel,
        debugOff: t.publishDebugOff,
        debugOn: t.publishDebugOn,
        descriptionLabel: t.publishDescriptionLabel,
        descriptionPlaceholder: t.publishDescriptionPlaceholder,
        cancel: t.publishCancel,
        confirm: t.publishConfirm,
        platformRequired: t.publishPlatformRequired,
        methods: [
            { value: PUBLISH_METHOD_LOCAL, label: t.publishMethodLocal },
            {
                value: PUBLISH_METHOD_CLOUD,
                label: t.publishMethodCloud,
                disabled: true,
            },
            {
                value: PUBLISH_METHOD_ELECTRON,
                label: t.publishMethodElectron,
                disabled: true,
            },
        ],
        platformGroups: [
            {
                id: 'windows',
                label: t.publishPlatformGroupWindows,
                children: [
                    {
                        value: PUBLISH_PLATFORM_WIN_X64,
                        label: t.publishPlatformWindowsX64,
                    },
                    {
                        value: PUBLISH_PLATFORM_WIN_ARM,
                        label: t.publishPlatformWindowsArm64,
                    },
                ],
            },
            {
                id: 'macos',
                label: t.publishPlatformGroupMacos,
                children: [
                    {
                        value: PUBLISH_PLATFORM_MAC_X64,
                        label: t.publishPlatformMacIntelX64,
                    },
                    {
                        value: PUBLISH_PLATFORM_MAC_ARM,
                        label: t.publishPlatformMacAppleSilicon,
                    },
                ],
            },
            {
                id: 'linux',
                label: t.publishPlatformGroupLinux,
                children: [
                    {
                        value: PUBLISH_PLATFORM_LINUX_X64,
                        label: t.publishPlatformLinuxX64,
                    },
                    {
                        value: PUBLISH_PLATFORM_LINUX_ARM,
                        label: t.publishPlatformLinuxArm64,
                    },
                ],
            },
        ],
        localPlatformOptions: [
            {
                value: PUBLISH_PLATFORM_ANDROID,
                label: t.publishLocalPlatformAndroid,
            },
            {
                value: PUBLISH_PLATFORM_IOS,
                label: t.publishLocalPlatformIos,
            },
            {
                value: PUBLISH_PLATFORM_IOSCLIP,
                label: t.publishLocalPlatformWebclip,
            },
            {
                value: PUBLISH_PLATFORM_WINDOWS,
                label: t.publishLocalPlatformWindows,
            },
            {
                value: PUBLISH_PLATFORM_MACOS,
                label: t.publishLocalPlatformMacos,
            },
        ],
    }
}

function mobilePublishDialogLabels(t: AppDetailStrings): PublishDialogLabels {
    return {
        title: t.publishDialogTitle,
        closeAria: t.publishDialogClose,
        methodLabel: '',
        platformLabel: t.publishPlatformLabel,
        platformPlaceholder: t.publishPlatformPlaceholder,
        debugLabel: t.publishDebugLabel,
        debugOff: t.publishDebugOff,
        debugOn: t.publishDebugOn,
        descriptionLabel: t.publishDescriptionLabel,
        descriptionPlaceholder: t.publishDescriptionPlaceholder,
        cancel: t.publishCancel,
        confirm: t.publishConfirm,
        platformRequired: t.publishPlatformRequired,
        methods: [],
        platformGroups: [],
        platformOptions: [
            {
                value: PUBLISH_PLATFORM_ANDROID,
                label: t.publishMobilePlatformAndroid,
            },
            {
                value: PUBLISH_PLATFORM_IOS,
                label: t.publishMobilePlatformIos,
            },
            {
                value: PUBLISH_PLATFORM_IOSCLIP,
                label: t.publishMobilePlatformIosclip,
            },
        ],
    }
}

function releaseHistoryLabels(t: AppDetailStrings) {
    return {
        title: t.releaseHistory,
        colAppName: t.releaseHistoryColAppName,
        colDownloadQr: t.releaseHistoryColDownloadQr,
        colAppType: t.releaseHistoryColAppType,
        colAppSize: t.releaseHistoryColAppSize,
        colPublishedAt: t.releaseHistoryColPublishedAt,
        colActions: t.releaseHistoryColActions,
        download: t.releaseHistoryDownload,
        empty: t.releaseHistoryEmpty,
        loading: t.releaseHistoryLoading,
        loadFailed: t.releaseHistoryLoadFailed,
        refresh: t.releaseHistoryRefresh,
        qrCodeAria: t.releaseHistoryQrCodeAria,
        appTypes: {
            android: t.releaseHistoryAppTypeAndroid,
            ios: t.releaseHistoryAppTypeIos,
            iosclip: t.releaseHistoryAppTypeIosclip,
            windows: t.releaseHistoryAppTypeWindows,
            macos: t.releaseHistoryAppTypeMacos,
            linux: t.releaseHistoryAppTypeLinux,
            web: t.releaseHistoryAppTypeWeb,
        },
    }
}

function phoneConfigLabels(t: AppDetailStrings): PhoneConfigLabels {
    return {
        permissionsTitle: t.phonePermissionsTitle,
        webClipTitle: t.phoneWebClipTitle,
        permissions: {
            networkAccess: t.phonePermNetworkAccess,
            downloadFiles: t.phonePermDownloadFiles,
            debugDev: t.phonePermDebugDev,
            location: t.phonePermLocation,
            photosFiles: t.phonePermPhotosFiles,
            disableCache: t.phonePermDisableCache,
            cameraVideo: t.phonePermCameraVideo,
            backgroundPlay: t.phonePermBackgroundPlay,
            videoFullscreen: t.phonePermVideoFullscreen,
            preventScreenshot: t.phonePermPreventScreenshot,
            bluetooth: t.phonePermBluetooth,
            openExternalApp: t.phonePermOpenExternalApp,
            notifications: t.phonePermNotifications,
            vibration: t.phonePermVibration,
            clipboard: t.phonePermClipboard,
            phoneCall: t.phonePermPhoneCall,
            microphone: t.phonePermMicrophone,
            keepScreenOn: t.phonePermKeepScreenOn,
            bootAutoStart: t.phonePermBootAutoStart,
            swipeBack: t.phonePermSwipeBack,
        },
        webClipFullscreen: t.phoneWebClipFullscreen,
        webClipAllowDelete: t.phoneWebClipAllowDelete,
        webClipOrgName: t.phoneWebClipOrgName,
        webClipOrgNamePlaceholder: t.phoneWebClipOrgNamePlaceholder,
        webClipDesc: t.phoneWebClipDesc,
        webClipDescPlaceholder: t.phoneWebClipDescPlaceholder,
    }
}

/** Map window option keys to localized labels. */
function desktopWindowOptionLabels(
    t: AppDetailStrings,
): Record<DesktopWindowOptionKey, string> {
    return {
        dragDropEnabled: t.desktopWinDragDropEnabled,
        center: t.desktopWinCenter,
        closable: t.desktopWinClosable,
        resizable: t.desktopWinResizable,
        fullscreen: t.desktopWinFullscreen,
        focus: t.desktopWinFocus,
        transparent: t.desktopWinTransparent,
        maximized: t.desktopWinMaximized,
        visible: t.desktopWinVisible,
        decorations: t.desktopWinDecorations,
        alwaysOnTop: t.desktopWinAlwaysOnTop,
        alwaysOnBottom: t.desktopWinAlwaysOnBottom,
        contentProtected: t.desktopWinContentProtected,
        skipTaskbar: t.desktopWinSkipTaskbar,
        shadow: t.desktopWinShadow,
        maximizable: t.desktopWinMaximizable,
        minimizable: t.desktopWinMinimizable,
        acceptFirstMouse: t.desktopWinAcceptFirstMouse,
        hiddenTitle: t.desktopWinHiddenTitle,
        tauriApi: t.desktopWinTauriApi,
        zoomHotkeysEnabled: t.desktopWinZoomHotkeysEnabled,
        backgroundThrottling: t.desktopWinBackgroundThrottling,
        javascriptDisabled: t.desktopWinJavascriptDisabled,
        incognito: t.desktopWinIncognito,
    }
}

function desktopConfigLabels(t: AppDetailStrings): DesktopConfigLabels {
    return {
        featuresTitle: t.desktopFeaturesTitle,
        windowOptionsTitle: t.desktopWindowOptionsTitle,
        features: {
            keepWindow: t.desktopFeatureKeepWindow,
            singleton: t.desktopFeatureSingleton,
            disableContextMenu: t.desktopFeatureDisableContextMenu,
            allowCors: t.desktopFeatureAllowCors,
            bootAutoStart: t.desktopFeatureBootAutoStart,
        },
        windowOptions: desktopWindowOptionLabels(t),
        additionalBrowserArgsLabel: t.additionalBrowserArgsLabel,
        additionalBrowserArgsPlaceholder: t.additionalBrowserArgsPlaceholder,
    }
}

function startupConfigLabels(t: AppDetailStrings): StartupConfigLabels {
    return {
        splashTitle: t.startupSplashTitle,
        splashEnabled: t.startupSplashEnabled,
        splashImage: t.startupSplashImage,
        splashUpload: t.startupSplashUpload,
        splashClear: t.startupSplashClear,
        splashHint: t.startupSplashHint,
        splashDurationLabel: t.startupSplashDurationLabel,
        splashDurationPlaceholder: t.startupSplashDurationPlaceholder,
        splashDurationUnit: t.startupSplashDurationUnit,
        splashClickUrlLabel: t.startupSplashClickUrlLabel,
        splashClickUrlPlaceholder: t.startupSplashClickUrlPlaceholder,
        authModeLabel: t.startupAuthModeLabel,
        authModeNone: t.startupAuthModeNone,
        authModeAlways: t.startupAuthModeAlways,
        authModeOnce: t.startupAuthModeOnce,
        authModeOnline: t.startupAuthModeOnline,
        authThemeLabel: t.startupAuthThemeLabel,
        authThemeDark: t.startupAuthThemeDark,
        authThemeLight: t.startupAuthThemeLight,
        authThemeSystem: t.startupAuthThemeSystem,
        passwordStyleLabel: t.startupPasswordStyleLabel,
        passwordStyleFlat: t.startupPasswordStyleFlat,
        passwordStyleCard: t.startupPasswordStyleCard,
        authTitleLabel: t.startupAuthTitleLabel,
        authTitlePlaceholder: t.startupAuthTitlePlaceholder,
        passwordPlaceholderLabel: t.startupPasswordPlaceholderLabel,
        passwordPlaceholderHint: t.startupPasswordPlaceholderHint,
        defaultPasswordLabel: t.startupDefaultPasswordLabel,
        defaultPasswordPlaceholder: t.startupDefaultPasswordPlaceholder,
        authButtonLabel: t.startupAuthButtonLabel,
        authButtonPlaceholder: t.startupAuthButtonPlaceholder,
        authHintLabel: t.startupAuthHintLabel,
        authHintPlaceholder: t.startupAuthHintPlaceholder,
        authErrorLabel: t.startupAuthErrorLabel,
        authErrorPlaceholder: t.startupAuthErrorPlaceholder,
    }
}

function isValidUrl(value: string) {
    try {
        const url = new URL(value)
        return url.protocol === 'http:' || url.protocol === 'https:'
    } catch {
        return false
    }
}

function readImageAsDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = reject
        reader.readAsDataURL(file)
    })
}

function DefaultAppIcon({ className }: { className?: string }) {
    return (
        <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            className={className}
            aria-hidden
        >
            <path
                d="M12 3C7.03 3 3 6.58 3 11c0 3.31 2.69 6 6 6h1.5c.83 0 1.5.67 1.5 1.5S11.33 20 10.5 20H8c-.55 0-1 .45-1 1s.45 1 1 1h8c.55 0 1-.45 1-1s-.45-1-1-1h-2.5c-.83 0-1.5-.67-1.5-1.5S14.67 17 15.5 17H17c3.31 0 6-2.69 6-6 0-4.42-4.03-8-9-8z"
                fill="currentColor"
                opacity="0.95"
            />
        </svg>
    )
}

export function AppDetailPageClient() {
    const router = useRouter()
    const pathname = usePathname()
    const id = appIdFromPathname(pathname)
    const locale = useLocaleStore(selectLocale)
    const homeT = HOME_STRINGS[locale]
    const t = APP_DETAIL_STRINGS[locale]
    const project = useProjectStore(selectProjectById(id))
    const upsertProject = useProjectStore(selectUpsertProject)
    const updateProject = useProjectStore(selectUpdateProject)
    const removeProjectFromStore = useProjectStore(selectDeleteProject)
    const iconInputId = useId()

    const [hydrated, setHydrated] = useState(false)
    const [detailStatus, setDetailStatus] = useState<
        'loading' | 'ready' | 'not-found' | 'error'
    >('loading')
    const [detailError, setDetailError] = useState('')
    const { user: authUser } = useAuthUser()
    const [show_name, setShow_name] = useState('')
    const [url, setUrl] = useState('')
    const [app_id, setApp_id] = useState('')
    const [version, setVersion] = useState('')
    const [description, setDescription] = useState('')
    const [windowMode, setWindowMode] = useState<WindowMode>('desktop')
    const [windowWidth, setWindowWidth] = useState(
        WINDOW_SIZE_PRESETS.desktop.width,
    )
    const [windowHeight, setWindowHeight] = useState(
        WINDOW_SIZE_PRESETS.desktop.height,
    )
    const [userAgent, setUserAgent] = useState('')
    const [proxyUrl, setProxyUrl] = useState('')
    const [additionalBrowserArgs, setAdditionalBrowserArgs] = useState('')
    const [keepWindow, setKeepWindow] = useState(true)
    const [singleton, setSingleton] = useState(true)
    const [icon, setIcon] = useState('')
    const [iconSource, setIconSource] = useState('')
    const [iconBorderRadius, setIconBorderRadius] = useState(
        DEFAULT_ICON_BORDER_RADIUS,
    )
    const [iconTransform, setIconTransform] = useState<IconTransform>(
        getDefaultIconTransform(),
    )
    const [iconEditorOpen, setIconEditorOpen] = useState(false)
    const [editorSource, setEditorSource] = useState('')
    const [errors, setErrors] = useState<Partial<Record<FormFields, string>>>(
        {},
    )
    const [saving, setSaving] = useState(false)
    const [saveStatus, setSaveStatus] = useState<'idle' | 'error'>('idle')
    const [saveError, setSaveError] = useState('')
    const [saveToastOpen, setSaveToastOpen] = useState(false)
    const closeSaveToast = useCallback(() => setSaveToastOpen(false), [])
    const [ppConfig, setPpConfig] = useState<PpConfig | null>(null)
    const [publishDialogOpen, setPublishDialogOpen] = useState(false)
    const [publishMode, setPublishMode] = useState<PublishDialogMode>('desktop')
    const [publishing, setPublishing] = useState(false)
    const [publishError, setPublishError] = useState('')
    const [activeSection, setActiveSection] = useState<DetailSection>('basic')
    const [isDeleting, setIsDeleting] = useState(false)
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
    const [deleteAlert, setDeleteAlert] = useState<{
        open: boolean
        message: string
    }>({ open: false, message: '' })
    const iconInputRef = useRef<HTMLInputElement>(null)
    const skipAutoSaveRef = useRef(true)
    const hydratedFormIdRef = useRef<string | null>(null)
    const lastSavedSnapshotRef = useRef('')
    const savingRef = useRef(false)
    const pendingSaveRef = useRef(false)
    const formValuesRef = useRef({
        show_name,
        url,
        app_id,
        version,
        description,
        keepWindow,
        singleton,
        icon,
        iconSource,
        iconBorderRadius,
        iconTransform,
        ppConfig,
        project,
        authUserId: authUser?.id as number | string | undefined,
    })
    formValuesRef.current = {
        show_name,
        url,
        app_id,
        version,
        description,
        keepWindow,
        singleton,
        icon,
        iconSource,
        iconBorderRadius,
        iconTransform,
        ppConfig,
        project,
        authUserId: authUser?.id,
    }

    useEffect(() => {
        setHydrated(true)
    }, [])

    useEffect(() => {
        hydratedFormIdRef.current = null
        skipAutoSaveRef.current = true
        lastSavedSnapshotRef.current = ''
        pendingSaveRef.current = false
        setSaveStatus('idle')
        setSaveError('')
    }, [id])

    const loadProjectDetail = useCallback(async () => {
        if (!id) {
            setDetailStatus('not-found')
            return
        }

        const projectId = Number(id)
        const existing = useProjectStore
            .getState()
            .projects.find((item) => item.id === id)

        // Prefer local store so UI works without a backend.
        if (existing) {
            await migrateProjectIconsToDisk()
            const refreshed =
                useProjectStore.getState().projects.find((item) => item.id === id) ??
                existing
            const config =
                refreshed.ppConfig ??
                buildPpConfigFromApiProject({
                    name: refreshed.internalName || refreshed.show_name,
                    show_name: refreshed.show_name,
                    app_id: refreshed.app_id,
                    url: refreshed.url,
                    version: refreshed.version,
                    icon: refreshed.icon,
                })
            setPpConfig(config)
            setDetailStatus('ready')
            return
        }

        if (!Number.isFinite(projectId) || projectId <= 0) {
            setDetailStatus('not-found')
            return
        }

        setDetailStatus('loading')
        setDetailError('')
        try {
            const data = await getProject(projectId)
            const config =
                data.config ??
                buildPpConfigFromApiProject(data)
            setPpConfig(config)
            upsertProject({
                ...mergeProjectFromApi(data, existing),
                ppConfig: config,
            })
            setDetailStatus('ready')
        } catch (err) {
            if (err instanceof ProjectApiError && err.code === 404) {
                setDetailStatus('not-found')
                return
            }
            setDetailStatus('error')
            setDetailError(
                err instanceof ProjectApiError
                    ? err.message
                    : t.loadDetailFailed,
            )
        }
    }, [id, upsertProject, t.loadDetailFailed])

    useEffect(() => {
        if (!hydrated) return
        void loadProjectDetail()
    }, [hydrated, loadProjectDetail])

    useEffect(() => {
        if (!project || detailStatus !== 'ready') return
        if (hydratedFormIdRef.current === id) return

        hydratedFormIdRef.current = id
        skipAutoSaveRef.current = true

        const config = ppConfig ?? project.ppConfig
        const nextKeepWindow = config?.state ?? true
        const nextSingleton = config?.single ?? true

        setShow_name(project.show_name)
        setUrl(project.url)
        setApp_id(project.app_id)
        setVersion(project.version)
        setDescription(project.description)
        setIcon(project.icon)
        setIconSource(project.iconSource)
        setIconBorderRadius(project.iconBorderRadius)
        setIconTransform(project.iconTransform)
        setKeepWindow(nextKeepWindow)
        setSingleton(nextSingleton)

        lastSavedSnapshotRef.current = buildFormSnapshot({
            show_name: project.show_name,
            url: project.url,
            app_id: project.app_id,
            version: project.version,
            description: project.description,
            keepWindow: nextKeepWindow,
            singleton: nextSingleton,
            icon: project.icon,
            iconSource: project.iconSource,
            iconBorderRadius: project.iconBorderRadius,
            iconTransform: project.iconTransform,
        })

        const timer = window.setTimeout(() => {
            skipAutoSaveRef.current = false
        }, 0)
        return () => clearTimeout(timer)
    }, [id, project, ppConfig, detailStatus])

    useEffect(() => {
        const htmlLang =
            locale === 'zh-TW'
                ? 'zh-Hant'
                : locale === 'zh-CN'
                  ? 'zh-CN'
                  : locale
        document.documentElement.lang = htmlLang
    }, [locale])

    useEffect(() => {
        return () => {
            document.documentElement.lang = 'zh-CN'
        }
    }, [])

    function handleMobileClick() {
        void (async () => {
            try {
                await openPreviewWindow({
                    title: show_name,
                    url,
                    width: windowWidth,
                    height: windowHeight,
                    icon,
                    userAgent,
                })
            } catch (err) {
                const message =
                    err instanceof Error && err.message === 'invalid preview url'
                        ? t.websiteUrlInvalid
                        : err instanceof Error
                          ? err.message
                          : t.websiteUrlInvalid
                setDeleteAlert({ open: true, message })
            }
        })()
    }

    function handleDeleteProject() {
        setDeleteConfirmOpen(true)
    }

    async function confirmDeleteProject() {
        if (!id) {
            setDeleteConfirmOpen(false)
            setDeleteAlert({ open: true, message: t.deleteProjectFailed })
            return
        }

        try {
            setIsDeleting(true)
            await deleteProjectApi(id)
            removeProjectFromStore(id)
            router.replace('/')
        } catch (err) {
            setIsDeleting(false)
            setDeleteConfirmOpen(false)
            setDeleteAlert({
                open: true,
                message:
                    err instanceof ProjectApiError
                        ? err.message
                        : t.deleteProjectFailed,
            })
        }
    }

    function handleMoreMenuSelect(action: MoreMenuAction) {
        switch (action) {
            case 'desktop-config':
                setActiveSection('basic')
                break
            case 'desktop-settings':
                setActiveSection('desktop-settings')
                break
            case 'phone-config':
                setActiveSection('phone-config')
                break
            case 'script-editor':
                setActiveSection('script-editor')
                break
            case 'startup-config':
                setActiveSection('startup-config')
                break
            case 'release-history':
                setActiveSection('release-history')
                break
            case 'faq':
                setActiveSection('faq')
                break
            case 'capability-demo':
                setActiveSection('capability-demo')
                break
            case 'delete-project':
                handleDeleteProject()
                break
        }
    }

    function getSectionTitle() {
        switch (activeSection) {
            case 'desktop-settings':
                return t.desktopSettingsTab
            case 'phone-config':
                return t.phoneConfigTab
            case 'script-editor':
                return t.scriptEditorTab
            case 'startup-config':
                return t.startupConfigTab
            case 'release-history':
                return t.releaseHistory
            case 'faq':
                return t.faq
            case 'capability-demo':
                return t.capabilityDemo
            case 'mobile':
                return t.mobileTab
            case 'basic':
            default:
                return t.desktopConfigTab
        }
    }

    function getSectionPlaceholder() {
        switch (activeSection) {
            case 'mobile':
                return t.mobileSectionPlaceholder
            case 'desktop-settings':
                return t.desktopSettingsTab
            case 'phone-config':
                return t.phoneConfigTab
            case 'script-editor':
                return t.scriptEditorTab
            case 'startup-config':
                return t.startupConfigTab
            case 'faq':
                return t.faqPlaceholder
            case 'capability-demo':
                return t.capabilityDemoPlaceholder
            default:
                return ''
        }
    }

    function validate() {
        const next: Partial<Record<FormFields, string>> = {}
        if (!show_name.trim()) next.show_name = t.appNameRequired
        if (!app_id.trim()) next.app_id = t.appIdRequired
        const trimmedUrl = url.trim()
        if (trimmedUrl && !isValidUrl(trimmedUrl)) {
            next.url = t.websiteUrlInvalid
        }
        const trimmedVersion = version.trim()
        if (trimmedVersion && !versionPattern.test(trimmedVersion)) {
            next.version = t.versionInvalid
        }
        setErrors(next)
        return Object.keys(next).length === 0
    }

    async function handleIconChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0]
        if (!file) return
        if (!file.type.startsWith('image/')) return
        const dataUrl = await readImageAsDataUrl(file)
        setEditorSource(dataUrl)
        setIconEditorOpen(true)
        e.target.value = ''
    }

    function openIconEditor() {
        const source = iconSource || icon
        if (!source) return
        setEditorSource(source)
        setIconEditorOpen(true)
    }

    function handleWindowModeChange(mode: WindowMode) {
        setWindowMode(mode)
        if (mode === 'custom') return
        const preset = WINDOW_SIZE_PRESETS[mode]
        setWindowWidth(preset.width)
        setWindowHeight(preset.height)
    }

    function handleWindowSizeSwap() {
        setWindowWidth(windowHeight)
        setWindowHeight(windowWidth)
        setWindowMode('custom')
    }

    function handleWindowWidthChange(value: number) {
        setWindowWidth(value)
        setWindowMode('custom')
    }

    function handleWindowHeightChange(value: number) {
        setWindowHeight(value)
        setWindowMode('custom')
    }

    function handleIconEditorConfirm(result: {
        icon: string
        iconSource: string
        iconBorderRadius: number
        iconTransform: IconTransform
    }) {
        setIcon(result.icon)
        setIconSource(result.iconSource)
        setIconBorderRadius(result.iconBorderRadius)
        setIconTransform(result.iconTransform)
        setIconEditorOpen(false)
        setEditorSource('')
    }

    function handleIconEditorClose() {
        setIconEditorOpen(false)
        setEditorSource('')
    }

    function handleIconRemove() {
        setIcon('')
        setIconSource('')
        setIconBorderRadius(DEFAULT_ICON_BORDER_RADIUS)
        setIconTransform(getDefaultIconTransform())
    }

    function handlePublish() {
        if (!project) return
        if (!validate()) return
        setPublishError('')
        setPublishMode(activeSection === 'mobile' ? 'mobile' : 'desktop')
        setPublishDialogOpen(true)
    }

    async function handlePublishConfirm(values: PublishFormValues) {
        if (!project) return
        setPublishing(true)
        setPublishError('')
        try {
            const trimmedName = show_name.trim()
            const trimmedUrl = url.trim()
            const trimmedAppId = app_id.trim()
            const trimmedVersion = version.trim() || '1.0.0'
            const localPlatform = values.platforms[0]
            const isLocalAndroid =
                publishMode === 'desktop' &&
                values.method === PUBLISH_METHOD_LOCAL &&
                localPlatform === PUBLISH_PLATFORM_ANDROID
            const isLocalIos =
                publishMode === 'desktop' &&
                values.method === PUBLISH_METHOD_LOCAL &&
                localPlatform === PUBLISH_PLATFORM_IOS
            const isLocalWebclip =
                publishMode === 'desktop' &&
                values.method === PUBLISH_METHOD_LOCAL &&
                localPlatform === PUBLISH_PLATFORM_IOSCLIP
            const isLocalMacos =
                publishMode === 'desktop' &&
                values.method === PUBLISH_METHOD_LOCAL &&
                localPlatform === PUBLISH_PLATFORM_MACOS
            const isLocalWindows =
                publishMode === 'desktop' &&
                values.method === PUBLISH_METHOD_LOCAL &&
                localPlatform === PUBLISH_PLATFORM_WINDOWS

            if (values.method === PUBLISH_METHOD_LOCAL) {
                if (
                    !isLocalAndroid &&
                    !isLocalIos &&
                    !isLocalWebclip &&
                    !isLocalMacos &&
                    !isLocalWindows
                ) {
                    setPublishError(t.publishComingSoon)
                    return
                }

                const packProject = buildLocalPackProject({
                    id: project.id,
                    name: trimmedName,
                    url: trimmedUrl,
                    packageId: trimmedAppId,
                    version: trimmedVersion,
                    description:
                        values.description.trim() || description,
                    icon: icon || iconSource,
                    debug: values.debug,
                    windowPersist: keepWindow,
                    singleton,
                    createdAt: project.createdAt,
                })

                const packStore = usePackStore.getState()
                const loadingStore = useLoadingStore.getState()
                packStore.reset()
                packStore.setPacking(true)
                loadingStore.start()

                const unlisten = await listenPackProgress((progress) => {
                    usePackStore
                        .getState()
                        .setProgress(progress.message, progress.percent)
                })

                try {
                    await templateEnsure()
                    const result = isLocalWebclip
                        ? await packWebclip(packProject)
                        : isLocalWindows
                          ? await packWindows(packProject)
                          : isLocalIos
                            ? await packIos(packProject)
                            : isLocalMacos
                              ? await packMacos(packProject)
                              : await packAndroid(packProject)
                    packStore.setSuccess(result.outputPath, result.fileName)

                    const nextConfig = applyPublishToPpConfig(
                        ppConfig ??
                            project.ppConfig ??
                            buildPpConfigFromApiProject({
                                name:
                                    project.internalName ||
                                    project.show_name,
                                show_name: trimmedName,
                                app_id: trimmedAppId,
                                url: trimmedUrl,
                                version: trimmedVersion,
                                icon: icon,
                            }),
                        values,
                    )
                    setPpConfig(nextConfig)
                    updateProject(id, {
                        show_name: trimmedName,
                        url: trimmedUrl,
                        app_id: trimmedAppId,
                        version: trimmedVersion,
                        description: packProject.description,
                        ppConfig: nextConfig,
                    })
                    setPublishDialogOpen(false)
                    await revealPath(result.outputPath)
                    const successTemplate = isLocalWebclip
                        ? t.packWebclipSuccess
                        : isLocalWindows
                          ? t.packWindowsSuccess
                          : isLocalIos
                            ? t.packIosSuccess
                            : isLocalMacos
                              ? t.packMacosSuccess
                              : t.packAndroidSuccess
                    setDeleteAlert({
                        open: true,
                        message: successTemplate.replace(
                            '{fileName}',
                            result.fileName,
                        ),
                    })
                } finally {
                    unlisten()
                    loadingStore.stop()
                    if (usePackStore.getState().packing) {
                        usePackStore.getState().setPacking(false)
                    }
                }
                return
            }

            const projectId = Number(id)
            if (!Number.isFinite(projectId) || projectId <= 0) {
                setPublishError(t.publishFailed)
                return
            }
            if (!authUser?.id) {
                setPublishError(t.publishFailed)
                return
            }

            const configInternalName =
                project.internalName ||
                ppConfig?.name ||
                project.ppConfig?.name ||
                project.show_name
            const folder = `${authUser.id}/${configInternalName}`
            const { icon: iconUrl, iconSource: nextIconSource } =
                await resolveIconPair(icon, iconSource, folder)
            const baseConfig =
                ppConfig ??
                project.ppConfig ??
                buildPpConfigFromApiProject({
                    name: configInternalName,
                    show_name: trimmedName,
                    app_id: trimmedAppId,
                    url: trimmedUrl,
                    version: trimmedVersion,
                    icon: iconUrl,
                })
            const formConfig = applyFormToPpConfig(baseConfig, {
                name: configInternalName,
                showName: trimmedName,
                url: trimmedUrl,
                app_id: trimmedAppId,
                version: trimmedVersion,
                icon: iconUrl,
                keepWindow,
                singleton,
            })

            if (publishMode === 'mobile') {
                const nextConfig = applyMobilePublishToPpConfig(
                    formConfig,
                    values,
                )
                const payload = buildMobilePublishTaskPayload({
                    pro_id: projectId,
                    name: nextConfig.name,
                    show_name: trimmedName,
                    app_id: trimmedAppId,
                    version: trimmedVersion,
                    description: values.description.trim(),
                    url: trimmedUrl,
                    icon: iconUrl,
                    platforms: values.platforms,
                    config: nextConfig,
                })
                await createBuildTask(payload)
                setPpConfig(nextConfig)
                updateProject(id, {
                    show_name: trimmedName,
                    url: trimmedUrl,
                    app_id: trimmedAppId,
                    version: trimmedVersion,
                    icon: iconUrl,
                    iconSource: nextIconSource,
                    ppConfig: nextConfig,
                })
            } else {
                const nextConfig = applyPublishToPpConfig(formConfig, values)
                const payload = buildPublishTaskPayload({
                    pro_id: projectId,
                    name: nextConfig.name,
                    show_name: trimmedName,
                    app_id: trimmedAppId,
                    version: trimmedVersion,
                    description: values.description.trim(),
                    url: trimmedUrl,
                    icon: iconUrl,
                    publish: values.method,
                    config: nextConfig,
                })
                await createBuildTask(payload)
                setPpConfig(nextConfig)
                updateProject(id, {
                    show_name: trimmedName,
                    url: trimmedUrl,
                    app_id: trimmedAppId,
                    version: trimmedVersion,
                    icon: iconUrl,
                    iconSource: nextIconSource,
                    ppConfig: nextConfig,
                })
            }
            if (iconUrl || nextIconSource) {
                setIcon(iconUrl)
                setIconSource(nextIconSource)
            }
            setPublishDialogOpen(false)
        } catch (err) {
            setPublishError(
                err instanceof PackApiError ||
                    err instanceof BuildTaskApiError ||
                    err instanceof FileApiError
                    ? err.message
                    : t.publishFailed,
            )
        } finally {
            setPublishing(false)
        }
    }

    async function saveProject(options?: {
        force?: boolean
    }): Promise<boolean> {
        const form = formValuesRef.current
        if (!form.project) return false
        if (!options?.force && skipAutoSaveRef.current) return false

        const snapshot = buildFormSnapshot(form)
        if (snapshot === lastSavedSnapshotRef.current) return true

        const nextErrors: Partial<Record<FormFields, string>> = {}
        if (!form.show_name.trim()) nextErrors.show_name = t.appNameRequired
        if (!form.app_id.trim()) nextErrors.app_id = t.appIdRequired
        const trimmedUrl = form.url.trim()
        if (trimmedUrl && !isValidUrl(trimmedUrl)) {
            nextErrors.url = t.websiteUrlInvalid
        }
        const trimmedVersion = form.version.trim()
        if (trimmedVersion && !versionPattern.test(trimmedVersion)) {
            nextErrors.version = t.versionInvalid
        }
        setErrors(nextErrors)
        if (Object.keys(nextErrors).length > 0) return false

        const projectId = Number(id)
        if (!Number.isFinite(projectId) || projectId <= 0) {
            setSaveStatus('error')
            setSaveError(t.saveFailed)
            return false
        }

        const configInternalName =
            form.project.internalName ||
            form.ppConfig?.name ||
            form.project.ppConfig?.name ||
            form.project.show_name
        if (!form.authUserId) {
            setSaveStatus('error')
            setSaveError(t.saveFailed)
            return false
        }

        if (savingRef.current) {
            pendingSaveRef.current = true
            return true
        }

        savingRef.current = true
        setSaving(true)
        setSaveStatus('idle')
        setSaveError('')

        try {
            const folder = `${form.authUserId}/${configInternalName}`
            const { icon: iconUrl, iconSource: nextIconSource } =
                await resolveIconPair(form.icon, form.iconSource, folder)
            const trimmedName = form.show_name.trim()
            const trimmedAppId = form.app_id.trim()
            const nextVersion = form.version.trim() || '1.0.0'
            const baseConfig =
                form.ppConfig ??
                form.project.ppConfig ??
                buildPpConfigFromApiProject({
                    name: configInternalName,
                    show_name: trimmedName,
                    app_id: trimmedAppId,
                    url: trimmedUrl,
                    version: nextVersion,
                    icon: iconUrl,
                })
            const nextConfig = applyFormToPpConfig(baseConfig, {
                name: configInternalName,
                showName: trimmedName,
                url: trimmedUrl,
                app_id: trimmedAppId,
                version: nextVersion,
                icon: iconUrl,
                keepWindow: form.keepWindow,
                singleton: form.singleton,
            })
            const trimmedDescription = form.description.trim()
            await updateProjectApi({
                id: projectId,
                name: nextConfig.name,
                show_name: trimmedName,
                app_id: trimmedAppId,
                version: nextVersion,
                description: trimmedDescription,
                url: trimmedUrl,
                icon: iconUrl,
                config: nextConfig,
            })
            setPpConfig(nextConfig)
            updateProject(id, {
                show_name: trimmedName,
                url: trimmedUrl,
                app_id: trimmedAppId,
                version: nextVersion,
                description: trimmedDescription,
                icon: iconUrl,
                iconSource: nextIconSource,
                iconBorderRadius: form.iconBorderRadius,
                iconTransform: form.iconTransform,
                ppConfig: nextConfig,
            })
            setIcon(iconUrl)
            setIconSource(nextIconSource)
            lastSavedSnapshotRef.current = buildFormSnapshot({
                show_name: trimmedName,
                url: trimmedUrl,
                app_id: trimmedAppId,
                version: nextVersion,
                description: trimmedDescription,
                keepWindow: form.keepWindow,
                singleton: form.singleton,
                icon: iconUrl,
                iconSource: nextIconSource,
                iconBorderRadius: form.iconBorderRadius,
                iconTransform: form.iconTransform,
            })
            return true
        } catch (err) {
            setSaveStatus('error')
            setSaveError(
                err instanceof ProjectApiError || err instanceof FileApiError
                    ? err.message
                    : t.saveFailed,
            )
            return false
        } finally {
            savingRef.current = false
            setSaving(false)
            if (pendingSaveRef.current) {
                pendingSaveRef.current = false
                void saveProject()
            }
        }
    }

    useEffect(() => {
        function onKeyDown(e: KeyboardEvent) {
            if (!(e.ctrlKey || e.metaKey) || e.key.toLowerCase() !== 's') return
            if (e.defaultPrevented) return
            e.preventDefault()
            void (async () => {
                const ok = await saveProject({ force: true })
                if (ok) {
                    setSaveToastOpen(false)
                    // Remount timer when pressing save repeatedly.
                    requestAnimationFrame(() => setSaveToastOpen(true))
                }
            })()
        }
        window.addEventListener('keydown', onKeyDown)
        return () => window.removeEventListener('keydown', onKeyDown)
        // saveProject closes over latest formValuesRef / locale strings.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [t.saveSuccess, t.saveFailed, t.appNameRequired, t.appIdRequired, t.websiteUrlInvalid, t.versionInvalid, id])

    useEffect(() => {
        if (!project || detailStatus !== 'ready' || skipAutoSaveRef.current) {
            return
        }

        const snapshot = buildFormSnapshot({
            show_name,
            url,
            app_id,
            version,
            description,
            keepWindow,
            singleton,
            icon,
            iconSource,
            iconBorderRadius,
            iconTransform,
        })
        if (snapshot === lastSavedSnapshotRef.current) return

        const timer = window.setTimeout(() => {
            void saveProject()
        }, AUTO_SAVE_DELAY_MS)
        return () => clearTimeout(timer)
        // saveProject closes over latest refs; debounce on field changes only.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        show_name,
        url,
        app_id,
        version,
        description,
        keepWindow,
        singleton,
        icon,
        iconSource,
        iconBorderRadius,
        iconTransform,
        project,
        detailStatus,
    ])

    if (!hydrated || detailStatus === 'loading') {
        return (
            <PageShell>
                <p className="py-12 text-center text-sm text-zinc-500 dark:text-zinc-400">
                    {t.loadingDetail}
                </p>
            </PageShell>
        )
    }

    if (isDeleting) {
        return (
            <PageShell>
                <p className="py-12 text-center text-sm text-zinc-500 dark:text-zinc-400">
                    {t.loadingDetail}
                </p>
            </PageShell>
        )
    }

    if (detailStatus === 'not-found') {
        return (
            <PageShell>
                <div className="flex flex-col items-center gap-4 py-12">
                    <p className="text-center text-sm text-zinc-600 dark:text-zinc-400">
                        {t.notFound}
                    </p>
                    <Link
                        href="/"
                        className="inline-flex items-center gap-1 text-sm font-medium text-zinc-900 underline-offset-4 hover:underline dark:text-zinc-100"
                    >
                        <svg
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.25"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden
                        >
                            <path d="M15 6 9 12l6 6" />
                        </svg>
                        {t.backToHome}
                    </Link>
                </div>
            </PageShell>
        )
    }

    if (detailStatus === 'error') {
        return (
            <PageShell>
                <div className="flex flex-col items-center gap-4 py-12">
                    <p
                        className="text-center text-sm text-red-600 dark:text-red-400"
                        role="alert"
                    >
                        {detailError || t.loadDetailFailed}
                    </p>
                    <button
                        type="button"
                        className="rounded-xl border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                        onClick={() => void loadProjectDetail()}
                    >
                        {homeT.retry}
                    </button>
                </div>
            </PageShell>
        )
    }

    if (!project) {
        return <PageShell />
    }

    return (
        <PageShell>
            <ToastMessage
                open={saveToastOpen}
                message={t.saveSuccess}
                onClose={closeSaveToast}
            />
            <AppDetailHeader
                title={getSectionTitle()}
                activeSection={activeSection}
                mobileAriaLabel={t.mobileTab}
                moreMenuLabels={{
                    publish: t.publish,
                    desktopConfig: t.desktopConfigTab,
                    desktopSettings: t.desktopSettingsTab,
                    phoneConfig: t.phoneConfigTab,
                    scriptEditor: t.scriptEditorTab,
                    startupConfig: t.startupConfigTab,
                    releaseHistory: t.releaseHistory,
                    deleteProject: t.deleteProject,
                    faq: t.faq,
                    capabilityDemo: t.capabilityDemo,
                    triggerAria: t.configMenuAria,
                }}
                menuAria={t.menuAria}
                onMobileClick={handleMobileClick}
                onPublishClick={handlePublish}
                onMoreMenuSelect={handleMoreMenuSelect}
                onTitleClick={() => setActiveSection('basic')}
                subtitle={
                    <Link
                        href="/"
                        className="inline-flex items-center gap-1 font-medium text-zinc-700 transition-colors hover:text-zinc-950 dark:text-zinc-300 dark:hover:text-white"
                    >
                        <svg
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.25"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden
                        >
                            <path d="M15 6 9 12l6 6" />
                        </svg>
                        {t.backToHome}
                    </Link>
                }
            />

            <section className="flex min-h-0 w-full flex-1 flex-col overflow-y-auto pb-1 px-1 overscroll-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {activeSection === 'basic' || activeSection === 'mobile' ? (
                    <form
                        className="flex w-full flex-col gap-5"
                        onSubmit={(e) => e.preventDefault()}
                        noValidate
                    >
                        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                            <div className="flex flex-col gap-2">
                                <label
                                    htmlFor="app-name"
                                    className={formLabelClass}
                                >
                                    {t.appNameLabel}
                                </label>
                                <input
                                    id="app-name"
                                    type="text"
                                    value={show_name}
                                    onChange={(e) => {
                                        setShow_name(e.target.value)
                                        if (errors.show_name) {
                                            setErrors((prev) => ({
                                                ...prev,
                                                show_name: undefined,
                                            }))
                                        }
                                    }}
                                    aria-invalid={Boolean(errors.show_name)}
                                    className={formInputClass}
                                    placeholder={t.appNamePlaceholder}
                                    autoComplete="off"
                                />
                                {errors.show_name ? (
                                    <p className={formErrorClass} role="alert">
                                        {errors.show_name}
                                    </p>
                                ) : null}
                            </div>

                            <div className="flex flex-col gap-2">
                                <label
                                    htmlFor="website-url"
                                    className={formLabelClass}
                                >
                                    {t.websiteUrlLabel}
                                </label>
                                <input
                                    id="website-url"
                                    type="url"
                                    inputMode="url"
                                    value={url}
                                    onChange={(e) => {
                                        setUrl(e.target.value)
                                        if (errors.url) {
                                            setErrors((prev) => ({
                                                ...prev,
                                                url: undefined,
                                            }))
                                        }
                                    }}
                                    aria-invalid={Boolean(errors.url)}
                                    className={formInputClass}
                                    placeholder={t.websiteUrlPlaceholder}
                                    autoComplete="url"
                                />
                                {errors.url ? (
                                    <p className={formErrorClass} role="alert">
                                        {errors.url}
                                    </p>
                                ) : null}
                            </div>

                            <div className="flex flex-col gap-2">
                                <label
                                    htmlFor="app-id"
                                    className={formLabelClass}
                                >
                                    {t.appIdLabel}
                                </label>
                                <input
                                    id="app-id"
                                    type="text"
                                    value={app_id}
                                    onChange={(e) => {
                                        setApp_id(e.target.value)
                                        if (errors.app_id) {
                                            setErrors((prev) => ({
                                                ...prev,
                                                app_id: undefined,
                                            }))
                                        }
                                    }}
                                    aria-invalid={Boolean(errors.app_id)}
                                    className={formInputClass}
                                    placeholder={t.appIdPlaceholder}
                                    autoComplete="off"
                                />
                                {errors.app_id ? (
                                    <p className={formErrorClass} role="alert">
                                        {errors.app_id}
                                    </p>
                                ) : null}
                            </div>

                            <div className="flex flex-col gap-2">
                                <label
                                    htmlFor="app-version"
                                    className={formLabelClass}
                                >
                                    {t.versionLabel}
                                </label>
                                <input
                                    id="app-version"
                                    type="text"
                                    value={version}
                                    onChange={(e) => {
                                        setVersion(e.target.value)
                                        if (errors.version) {
                                            setErrors((prev) => ({
                                                ...prev,
                                                version: undefined,
                                            }))
                                        }
                                    }}
                                    aria-invalid={Boolean(errors.version)}
                                    className={formInputClass}
                                    placeholder={t.versionPlaceholder}
                                    autoComplete="off"
                                />
                                {errors.version ? (
                                    <p className={formErrorClass} role="alert">
                                        {errors.version}
                                    </p>
                                ) : null}
                            </div>

                            <div className="flex flex-col gap-2">
                                <span className={formLabelClass}>
                                    {t.iconLabel}
                                </span>
                                <div
                                    className={`${formInputClass} flex h-auto min-h-[5.5rem] flex-col gap-3 py-3 sm:flex-row sm:items-center`}
                                >
                                    <div
                                        className={`flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-700 ${
                                            icon
                                                ? 'bg-zinc-100 dark:bg-zinc-950'
                                                : 'bg-linear-to-b from-blue-500 to-blue-700'
                                        }`}
                                    >
                                        {icon ? (
                                            <img
                                                src={toIconSrc(icon)}
                                                alt=""
                                                className="h-full w-full object-cover"
                                            />
                                        ) : (
                                            <DefaultAppIcon className="text-white drop-shadow-sm" />
                                        )}
                                    </div>
                                    <div className="flex min-w-0 flex-1 flex-col gap-2">
                                        <input
                                            ref={iconInputRef}
                                            id={iconInputId}
                                            type="file"
                                            accept="image/png,image/jpeg,image/webp"
                                            className="sr-only"
                                            onChange={handleIconChange}
                                        />
                                        <div className="flex flex-wrap gap-2">
                                            <button
                                                type="button"
                                                className="flex h-9 items-center justify-center rounded-lg border border-zinc-200 px-3 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                                                onClick={() =>
                                                    iconInputRef.current?.click()
                                                }
                                            >
                                                {t.iconUpload}
                                            </button>
                                            {icon ? (
                                                <button
                                                    type="button"
                                                    className="flex h-9 items-center justify-center rounded-lg border border-zinc-200 px-3 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                                                    onClick={openIconEditor}
                                                >
                                                    {t.iconEdit}
                                                </button>
                                            ) : null}
                                            {icon ? (
                                                <button
                                                    type="button"
                                                    className="flex h-9 items-center justify-center rounded-lg border border-zinc-200 px-3 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                                                    onClick={handleIconRemove}
                                                >
                                                    {t.iconRemove}
                                                </button>
                                            ) : null}
                                        </div>
                                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                            {t.iconHint}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col gap-2">
                                <label
                                    htmlFor="app-description"
                                    className={formLabelClass}
                                >
                                    {t.descriptionLabel}
                                </label>
                                <textarea
                                    id="app-description"
                                    value={description}
                                    onChange={(e) =>
                                        setDescription(e.target.value)
                                    }
                                    rows={3}
                                    className={`${formInputClass} h-[5.5rem] resize-none py-3`}
                                    placeholder={t.descriptionPlaceholder}
                                    autoComplete="off"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                            <div className="flex flex-col gap-2">
                                <span className={formLabelClass}>
                                    {t.windowModeLabel}
                                </span>
                                <FormSingleSelect
                                    aria-label={t.windowModeLabel}
                                    value={windowMode}
                                    options={[
                                        {
                                            value: 'desktop',
                                            label: t.windowModeDesktop,
                                        },
                                        {
                                            value: 'android',
                                            label: t.windowModeAndroid,
                                        },
                                        {
                                            value: 'ios',
                                            label: t.windowModeIos,
                                        },
                                        {
                                            value: 'ipad',
                                            label: t.windowModeIpad,
                                        },
                                        {
                                            value: 'custom',
                                            label: t.windowModeCustom,
                                        },
                                    ]}
                                    onChange={(value) =>
                                        handleWindowModeChange(
                                            value as WindowMode,
                                        )
                                    }
                                />
                            </div>

                            <div className="flex flex-col gap-2">
                                <span className={formLabelClass}>
                                    {t.windowSizeLabel}
                                </span>
                                <div className="flex h-12 w-full items-center gap-2">
                                    <input
                                        id="window-width"
                                        type="number"
                                        min={1}
                                        inputMode="numeric"
                                        aria-label={t.windowSizeLabel}
                                        value={windowWidth}
                                        onChange={(e) =>
                                            handleWindowWidthChange(
                                                Number(e.target.value) || 0,
                                            )
                                        }
                                        className={windowSizeInputClass}
                                        autoComplete="off"
                                    />
                                    <span
                                        className="shrink-0 text-base font-medium text-zinc-400 dark:text-zinc-500"
                                        aria-hidden
                                    >
                                        ×
                                    </span>
                                    <input
                                        id="window-height"
                                        type="number"
                                        min={1}
                                        inputMode="numeric"
                                        aria-label={t.windowSizeLabel}
                                        value={windowHeight}
                                        onChange={(e) =>
                                            handleWindowHeightChange(
                                                Number(e.target.value) || 0,
                                            )
                                        }
                                        className={windowSizeInputClass}
                                        autoComplete="off"
                                    />
                                    <button
                                        type="button"
                                        className={headerIconButtonClass(false)}
                                        aria-label={t.windowSizeSwapAria}
                                        title={t.windowSizeSwapAria}
                                        onClick={handleWindowSizeSwap}
                                    >
                                        <svg
                                            className="h-5 w-5"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="1.5"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            aria-hidden
                                        >
                                            <g transform="rotate(-90 12 12)">
                                                <g transform="rotate(45 12 12)">
                                                    <rect
                                                        x="9"
                                                        y="6.75"
                                                        width="6"
                                                        height="10.5"
                                                        rx="1.25"
                                                    />
                                                </g>
                                                <path d="M9.67 3.31A9 9 0 0 0 3.84 15.8" />
                                                <path d="M4.22 13.42 3.84 15.8 1.77 14.56" />
                                                <path d="M14.33 20.69A9 9 0 0 0 20.16 8.2" />
                                                <path d="M19.78 10.58 20.16 8.2 22.23 9.44" />
                                            </g>
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-5">
                            <div className="flex flex-col gap-2">
                                <label
                                    htmlFor="user-agent"
                                    className={formLabelClass}
                                >
                                    {t.userAgentLabel}
                                </label>
                                <input
                                    id="user-agent"
                                    type="text"
                                    value={userAgent}
                                    onChange={(e) =>
                                        setUserAgent(e.target.value)
                                    }
                                    className={formInputClass}
                                    placeholder={t.userAgentPlaceholder}
                                    autoComplete="off"
                                    spellCheck={false}
                                />
                            </div>

                            <div className="flex flex-col gap-2">
                                <label
                                    htmlFor="proxy-url"
                                    className={formLabelClass}
                                >
                                    {t.proxyUrlLabel}
                                </label>
                                <input
                                    id="proxy-url"
                                    type="text"
                                    value={proxyUrl}
                                    onChange={(e) =>
                                        setProxyUrl(e.target.value)
                                    }
                                    className={formInputClass}
                                    placeholder={t.proxyUrlPlaceholder}
                                    autoComplete="off"
                                    spellCheck={false}
                                />
                            </div>
                        </div>

                        {saving ? (
                            <p
                                className="text-center text-sm text-zinc-500 dark:text-zinc-400"
                                role="status"
                            >
                                {t.saving}
                            </p>
                        ) : null}

                        {saveStatus === 'error' && saveError ? (
                            <p
                                className={`${formErrorClass} text-center`}
                                role="alert"
                            >
                                {saveError}
                            </p>
                        ) : null}
                    </form>
                ) : activeSection === 'release-history' ? (
                    <ReleaseHistorySection
                        projectId={id}
                        locale={locale}
                        labels={releaseHistoryLabels(t)}
                    />
                ) : activeSection === 'desktop-settings' ? (
                    <DesktopConfigSection
                        labels={desktopConfigLabels(t)}
                        additionalBrowserArgs={additionalBrowserArgs}
                        onAdditionalBrowserArgsChange={setAdditionalBrowserArgs}
                    />
                ) : activeSection === 'phone-config' ? (
                    <PhoneConfigSection labels={phoneConfigLabels(t)} />
                ) : activeSection === 'script-editor' ? (
                    <ScriptEditorSection />
                ) : activeSection === 'startup-config' ? (
                    <StartupConfigSection labels={startupConfigLabels(t)} />
                ) : (
                    <p className="text-sm leading-relaxed text-zinc-600 sm:text-base dark:text-zinc-400">
                        {getSectionPlaceholder()}
                    </p>
                )}
            </section>

            <PublishDialog
                key={
                    publishDialogOpen
                        ? `publish-${id}-${publishMode}`
                        : 'publish-closed'
                }
                open={publishDialogOpen}
                mode={publishMode}
                labels={
                    publishMode === 'mobile'
                        ? mobilePublishDialogLabels(t)
                        : publishDialogLabels(t)
                }
                initialValues={
                    publishMode === 'mobile'
                        ? ppConfig
                            ? {
                                  ...mobilePublishInitialValuesFromPpConfig(
                                      ppConfig,
                                  ),
                                  method: '',
                              }
                            : project.ppConfig
                              ? {
                                    ...mobilePublishInitialValuesFromPpConfig(
                                        project.ppConfig,
                                    ),
                                    method: '',
                                }
                              : undefined
                        : ppConfig
                          ? publishInitialValuesFromPpConfig(ppConfig)
                          : project.ppConfig
                            ? publishInitialValuesFromPpConfig(
                                  project.ppConfig,
                              )
                            : undefined
                }
                submitting={publishing}
                submitError={publishError}
                onClose={() => {
                    if (publishing) return
                    setPublishDialogOpen(false)
                    setPublishError('')
                }}
                onConfirm={handlePublishConfirm}
            />

            <MessageDialog
                open={deleteConfirmOpen}
                title={t.deleteProject}
                message={t.deleteProjectConfirm}
                cancelLabel={homeT.cancel}
                confirmLabel={homeT.confirm}
                confirmDanger
                loading={isDeleting}
                onClose={() => {
                    if (isDeleting) return
                    setDeleteConfirmOpen(false)
                }}
                onConfirm={() => void confirmDeleteProject()}
            />

            <MessageDialog
                open={deleteAlert.open}
                message={deleteAlert.message}
                confirmLabel={homeT.confirm}
                onClose={() => setDeleteAlert({ open: false, message: '' })}
                onConfirm={() => setDeleteAlert({ open: false, message: '' })}
            />

            <AppIconEditor
                open={iconEditorOpen}
                source={editorSource}
                initialTransform={
                    iconSource && editorSource === iconSource
                        ? iconTransform
                        : undefined
                }
                initialBorderRadius={
                    iconSource && editorSource === iconSource
                        ? iconBorderRadius
                        : undefined
                }
                labels={{
                    title: t.iconEditorTitle,
                    cropHint: t.iconCropHint,
                    radiusLabel: t.iconRadiusLabel,
                    cancel: homeT.cancel,
                    confirm: homeT.confirm,
                }}
                onClose={handleIconEditorClose}
                onConfirm={handleIconEditorConfirm}
            />
        </PageShell>
    )
}
