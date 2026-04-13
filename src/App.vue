<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { open as openDialog } from '@tauri-apps/plugin-dialog'
import { mkdir, writeTextFile } from '@tauri-apps/plugin-fs'
import { join } from '@tauri-apps/api/path'

type ChatRole = 'user' | 'assistant' | 'system'

type ChatMessage = {
    id: string
    role: ChatRole
    content: string
    createdAt: number
}

type Project = {
    id: string
    name: string
    rootDir: string
    createdAt: number
    messages: ChatMessage[]
}

type Settings = {
    openaiBaseUrl: string
    openaiApiKey: string
    openaiModel: string
}

type GeneratedFile = { path: string; content: string }
type GenerationResult = { files: GeneratedFile[]; summary?: string }

const LS_PROJECTS = 'pacbao.projects.v1'
const LS_ACTIVE_PROJECT_ID = 'pacbao.activeProjectId.v1'
const LS_SETTINGS = 'pacbao.settings.v1'

function safeJsonParse<T>(raw: string): T | null {
    try {
        return JSON.parse(raw) as T
    } catch {
        return null
    }
}

function now() {
    return Date.now()
}

function uuid() {
    return crypto.randomUUID()
}

function loadProjects(): Project[] {
    const parsed = safeJsonParse<Project[]>(
        localStorage.getItem(LS_PROJECTS) ?? ''
    )
    return Array.isArray(parsed) ? parsed : []
}

function saveProjects(projects: Project[]) {
    localStorage.setItem(LS_PROJECTS, JSON.stringify(projects))
}

function loadSettings(): Settings {
    const parsed = safeJsonParse<Settings>(
        localStorage.getItem(LS_SETTINGS) ?? ''
    )
    return {
        openaiBaseUrl: parsed?.openaiBaseUrl || 'https://api.openai.com',
        openaiApiKey: parsed?.openaiApiKey || '',
        openaiModel: parsed?.openaiModel || 'gpt-4.1-mini',
    }
}

function saveSettings(s: Settings) {
    localStorage.setItem(LS_SETTINGS, JSON.stringify(s))
}

function extractJsonObject(text: string): string | null {
    // 优先抓 ```json ... ```
    const fenced = text.match(/```json\s*([\s\S]*?)\s*```/i)
    if (fenced?.[1]) return fenced[1]

    // 退化：从第一个 { 到最后一个 }
    const start = text.indexOf('{')
    const end = text.lastIndexOf('}')
    if (start >= 0 && end > start) return text.slice(start, end + 1)
    return null
}

