import type { AccountStrings } from './types'

export const koAccountStrings = {
    centerTitle: '사용자 센터',
    backHome: '홈으로',
    closeMenu: '메뉴 닫기',
    openMenu: '메뉴 열기',
    navAria: '사용자 센터',
    authTabsAria: '로그인 / 가입',

    groupBasic: '기본 정보',
    groupTauriApi: 'TauriApi',
    groupPhoneApi: '모바일 API',

    sectionProfile: '내 정보',
    sectionEnvironment: '환경 설정',
    sectionAbout: '소개',
    sectionTauriApps: 'apps',
    sectionTauriCors: 'cors',
    sectionTauriEvent: 'event',
    sectionPhoneFile: '파일 입출력',
    sectionPhoneNotification: '알림',
    sectionPhoneLocation: '위치',
    sectionPhoneCamera: '카메라',

    profileLoading: '계정 정보를 불러오는 중…',
    logout: '로그아웃',
    labelNickname: '닉네임',
    labelEmail: '이메일',
    labelRole: '역할',
    labelStatus: '상태',
    labelPoints: '포인트',
    labelCreatedAt: '가입일',

    environmentDescDesktop:
        '현재 데스크톱 클라이언트의 런타임 및 API 연결 정보입니다.',
    environmentDescWeb: '현재 런타임과 API 설정을 확인합니다.',
    labelRuntime: '런타임',
    runtimeDesktop: 'Tauri 2 데스크톱 클라이언트',
    runtimeWeb: '웹 브라우저',
    labelApiUrl: 'API 주소',
    labelAppVersion: '앱 버전',
    labelRust: 'rust',
    labelNode: 'node',
    labelNpm: 'npm',
    labelJava: 'java',
    labelPython: 'python',
    labelCpp: 'c++',
    labelWeb: 'web',
    labelWebStore: 'WebStore',

    phoneApiPlaceholderDesc:
        '모바일 기능 API 자리 표시자입니다. 디버깅과 권한 설정은 곧 연결됩니다.',
    tauriApiPlaceholderDesc: '이 기능은 준비 중입니다. 기대해 주세요.',
    phoneApiPlaceholderBody:
        '「{title}」 관련 기능이 곧 제공됩니다. 현재는 자리 표시자입니다.',
    tauriApiPlaceholderBody:
        '데스크톱에서 디버깅·관리할 수 있도록 더 많은 TauriApi 설정을 지원할 예정입니다.',

    aboutDescription:
        'PacBao — 웹 앱을 크로스 플랫폼 데스크톱·모바일로 빠르게 패키징합니다.',
    aboutBody:
        'PacBao는 Tauri 2와 Next.js를 기반으로 웹 프로젝트를 Windows, macOS, Linux 데스크톱 및 모바일 설치 패키지로 빠르게 빌드할 수 있게 돕습니다.',
    aboutDesktopBadge: '데스크톱 클라이언트에서 실행 중',
    aboutOpenSourcePrefix: '오픈소스입니다. 자세한 내용은',
    aboutOpenSourceSuffix: '에서 확인하세요.',

    authLoginTitle: '로그인',
    authRegisterTitle: '가입',
    authLoginSubtitle: '등록된 이메일과 비밀번호로 로그인하세요',
    authRegisterSubtitle:
        '계정을 만들면 데스크톱과 웹에서 동기화할 수 있습니다',
    authLoginTab: '로그인',
    authRegisterTab: '가입',
    authOauthDivider: '또는 다른 계정으로 계속',
    authOauthGoogle: 'Google',
    authOauthGitHub: 'GitHub',

    emailLabel: '이메일',
    passwordLabel: '비밀번호',
    emailPlaceholder: 'you@example.com',
    passwordPlaceholder: '••••••••',
    forgotPassword: '비밀번호를 잊으셨나요?',
    loginSubmit: '로그인',
    loginSubmitting: '로그인 중…',
    registerSubmit: '계정 만들기',
    registerSubmitting: '제출 중…',
    noAccountPrompt: '아직 계정이 없나요?',
    hasAccountPrompt: '이미 계정이 있나요?',
    switchToRegister: '가입',
    switchToLogin: '로그인',
    passwordMinPlaceholder: '최소 {min}자',

    errEmailRequired: '이메일 주소를 입력하세요',
    errEmailInvalid: '이메일 형식이 올바르지 않습니다',
    errPasswordRequired: '비밀번호를 입력하세요',
    errPasswordSetRequired: '비밀번호를 설정하세요',
    errPasswordMin: '비밀번호는 최소 {min}자여야 합니다',
    errLoginFailed: '로그인에 실패했습니다. 잠시 후 다시 시도하세요.',
    errRegisterFailed: '가입에 실패했습니다. 잠시 후 다시 시도하세요.',
    errEmailRegistered: '이미 등록된 이메일입니다. 로그인하세요.',
} satisfies AccountStrings
