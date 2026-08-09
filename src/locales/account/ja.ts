import type { AccountStrings } from './types'

export const jaAccountStrings = {
    centerTitle: 'ユーザーセンター',
    backHome: 'ホームに戻る',
    closeMenu: 'メニューを閉じる',
    openMenu: 'メニューを開く',
    navAria: 'ユーザーセンター',
    authTabsAria: 'ログイン / 登録',

    groupBasic: '基本情報',
    groupTauriApi: 'TauriApi',
    groupPhoneApi: 'モバイル API',

    sectionProfile: 'マイ情報',
    sectionEnvironment: '環境設定',
    sectionAbout: 'について',
    sectionTauriApps: 'apps',
    sectionTauriCors: 'cors',
    sectionTauriEvent: 'event',
    sectionPhoneFile: 'ファイル I/O',
    sectionPhoneNotification: '通知',
    sectionPhoneLocation: '位置情報',
    sectionPhoneCamera: 'カメラ',

    profileLoading: 'アカウント情報を読み込み中…',
    logout: 'ログアウト',
    labelNickname: 'ニックネーム',
    labelEmail: 'メール',
    labelRole: 'ロール',
    labelStatus: 'ステータス',
    labelPoints: 'ポイント',
    labelCreatedAt: '登録日時',

    environmentDescDesktop:
        'このデスクトップクライアントの実行環境と API 接続情報です。',
    environmentDescWeb: '現在の実行環境と API 設定を確認します。',
    labelRuntime: '実行環境',
    runtimeDesktop: 'Tauri 2 デスクトップクライアント',
    runtimeWeb: 'Web ブラウザ',
    labelApiUrl: 'API URL',
    labelAppVersion: 'アプリバージョン',
    labelRust: 'rust',
    labelNode: 'node',
    labelNpm: 'npm',
    labelJava: 'java',
    labelPython: 'python',
    labelCpp: 'c++',
    labelWeb: 'web',
    labelWebStore: 'WebStore',

    phoneApiPlaceholderDesc:
        'モバイル機能 API のプレースホルダーです。デバッグと権限設定は今後追加予定です。',
    tauriApiPlaceholderDesc: 'この機能は準備中です。しばらくお待ちください。',
    phoneApiPlaceholderBody:
        '「{title}」関連機能は近日公開予定です。現在はプレースホルダーです。',
    tauriApiPlaceholderBody:
        'デスクトップでのデバッグと管理のため、より多くの TauriApi 設定に対応予定です。',

    aboutDescription:
        'TauriHub — Web アプリをクロスプラットフォームのデスクトップ／モバイルへ。',
    aboutBody:
        'TauriHub は Tauri 2 と Next.js を基盤に、Web プロジェクトを Windows / macOS / Linux デスクトップおよびモバイルインストーラへ素早くビルドできます。',
    aboutDesktopBadge: 'デスクトップクライアントで実行中',
    aboutOpenSourcePrefix: 'オープンソースです。詳細は',
    aboutOpenSourceSuffix: 'をご覧ください。',

    authLoginTitle: 'ログイン',
    authRegisterTitle: '登録',
    authLoginSubtitle: '登録済みのメールとパスワードでログイン',
    authRegisterSubtitle:
        'アカウントを作成するとデスクトップと Web で同期できます',
    authLoginTab: 'ログイン',
    authRegisterTab: '登録',
    authOauthDivider: 'または外部アカウントで続行',
    authOauthGoogle: 'Google',
    authOauthGitHub: 'GitHub',

    emailLabel: 'メール',
    passwordLabel: 'パスワード',
    emailPlaceholder: 'you@example.com',
    passwordPlaceholder: '••••••••',
    forgotPassword: 'パスワードをお忘れですか？',
    loginSubmit: 'ログイン',
    loginSubmitting: 'ログイン中…',
    registerSubmit: 'アカウント作成',
    registerSubmitting: '送信中…',
    noAccountPrompt: 'アカウント未作成ですか？',
    hasAccountPrompt: 'すでにアカウントをお持ちですか？',
    switchToRegister: '登録',
    switchToLogin: 'ログイン',
    passwordMinPlaceholder: '少なくとも {min} 文字',

    errEmailRequired: 'メールアドレスを入力してください',
    errEmailInvalid: 'メール形式が正しくありません',
    errPasswordRequired: 'パスワードを入力してください',
    errPasswordSetRequired: 'パスワードを設定してください',
    errPasswordMin: 'パスワードは少なくとも {min} 文字必要です',
    errLoginFailed: 'ログインに失敗しました。しばらくしてから再試行してください。',
    errRegisterFailed: '登録に失敗しました。しばらくしてから再試行してください。',
    errEmailRegistered: 'このメールは既に登録済みです。ログインしてください。',
} satisfies AccountStrings