async function callOpenAIChat(args: {
    baseUrl: string
    apiKey: string
    model: string
    messages: { role: ChatRole; content: string }[]
}): Promise<string> {
    const url = `${args.baseUrl.replace(/\/$/, '')}/v1/chat/completions`
    const res = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${args.apiKey}`,
        },
        body: JSON.stringify({
            model: args.model,
            messages: args.messages,
            temperature: 0.2,
        }),
    })

    const json = (await res.json().catch(() => null)) as any
    if (!res.ok) {
        const msg = json?.error?.message || res.statusText || '请求失败'
        throw new Error(`OpenAI 请求失败：${msg}`)
    }
    const content = json?.choices?.[0]?.message?.content
    if (typeof content !== 'string' || !content.trim()) {
        throw new Error('OpenAI 返回内容为空')
    }
    return content
}

async function ensureDirForFile(rootDir: string, filePath: string) {
    const normalized = filePath.replace(/^[/\\]+/, '')
    const parts = normalized.split(/[\\/]/g)
    if (parts.length <= 1) return
    const dirParts = parts.slice(0, -1)
    const dirPath = await join(rootDir, ...dirParts)
    await mkdir(dirPath, { recursive: true })
}

async function writeFilesToProject(rootDir: string, files: GeneratedFile[]) {
    for (const f of files) {
        const rel = f.path.replace(/^[/\\]+/, '')
        await ensureDirForFile(rootDir, rel)
        const abs = await join(rootDir, rel)
        await writeTextFile(abs, f.content)
    }
}

const projects = ref<Project[]>([])
const activeProjectId = ref<string | null>(null)
const settings = ref<Settings>(loadSettings())

const uiTab = ref<'chat' | 'settings'>('chat')

const newProjectName = ref('')
const newProjectDir = ref<string>('')

const userInput = ref('')
const busy = ref(false)
const statusText = ref<string>('')

const activeProject = computed<Project | null>(() => {
    return projects.value.find((p) => p.id === activeProjectId.value) ?? null
})

const canChat = computed(() => {
    return (
        Boolean(activeProject.value) &&
        Boolean(settings.value.openaiApiKey.trim())
    )
})

function setActiveProject(id: string) {
    activeProjectId.value = id
    localStorage.setItem(LS_ACTIVE_PROJECT_ID, id)
}

function upsertProject(updated: Project) {
    const idx = projects.value.findIndex((p) => p.id === updated.id)
    if (idx >= 0) projects.value.splice(idx, 1, updated)
    else projects.value.unshift(updated)
    saveProjects(projects.value)
}

async function pickProjectDir() {
    const selected = await openDialog({
        directory: true,
        multiple: false,
        title: '选择项目目录（将把生成的前端文件写入这里）',
    })
    if (typeof selected === 'string') {
        newProjectDir.value = selected
    }
}

function createProject() {
    const name = newProjectName.value.trim()
    const rootDir = newProjectDir.value.trim()
    if (!name || !rootDir) return

    const p: Project = {
        id: uuid(),
        name,
        rootDir,
        createdAt: now(),
        messages: [
            {
                id: uuid(),
                role: 'system',
                createdAt: now(),
                content:
                    '你是一个资深全栈工程师。用户会提出软件开发需求，你需要先澄清关键问题，然后输出可落地的 HTML+CSS+JS 前端原型。最终必须以 JSON 形式返回文件清单。',
            },
        ],
    }
    projects.value.unshift(p)
    saveProjects(projects.value)
    setActiveProject(p.id)
    newProjectName.value = ''
    newProjectDir.value = ''
}

function pushMessage(project: Project, role: ChatRole, content: string) {
    const msg: ChatMessage = { id: uuid(), role, content, createdAt: now() }
    project.messages.push(msg)
    upsertProject({ ...project })
}

async function sendUserMessage() {
    const p = activeProject.value
    if (!p) return
    const text = userInput.value.trim()
    if (!text) return
    if (!settings.value.openaiApiKey.trim()) {
        statusText.value = '请先在设置里填写 OpenAI API Key。'
        uiTab.value = 'settings'
        return
    }

    busy.value = true
    statusText.value = 'AI 思考中…'
    pushMessage(p, 'user', text)
    userInput.value = ''

    try {
        const assistantText = await callOpenAIChat({
            baseUrl: settings.value.openaiBaseUrl,
            apiKey: settings.value.openaiApiKey,
            model: settings.value.openaiModel,
            messages: p.messages.map((m) => ({
                role: m.role,
                content: m.content,
            })),
        })
        pushMessage(p, 'assistant', assistantText)
        statusText.value =
            '已返回回复。你可以继续补充需求，或点击“生成并保存前端文件”。'
    } catch (e: any) {
        statusText.value = e?.message || '请求失败'
    } finally {
        busy.value = false
    }
}

async function generateAndSave() {
    const p = activeProject.value
    if (!p) return
    if (!settings.value.openaiApiKey.trim()) {
        statusText.value = '请先在设置里填写 OpenAI API Key。'
        uiTab.value = 'settings'
        return
    }

    busy.value = true
    statusText.value = '正在让 AI 生成文件…'

    const generationPrompt: ChatMessage = {
        id: uuid(),
        role: 'system',
        createdAt: now(),
        content: [
            '请基于当前对话需求，生成一个多端自适应的前端原型（HTML + CSS + JS）。',
            '要求：移动端/桌面端自适应；不依赖外部 CDN；可直接双击 index.html 运行；JS 写在单独文件里。',
            '',
            '输出必须是严格 JSON（不要额外文字），格式如下：',
            '{ "files": [ { "path": "index.html", "content": "<!doctype html>..." }, { "path": "assets/app.css", "content": "..." }, { "path": "assets/app.js", "content": "..." } ], "summary": "一句话说明" }',
        ].join('\n'),
    }

    try {
        const assistantText = await callOpenAIChat({
            baseUrl: settings.value.openaiBaseUrl,
            apiKey: settings.value.openaiApiKey,
            model: settings.value.openaiModel,
            messages: [...p.messages, generationPrompt].map((m) => ({
                role: m.role,
                content: m.content,
            })),
        })

        const jsonText = extractJsonObject(assistantText)
        if (!jsonText) throw new Error('AI 返回未包含 JSON，无法解析文件清单。')

        const parsed = safeJsonParse<GenerationResult>(jsonText)
        if (
            !parsed ||
            !Array.isArray(parsed.files) ||
            parsed.files.length === 0
        ) {
            throw new Error('JSON 解析成功但 files 为空。')
        }

        statusText.value = `正在写入 ${parsed.files.length} 个文件到项目目录…`
        await writeFilesToProject(p.rootDir, parsed.files)

        pushMessage(p, 'assistant', assistantText)
        statusText.value = `已保存到：${p.rootDir}`
    } catch (e: any) {
        statusText.value = e?.message || '生成/保存失败'
    } finally {
        busy.value = false
    }
}

function persistSettings() {
    saveSettings(settings.value)
    statusText.value = '设置已保存（仅本机）。'
}

onMounted(() => {
    projects.value = loadProjects()
    const last = localStorage.getItem(LS_ACTIVE_PROJECT_ID)
    if (last && projects.value.some((p) => p.id === last))
        activeProjectId.value = last
    else if (projects.value[0]) activeProjectId.value = projects.value[0].id
})
</script>

<template>
    <div class="app">
        <header class="topbar">
            <div class="brand">
                <div class="brand__title">PacBao</div>
                <div class="brand__sub">
                    项目 + AI 对话 → 生成并保存 HTML/CSS/JS
                </div>
            </div>
            <nav class="tabs">
                <button
                    class="tab"
                    :class="{ 'tab--active': uiTab === 'chat' }"
                    @click="uiTab = 'chat'"
                >
                    对话
                </button>
                <button
                    class="tab"
                    :class="{ 'tab--active': uiTab === 'settings' }"
                    @click="uiTab = 'settings'"
                >
                    设置
                </button>
            </nav>
        </header>

        <div class="layout">
            <aside class="sidebar">
                <div class="panel">
                    <div class="panel__title">项目</div>

                    <div class="project-create">
                        <input
                            v-model="newProjectName"
                            class="input"
                            placeholder="项目名称（例如：电商后台）"
                        />
                        <div class="row">
                            <input
                                v-model="newProjectDir"
                                class="input input--grow"
                                placeholder="项目目录（选择一个文件夹）"
                            />
                            <button
                                class="btn"
                                @click="pickProjectDir"
                                :disabled="busy"
                            >
                                选择
                            </button>
                        </div>
                        <button
                            class="btn btn--primary"
                            @click="createProject"
                            :disabled="
                                busy ||
                                !newProjectName.trim() ||
                                !newProjectDir.trim()
                            "
                        >
                            创建项目
                        </button>
                    </div>

                    <div class="project-list">
                        <button
                            v-for="p in projects"
                            :key="p.id"
                            class="project-item"
                            :class="{
                                'project-item--active':
                                    p.id === activeProjectId,
                            }"
                            @click="setActiveProject(p.id)"
                        >
                            <div class="project-item__name">{{ p.name }}</div>
                            <div class="project-item__dir">{{ p.rootDir }}</div>
                        </button>
                        <div v-if="projects.length === 0" class="muted">
                            还没有项目。先创建一个项目并选择目录。
                        </div>
                    </div>
                </div>
            </aside>

            <main class="main">
                <section v-if="uiTab === 'settings'" class="panel">
                    <div class="panel__title">OpenAI 设置</div>
                    <div class="form">
                        <label class="label">Base URL</label>
                        <input
                            v-model="settings.openaiBaseUrl"
                            class="input"
                            placeholder="https://api.openai.com"
                        />

                        <label class="label">API Key</label>
                        <input
                            v-model="settings.openaiApiKey"
                            class="input"
                            placeholder="sk-..."
                            type="password"
                        />

                        <label class="label">Model</label>
                        <input
                            v-model="settings.openaiModel"
                            class="input"
                            placeholder="gpt-4.1-mini"
                        />

                        <div class="row row--gap">
                            <button
                                class="btn btn--primary"
                                @click="persistSettings"
                                :disabled="busy"
                            >
                                保存设置
                            </button>
                            <div class="muted">
                                提示：Key 仅存本机 localStorage。
                            </div>
                        </div>
                    </div>
                </section>

                <section v-else class="panel">
                    <div class="panel__title">
                        <span>对话</span>
                        <span v-if="activeProject" class="pill">{{
                            activeProject.name
                        }}</span>
                    </div>

                    <div v-if="!activeProject" class="empty">
                        请选择或创建一个项目。
                    </div>

                    <div v-else class="chat">
                        <div class="chat__meta">
                            <div class="muted">
                                保存目录：{{ activeProject.rootDir }}
                            </div>
                            <div class="row row--gap">
                                <button class="btn" @click="uiTab = 'settings'">
                                    设置 API Key
                                </button>
                                <button
                                    class="btn btn--primary"
                                    @click="generateAndSave"
                                    :disabled="busy || !canChat"
                                >
                                    生成并保存前端文件
                                </button>
                            </div>
                        </div>

                        <div class="chat__messages">
                            <div
                                v-for="m in activeProject.messages"
                                :key="m.id"
                                class="msg"
                                :class="`msg--${m.role}`"
                            >
                                <div class="msg__role">
                                    {{
                                        m.role === 'user'
                                            ? '你'
                                            : m.role === 'assistant'
                                            ? 'AI'
                                            : '系统'
                                    }}
                                </div>
                                <pre class="msg__content">{{ m.content }}</pre>
                            </div>
                        </div>

                        <form
                            class="chat__input"
                            @submit.prevent="sendUserMessage"
                        >
                            <textarea
                                v-model="userInput"
                                class="textarea"
                                placeholder="描述你的软件需求，例如：做一个订单管理系统，包含列表/详情/导出…"
                                :disabled="busy || !activeProject"
                            />
                            <div class="row row--gap row--end">
                                <div
                                    class="muted"
                                    v-if="!settings.openaiApiKey.trim()"
                                >
                                    未配置 API Key
                                </div>
                                <button
                                    class="btn btn--primary"
                                    type="submit"
                                    :disabled="
                                        busy ||
                                        !activeProject ||
                                        !userInput.trim() ||
                                        !canChat
                                    "
                                >
                                    发送
                                </button>
                            </div>
                        </form>
                    </div>
                </section>

                <footer class="status" v-if="statusText">
                    {{ statusText }}
                </footer>
            </main>
        </div>
    </div>
</template>

<style>
:root {
    color-scheme: light dark;
    font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto,
        Helvetica, Arial, 'Apple Color Emoji', 'Segoe UI Emoji';
    font-size: 14px;
    line-height: 1.4;
}

body {
    margin: 0;
}

.app {
    min-height: 100vh;
    background: radial-gradient(
            1200px 700px at 20% 0%,
            rgba(100, 108, 255, 0.18),
            transparent 60%
        ),
        radial-gradient(
            900px 500px at 100% 20%,
            rgba(36, 200, 219, 0.14),
            transparent 55%
        ),
        linear-gradient(180deg, rgba(0, 0, 0, 0.02), rgba(0, 0, 0, 0));
}

.topbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 14px 16px;
    position: sticky;
    top: 0;
    backdrop-filter: blur(10px);
    background: color-mix(in oklab, Canvas 88%, transparent);
    border-bottom: 1px solid color-mix(in oklab, CanvasText 12%, transparent);
}

.brand__title {
    font-size: 16px;
    font-weight: 700;
}
.brand__sub {
    font-size: 12px;
    opacity: 0.7;
}

.tabs {
    display: flex;
    gap: 6px;
}

.tab {
    border: 1px solid color-mix(in oklab, CanvasText 14%, transparent);
    background: color-mix(in oklab, Canvas 92%, transparent);
    color: CanvasText;
    padding: 8px 10px;
    border-radius: 10px;
    cursor: pointer;
}
.tab--active {
    border-color: color-mix(in oklab, CanvasText 28%, transparent);
    background: color-mix(in oklab, Canvas 80%, transparent);
}

.layout {
    display: grid;
    grid-template-columns: 320px 1fr;
    gap: 12px;
    padding: 12px;
    align-items: start;
}

.sidebar {
    position: sticky;
    top: 66px;
    align-self: start;
}

.main {
    min-width: 0;
}

.panel {
    border: 1px solid color-mix(in oklab, CanvasText 12%, transparent);
    background: color-mix(in oklab, Canvas 92%, transparent);
    border-radius: 14px;
    padding: 12px;
}

.panel__title {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    font-weight: 700;
    margin-bottom: 10px;
}

.pill {
    font-weight: 600;
    font-size: 12px;
    padding: 4px 8px;
    border-radius: 999px;
    border: 1px solid color-mix(in oklab, CanvasText 14%, transparent);
    opacity: 0.9;
}

.project-create {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.project-list {
    margin-top: 12px;
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.project-item {
    text-align: left;
    border: 1px solid color-mix(in oklab, CanvasText 10%, transparent);
    background: color-mix(in oklab, Canvas 94%, transparent);
    padding: 10px;
    border-radius: 12px;
    cursor: pointer;
}
.project-item--active {
    border-color: color-mix(in oklab, CanvasText 28%, transparent);
}
.project-item__name {
    font-weight: 700;
}
.project-item__dir {
    font-size: 12px;
    opacity: 0.75;
    word-break: break-all;
}

.form {
    display: grid;
    gap: 8px;
    max-width: 680px;
}
.label {
    font-size: 12px;
    opacity: 0.8;
}

.row {
    display: flex;
    align-items: center;
}
.row--gap {
    gap: 10px;
}
.row--end {
    justify-content: flex-end;
}

.input,
.textarea {
    width: 100%;
    border: 1px solid color-mix(in oklab, CanvasText 14%, transparent);
    background: color-mix(in oklab, Canvas 96%, transparent);
    color: CanvasText;
    padding: 10px 12px;
    border-radius: 12px;
    outline: none;
}
.input--grow {
    flex: 1;
}
.textarea {
    min-height: 90px;
    resize: vertical;
}

.btn {
    border: 1px solid color-mix(in oklab, CanvasText 14%, transparent);
    background: color-mix(in oklab, Canvas 92%, transparent);
    color: CanvasText;
    padding: 10px 12px;
    border-radius: 12px;
    cursor: pointer;
    white-space: nowrap;
}
.btn:disabled {
    opacity: 0.55;
    cursor: not-allowed;
}
.btn--primary {
    border-color: color-mix(in oklab, CanvasText 24%, transparent);
    background: color-mix(in oklab, Canvas 82%, transparent);
}

.muted {
    opacity: 0.72;
    font-size: 12px;
}

.empty {
    padding: 12px;
    opacity: 0.8;
}

.chat {
    display: grid;
    gap: 10px;
}

.chat__meta {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    flex-wrap: wrap;
}

.chat__messages {
    border: 1px solid color-mix(in oklab, CanvasText 12%, transparent);
    background: color-mix(in oklab, Canvas 97%, transparent);
    border-radius: 14px;
    padding: 10px;
    height: min(52vh, 520px);
    overflow: auto;
}

.msg {
    display: grid;
    gap: 6px;
    padding: 10px;
    border-radius: 12px;
    margin-bottom: 10px;
    border: 1px solid color-mix(in oklab, CanvasText 10%, transparent);
}
.msg--user {
    background: color-mix(in oklab, Canvas 92%, rgba(100, 108, 255, 0.08));
}
.msg--assistant {
    background: color-mix(in oklab, Canvas 92%, rgba(36, 200, 219, 0.06));
}
.msg--system {
    background: color-mix(in oklab, Canvas 92%, rgba(0, 0, 0, 0.03));
}
.msg__role {
    font-size: 12px;
    font-weight: 700;
    opacity: 0.75;
}
.msg__content {
    margin: 0;
    white-space: pre-wrap;
    word-break: break-word;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
        'Liberation Mono', 'Courier New', monospace;
    font-size: 12.5px;
    line-height: 1.45;
}

.chat__input {
    display: grid;
    gap: 10px;
}

.status {
    margin-top: 10px;
    padding: 10px 12px;
    border-radius: 12px;
    border: 1px solid color-mix(in oklab, CanvasText 12%, transparent);
    background: color-mix(in oklab, Canvas 92%, transparent);
    opacity: 0.9;
}

@media (max-width: 960px) {
    .layout {
        grid-template-columns: 1fr;
    }
    .sidebar {
        position: static;
    }
    .chat__messages {
        height: min(48vh, 460px);
    }
}
</style>
