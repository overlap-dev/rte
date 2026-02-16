import React, { useCallback, useEffect, useRef, useState } from "react";
import { ButtonProps, EditorAPI, Plugin } from "../types";

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
        const timeoutIds: ReturnType<typeof setTimeout>[] = [];

        const handleSelectionChange = () => {
            setUpdateTrigger((prev) => prev + 1);
        };

        const handleMouseUp = () => {
            timeoutIds.push(setTimeout(handleSelectionChange, 10));
        };

        const handleKeyUp = () => {
            timeoutIds.push(setTimeout(handleSelectionChange, 10));
        };

        if (typeof document !== 'undefined') {
            document.addEventListener("selectionchange", handleSelectionChange);
            document.addEventListener("mouseup", handleMouseUp);
            document.addEventListener("keyup", handleKeyUp);
        }

        return () => {
            timeoutIds.forEach(clearTimeout);
            if (typeof document !== 'undefined') {
                document.removeEventListener(
                    "selectionchange",
                    handleSelectionChange,
                );
                document.removeEventListener("mouseup", handleMouseUp);
                document.removeEventListener("keyup", handleKeyUp);
            }
        };
    }, []);

    const handlePluginClick = (plugin: Plugin, value?: string) => {
        if (plugin.canExecute?.(editorAPI) !== false) {
            if (plugin.execute) {
                plugin.execute(editorAPI, value);
            } else if (plugin.command && value !== undefined) {
                editorAPI.executeCommand(plugin.command, value);
            } else if (plugin.command) {
                editorAPI.executeCommand(plugin.command);
            }
            setTimeout(() => setUpdateTrigger((prev) => prev + 1), 50);
        }
    };

    const leftPlugins = plugins.filter((p) => p.name !== "clearFormatting");
    const clearFormattingPlugin = plugins.find(
        (p) => p.name === "clearFormatting"
    );

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

        if (e.key !== "ArrowLeft" && e.key !== "ArrowRight" && e.key !== "Home" && e.key !== "End") return;

        const toolbar = toolbarRef.current;
        if (!toolbar) return;

        const buttons = Array.from(
            toolbar.querySelectorAll<HTMLButtonElement>(
                "button:not(:disabled)"
            )
        );
        if (buttons.length === 0) return;

        const currentIndex = buttons.indexOf(
            document.activeElement as HTMLButtonElement
        );
        if (currentIndex === -1) return;

        e.preventDefault();

        let nextIndex: number;
        switch (e.key) {
            case "ArrowRight":
                nextIndex = (currentIndex + 1) % buttons.length;
                break;
            case "ArrowLeft":
                nextIndex = (currentIndex - 1 + buttons.length) % buttons.length;
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

                    const isActive = isClient && plugin.isActive
                        ? plugin.isActive(editorAPI)
                        : false;
                    const canExecute = isClient && plugin.canExecute
                        ? plugin.canExecute(editorAPI)
                        : true;

                    const currentValue = isClient && plugin.getCurrentValue
                        ? plugin.getCurrentValue(editorAPI)
                        : undefined;

                    const buttonProps: ButtonProps & { [key: string]: any } = {
                        isActive,
                        onClick: () => handlePluginClick(plugin),
                        disabled: !canExecute,
                        onSelect: (value: string) =>
                            handlePluginClick(plugin, value),
                        editorAPI,
                        currentValue,
                    };

                    return (
                        <React.Fragment key={plugin.name}>
                            {plugin.renderButton(buttonProps)}
                        </React.Fragment>
                    );
                })}
            </div>

            {clearFormattingPlugin && clearFormattingPlugin.renderButton && (
                <div className="rte-toolbar-right">
                    <div className="rte-toolbar-divider" />
                    {(() => {
                        const isActive = isClient && clearFormattingPlugin.isActive
                            ? clearFormattingPlugin.isActive(editorAPI)
                            : false;
                        const canExecute = isClient && clearFormattingPlugin.canExecute
                            ? clearFormattingPlugin.canExecute(editorAPI)
                            : true;

                        const buttonProps: ButtonProps & {
                            [key: string]: any;
                        } = {
                            isActive,
                            onClick: () =>
                                handlePluginClick(clearFormattingPlugin),
                            disabled: !canExecute,
                            editorAPI,
                        };

                        return (
                            <React.Fragment key={clearFormattingPlugin.name}>
                                {clearFormattingPlugin.renderButton(
                                    buttonProps
                                )}
                            </React.Fragment>
                        );
                    })()}
                </div>
            )}
        </div>
    );
};
