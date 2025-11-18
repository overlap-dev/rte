import { useState, useRef } from "preact/hooks";
import { Editor } from "../../src/components/Editor.tsx";
import type { EditorContent, EditorAPI } from "../../src/types.ts";

export default function EditorIsland() {
    const [content, setContent] = useState<EditorContent | undefined>();
    const editorAPIRef = useRef<EditorAPI | null>(null);

    const handleExportHtml = () => {
        if (editorAPIRef.current) {
            const html = editorAPIRef.current.exportHtml();
            console.log("Exportiertes HTML:", html);
            alert("HTML wurde in die Konsole exportiert!");
        }
    };

    return (
        <div class="max-w-4xl mx-auto p-4">
            <h1 class="text-3xl font-bold mb-6">HENDRIKS-RTE in Fresh</h1>
            
            <div class="mb-4">
                <button
                    onClick={handleExportHtml}
                    class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                    📤 HTML Exportieren
                </button>
            </div>

            <Editor
                onChange={(newContent) => {
                    setContent(newContent);
                    console.log("Content:", newContent);
                }}
                onEditorAPIReady={(api) => {
                    editorAPIRef.current = api;
                }}
                placeholder="Beginne zu tippen..."
                fontSizes={[12, 14, 16, 18, 20, 24]}
                colors={["#000000", "#ff0000", "#0000ff", "#00aa00", "#ffaa00"]}
                headings={["h1", "h2", "h3"]}
            />

            {content && (
                <div class="mt-6 p-4 bg-gray-100 rounded">
                    <h3 class="font-bold mb-2">JSON Output:</h3>
                    <pre class="text-xs overflow-auto">
                        {JSON.stringify(content, null, 2)}
                    </pre>
                </div>
            )}
        </div>
    );
}

