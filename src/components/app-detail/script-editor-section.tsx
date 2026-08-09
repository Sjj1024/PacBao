'use client'

import { javascript } from '@codemirror/lang-javascript'
import { oneDark } from '@codemirror/theme-one-dark'
import CodeMirror from '@uiw/react-codemirror'
import { useState } from 'react'

type ScriptEditorSectionProps = {
    value?: string
    onChange?: (value: string) => void
}

const DEFAULT_SCRIPT = `// Custom JavaScript injected into the WebView
console.log('Hello from custom script')
`

/** JS script editor powered by CodeMirror; theme defaults to dark. */
export function ScriptEditorSection({
    value,
    onChange,
}: ScriptEditorSectionProps) {
    const [internalValue, setInternalValue] = useState(DEFAULT_SCRIPT)
    const script = value ?? internalValue

    function handleChange(next: string) {
        if (onChange) {
            onChange(next)
        } else {
            setInternalValue(next)
        }
    }

    return (
        <div className="min-h-[28rem] w-full flex-1 overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-700">
            <CodeMirror
                value={script}
                height="100%"
                minHeight="28rem"
                theme={oneDark}
                extensions={[javascript()]}
                basicSetup={{
                    lineNumbers: true,
                    foldGutter: true,
                    highlightActiveLine: true,
                    autocompletion: true,
                }}
                onChange={handleChange}
                className="h-full text-[13px] [&_.cm-editor]:h-full [&_.cm-editor]:outline-none [&_.cm-scroller]:font-mono"
            />
        </div>
    )
}
