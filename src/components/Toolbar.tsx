import React, { useCallback, useEffect, useRef, useState } from "react";
import { ButtonProps, EditorAPI, Plugin } from "../types";
import { isSelectionInsideEditor } from "../utils/selection";

interface ToolbarProps {
    plugins: Plugin[];
    editorAPI: EditorAPI;
    className?: string;
}

export const Toolbar: React.FC<ToolbarProps> = ({
    plugins,
    editorAPI,
    className,
}) => {
    const [updateTrigger, setUpdateTrigger] = useState(0);
    const [isClient, setIsClient] = useState(false);
    const toolbarRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setIsClient(true);
        if (typeof document === "undefined") return;

        // selectionchange already fires for both mouse and keyboard selection
        // updates; mouseup/keyup were redundant and caused 2-3 re-renders per
        // click. requestAnimationFrame coalesces bursts (e.g. drag-select)
        // into a single render per frame.
        let rafId: number | null = null;
        const scheduleRender = () => {
            if (rafId !== null) return;
            rafId = requestAnimationFrame(() => {
                rafId = null;
                setUpdateTrigger((prev) => prev + 1);
            });
        };

        document.addEventListener("selectionchange", scheduleRender);

        return () => {
            if (rafId !== null) cancelAnimationFrame(rafId);
            document.removeEventListener("selectionchange", scheduleRender);
        };
    }, []);

    const handlePluginClick = (plugin: Plugin, value?: string) => {
        if (!isSelectionInsideEditor(editorAPI.getElement())) return;

        if (plugin.canExecute?.(editorAPI) !== false) {
            if (plugin.execute) {
                plugin.execute(editorAPI, value);
            } else if (plugin.command && value !== undefined) {
                editorAPI.executeCommand(plugin.command, value);
            } else if (plugin.command) {
                editorAPI.executeCommand(plugin.command);
            }
            // Re-render on the next frame so plugin isActive() / getCurrentValue()
            // reflect the post-command DOM. The selectionchange listener also
            // fires for most commands, but not for ones that don't move the
            // caret (e.g. format toggles on a collapsed selection).
            requestAnimationFrame(() => setUpdateTrigger((prev) => prev + 1));
        }
    };

    const leftPlugins = plugins.filter((p) => p.name !== "clearFormatting");
    const clearFormattingPlugin = plugins.find(
        (p) => p.name === "clearFormatting",
    );
    const selectionInside =
        isClient && isSelectionInsideEditor(editorAPI.getElement());

    const pluginButtonProps = (
        plugin: Plugin,
        onClick: () => void,
    ): ButtonProps & { [key: string]: any } => {
        const isActive =
            selectionInside && plugin.isActive
                ? plugin.isActive(editorAPI)
                : false;
        const canExecute = selectionInside
            ? plugin.canExecute
                ? plugin.canExecute(editorAPI)
                : true
            : false;
        const currentValue =
            selectionInside && plugin.getCurrentValue
                ? plugin.getCurrentValue(editorAPI)
                : undefined;

        return {
            isActive,
            onClick,
            disabled: !canExecute,
            onSelect: (value: string) => handlePluginClick(plugin, value),
            editorAPI,
            currentValue,
        };
    };

    // Roving tabindex keyboard navigation (ARIA toolbar pattern)
    const handleToolbarKeyDown = useCallback((e: React.KeyboardEvent) => {
        // Escape: return focus to the editor
        if (e.key === "Escape") {
            e.preventDefault();
            const container = toolbarRef.current?.closest(".rte-container");
            const editor = container?.querySelector<HTMLElement>(".rte-editor");
            if (editor) editor.focus();
            return;
        }

        if (
            e.key !== "ArrowLeft" &&
            e.key !== "ArrowRight" &&
            e.key !== "Home" &&
            e.key !== "End"
        )
            return;

        const toolbar = toolbarRef.current;
        if (!toolbar) return;

        const buttons = Array.from(
            toolbar.querySelectorAll<HTMLButtonElement>(
                "button:not(:disabled)",
            ),
        );
        if (buttons.length === 0) return;

        const currentIndex = buttons.indexOf(
            document.activeElement as HTMLButtonElement,
        );
        if (currentIndex === -1) return;

        e.preventDefault();

        let nextIndex: number;
        switch (e.key) {
            case "ArrowRight":
                nextIndex = (currentIndex + 1) % buttons.length;
                break;
            case "ArrowLeft":
                nextIndex =
                    (currentIndex - 1 + buttons.length) % buttons.length;
                break;
            case "Home":
                nextIndex = 0;
                break;
            case "End":
                nextIndex = buttons.length - 1;
                break;
            default:
                return;
        }

        buttons[nextIndex].focus();
    }, []);

    return (
        <div
            ref={toolbarRef}
            className={`rte-toolbar rte-toolbar-sticky ${className || ""}`}
            onMouseDown={(e) => e.preventDefault()}
            onKeyDown={handleToolbarKeyDown}
            role="toolbar"
            aria-label="Text formatting"
            aria-orientation="horizontal"
        >
            <div className="rte-toolbar-left">
                {leftPlugins.map((plugin) => {
                    if (!plugin.renderButton) return null;

                    return (
                        <React.Fragment key={plugin.name}>
                            {plugin.renderButton(
                                pluginButtonProps(plugin, () =>
                                    handlePluginClick(plugin),
                                ),
                            )}
                        </React.Fragment>
                    );
                })}
            </div>

            {clearFormattingPlugin && clearFormattingPlugin.renderButton && (
                <div className="rte-toolbar-right">
                    <div className="rte-toolbar-divider" />
                    <React.Fragment key={clearFormattingPlugin.name}>
                        {clearFormattingPlugin.renderButton(
                            pluginButtonProps(clearFormattingPlugin, () =>
                                handlePluginClick(clearFormattingPlugin),
                            ),
                        )}
                    </React.Fragment>
                </div>
            )}
        </div>
    );
};
