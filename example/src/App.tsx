import {
    Editor,
    EditorAPI,
    EditorContent,
    defaultPlugins,
    indentListItemPlugin,
    linkPlugin,
    outdentListItemPlugin,
} from "hendriks-rte";
import { useRef, useState } from "react";

function App() {
    const [content, setContent] = useState<EditorContent | undefined>();
    const [htmlOutput, setHtmlOutput] = useState<string>("");
    const editorAPIRef = useRef<EditorAPI | null>(null);

    const allPlugins = [
        ...defaultPlugins,
        linkPlugin,
        indentListItemPlugin,
        outdentListItemPlugin,
    ];

    const handleImportHtml = () => {
        const htmlString = prompt(
            "HTML einfügen:",
            '<h1>Beispiel Überschrift</h1><p>Dies ist ein <strong>fetter</strong> Text mit einem <a href="https://example.com">Link</a>.</p>'
        );
        if (htmlString && editorAPIRef.current) {
            editorAPIRef.current.importHtml(htmlString);
        }
    };

    const handleExportHtml = () => {
        if (editorAPIRef.current) {
            const html = editorAPIRef.current.exportHtml();
            setHtmlOutput(html);
            console.log("Exportiertes HTML:", html);
        }
    };

    const handleImageUpload = async (file: File): Promise<string> => {
        // Beispiel: Data URL für Demo-Zwecke
        // In einer echten Anwendung würdest du hier die Datei zu deinem Backend hochladen:
        //
        // const formData = new FormData();
        // formData.append('image', file);
        // const response = await fetch('/api/upload', {
        //     method: 'POST',
        //     body: formData,
        // });
        // const data = await response.json();
        // return data.url; // URL des hochgeladenen Bildes

        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const dataUrl = e.target?.result as string;
                resolve(dataUrl);
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    };

    return (
        <div style={{ padding: "40px", maxWidth: "800px", margin: "0 auto" }}>
            <h1>HENDRIKS-RTE Beispiel</h1>

            {/* HTML Import/Export Buttons */}
            <div
                style={{
                    marginBottom: "20px",
                    display: "flex",
                    gap: "10px",
                    flexWrap: "wrap",
                }}
            >
                <button
                    onClick={handleImportHtml}
                    style={{
                        padding: "8px 16px",
                        background: "#0066cc",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                    }}
                >
                    📥 HTML Importieren
                </button>
                <button
                    onClick={handleExportHtml}
                    style={{
                        padding: "8px 16px",
                        background: "#00aa00",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                    }}
                >
                    📤 HTML Exportieren
                </button>
            </div>

            <Editor
                onChange={(newContent) => {
                    setContent(newContent);
                }}
                onEditorAPIReady={(api) => {
                    editorAPIRef.current = api;
                }}
                plugins={allPlugins}
                placeholder="Beginne zu tippen..."
                fontSizes={[12, 14, 16, 18, 20, 24]}
                colors={["#000000", "#ff0000", "#0000ff", "#00aa00", "#ffaa00"]}
                headings={["h1", "h2", "h3"]}
                onImageUpload={handleImageUpload}
            />

            {/* HTML Output */}
            {htmlOutput && (
                <div
                    style={{
                        marginTop: "20px",
                        padding: "10px",
                        background: "#e8f5e9",
                        borderRadius: "4px",
                    }}
                >
                    <h3>HTML Export:</h3>
                    <pre
                        style={{
                            fontSize: "12px",
                            overflow: "auto",
                            background: "#fff",
                            padding: "10px",
                            borderRadius: "4px",
                        }}
                    >
                        {htmlOutput}
                    </pre>
                </div>
            )}

            {/* JSON Output */}
            <div
                style={{
                    marginTop: "20px",
                    padding: "10px",
                    background: "#f5f5f5",
                    borderRadius: "4px",
                }}
            >
                <h3>JSON Output:</h3>
                <pre style={{ fontSize: "12px", overflow: "auto" }}>
                    {JSON.stringify(content, null, 2)}
                </pre>
            </div>
        </div>
    );
}

export default App;
