import type { AccountStrings } from './types'

export const enAccountStrings = {
    centerTitle: 'Account',
    backHome: 'Back to home',
    closeMenu: 'Close menu',
    openMenu: 'Open menu',
    navAria: 'Account',
    authTabsAria: 'Sign in or register',

    groupBasic: 'Basics',
    groupTauriApi: 'TauriApi',
    groupPhoneApi: 'Mobile APIs',

    sectionProfile: 'My profile',
    sectionEnvironment: 'Environment',
    sectionAbout: 'About',
    sectionTauriApps: 'apps',
    sectionTauriCors: 'cors',
    sectionTauriEvent: 'event',
    sectionPhoneFile: 'File I/O',
    sectionPhoneNotification: 'Notifications',
    sectionPhoneLocation: 'Location',
    sectionPhoneCamera: 'Camera',

    profileLoading: 'Loading account…',
    logout: 'Sign out',
    labelNickname: 'Nickname',
    labelEmail: 'Email',
    labelRole: 'Role',
    labelStatus: 'Status',
    labelPoints: 'Points',
    labelCreatedAt: 'Joined',

    environmentDescDesktop:
        'Runtime and API connection details for this desktop client.',
    environmentDescWeb: 'View the current runtime and API configuration.',
    labelRuntime: 'Runtime',
    runtimeDesktop: 'Tauri 2 desktop client',
    runtimeWeb: 'Web browser',
    labelApiUrl: 'API URL',
    labelAppVersion: 'App version',
    labelRust: 'rust',
    labelNode: 'node',
    labelNpm: 'npm',
    labelJava: 'java',
    labelPython: 'python',
    labelCpp: 'c++',
    labelWeb: 'web',
    labelWebStore: 'WebStore',

    phoneApiPlaceholderDesc:
        'Mobile capability placeholders — debugging and permissions will be wired later.',
    tauriApiPlaceholderDesc: 'This feature is under construction. Stay tuned.',
    phoneApiPlaceholderBody:
        '“{title}” will be available soon. This is a placeholder.',
    tauriApiPlaceholderBody:
        'More TauriApi options are coming to help debug and manage desktop apps.',

    aboutDescription:
        'PacBao — package web apps into cross-platform desktop and mobile apps.',
    aboutBody:
        'Built with Tauri 2 and Next.js, PacBao helps you turn web projects into Windows, macOS, and Linux desktops plus mobile installers.',
    aboutDesktopBadge: 'Running in the desktop client',
    aboutOpenSourcePrefix: 'Open source — visit',
    aboutOpenSourceSuffix: 'for details.',

    authLoginTitle: 'Sign in',
    authRegisterTitle: 'Register',
    authLoginSubtitle: 'Sign in with your registered email and password',
    authRegisterSubtitle:
        'Create an account to sync across desktop and the web',
    authLoginTab: 'Sign in',
    authRegisterTab: 'Register',
    authOauthDivider: 'Or continue with',
    authOauthGoogle: 'Google',
    authOauthGitHub: 'GitHub',

    emailLabel: 'Email',
    passwordLabel: 'Password',
    emailPlaceholder: 'you@example.com',
    passwordPlaceholder: '••••••••',
    forgotPassword: 'Forgot password?',
    loginSubmit: 'Sign in',
    loginSubmitting: 'Signing in…',
    registerSubmit: 'Create account',
    registerSubmitting: 'Submitting…',
    noAccountPrompt: 'No account yet?',
    hasAccountPrompt: 'Already have an account?',
    switchToRegister: 'Register',
    switchToLogin: 'Sign in',
    passwordMinPlaceholder: 'At least {min} characters',

    errEmailRequired: 'Enter your email address',
    errEmailInvalid: 'Invalid email format',
    errPasswordRequired: 'Enter your password',
    errPasswordSetRequired: 'Set a password',
    errPasswordMin: 'Password must be at least {min} characters',
    errLoginFailed: 'Sign-in failed. Please try again.',
    errRegisterFailed: 'Registration failed. Please try again.',
    errEmailRegistered: 'This email is already registered. Please sign in.',
} satisfies AccountStrings
