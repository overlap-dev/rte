import React, { useCallback, useEffect, useRef, useState } from "react";
import { ButtonProps, EditorAPI, Plugin } from "../types";

interface FloatingToolbarProps {
    plugins: Plugin[];
    editorAPI: EditorAPI;
    editorElement: HTMLElement | null;
}

/**
 * Floating toolbar that appears above the current text selection.
 * Uses position:fixed with viewport coordinates for reliable placement.
 */
export const FloatingToolbar: React.FC<FloatingToolbarProps> = ({
    plugins,
    editorAPI,
    editorElement,
}) => {
    const [pos, setPos] = useState({ top: 0, left: 0, visible: false });
    const toolbarRef = useRef<HTMLDivElement>(null);
    const rafRef = useRef<number | null>(null);
    const visibleRef = useRef(false);

    // Keep ref in sync so event handlers never read stale state
    visibleRef.current = pos.visible;

    const leftPlugins = plugins.filter((p) => p.name !== "clearFormatting");
    const clearFormattingPlugin = plugins.find((p) => p.name === "clearFormatting");

    // Core: compute position from current selection
    const updatePosition = useCallback(() => {
        if (typeof window === "undefined" || !editorElement) {
            setPos((p) => (p.visible ? { ...p, visible: false } : p));
            return;
        }

        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) {
            setPos((p) => (p.visible ? { ...p, visible: false } : p));
            return;
        }

        const range = selection.getRangeAt(0);

        // Hide when selection is collapsed (just a cursor)
        if (range.collapsed) {
            setPos((p) => (p.visible ? { ...p, visible: false } : p));
            return;
        }

        // Hide when selection is outside the editor
        if (!editorElement.contains(range.commonAncestorContainer)) {
            setPos((p) => (p.visible ? { ...p, visible: false } : p));
            return;
        }

        const rect = range.getBoundingClientRect();
        const toolbarH = toolbarRef.current?.offsetHeight || 40;
        const toolbarW = toolbarRef.current?.offsetWidth || 200;
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const pad = 8;

        // Prefer above the selection, fall back to below
        let top = rect.top - toolbarH - pad;
        if (top < pad) {
            top = rect.bottom + pad;
        }
        if (top + toolbarH > vh - pad) {
            top = Math.max(pad, rect.top - toolbarH - pad);
        }

        // Center horizontally on the selection, clamp to viewport
        let left = rect.left + rect.width / 2 - toolbarW / 2;
        if (left < pad) left = pad;
        if (left + toolbarW > vw - pad) left = vw - toolbarW - pad;

        setPos({ top, left, visible: true });
    }, [editorElement]);

    // Debounce via requestAnimationFrame for smooth repositioning
    const scheduleUpdate = useCallback(() => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        rafRef.current = requestAnimationFrame(updatePosition);
    }, [updatePosition]);

    // Single set of event listeners -- no deps on visible state
    useEffect(() => {
        // selectionchange covers both mouse and keyboard selection changes
        const onSelectionChange = () => scheduleUpdate();

        // Reposition on scroll (capture phase to catch nested scrolls) and resize
        const onScrollOrResize = () => {
            if (visibleRef.current) scheduleUpdate();
        };

        document.addEventListener("selectionchange", onSelectionChange);
        window.addEventListener("scroll", onScrollOrResize, true);
        window.addEventListener("resize", onScrollOrResize);

        return () => {
            document.removeEventListener("selectionchange", onSelectionChange);
            window.removeEventListener("scroll", onScrollOrResize, true);
            window.removeEventListener("resize", onScrollOrResize);
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
        };
    }, [scheduleUpdate]);

    const handlePluginClick = useCallback(
        (plugin: Plugin, value?: string) => {
            if (plugin.canExecute?.(editorAPI) === false) return;

            if (plugin.execute) {
                plugin.execute(editorAPI, value);
            } else if (plugin.command && value !== undefined) {
                editorAPI.executeCommand(plugin.command, value);
            } else if (plugin.command) {
                editorAPI.executeCommand(plugin.command);
            }

            // Re-check position after formatting changes
            requestAnimationFrame(() => scheduleUpdate());
        },
        [editorAPI, scheduleUpdate]
    );

    const isHidden = !pos.visible || leftPlugins.length === 0;

    return (
        <div
            ref={toolbarRef}
            className="rte-floating-toolbar"
            style={{
                position: "fixed",
                top: pos.top,
                left: pos.left,
                visibility: isHidden ? "hidden" : "visible",
                opacity: isHidden ? 0 : 1,
                pointerEvents: isHidden ? "none" : "auto",
            }}
            // Prevent selection loss when clicking toolbar buttons
            onMouseDown={(e) => e.preventDefault()}
        >
            <div className="rte-floating-toolbar-content">
                <div className="rte-toolbar-left">
                    {leftPlugins.map((plugin) => {
                        if (!plugin.renderButton) return null;

                        const isActive = plugin.isActive
                            ? plugin.isActive(editorAPI)
                            : false;
                        const canExecute = plugin.canExecute
                            ? plugin.canExecute(editorAPI)
                            : true;
                        const currentValue = plugin.getCurrentValue
                            ? plugin.getCurrentValue(editorAPI)
                            : undefined;

                        const buttonProps: ButtonProps & Record<string, unknown> = {
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

                {clearFormattingPlugin?.renderButton && (
                    <div className="rte-toolbar-right">
                        <div className="rte-toolbar-divider" />
                        {(() => {
                            const isActive = clearFormattingPlugin.isActive
                                ? clearFormattingPlugin.isActive(editorAPI)
                                : false;
                            const canExecute = clearFormattingPlugin.canExecute
                                ? clearFormattingPlugin.canExecute(editorAPI)
                                : true;

                            return clearFormattingPlugin.renderButton({
                                isActive,
                                onClick: () => handlePluginClick(clearFormattingPlugin),
                                disabled: !canExecute,
                                editorAPI,
                            } as ButtonProps & Record<string, unknown>);
                        })()}
                    </div>
                )}
            </div>
        </div>
    );
};

