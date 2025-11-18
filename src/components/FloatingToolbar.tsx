import React, { useEffect, useState, useRef } from "react";
import { ButtonProps, EditorAPI, Plugin } from "../types";

interface FloatingToolbarProps {
    plugins: Plugin[];
    editorAPI: EditorAPI;
    editorElement: HTMLElement | null;
}

interface Position {
    top: number;
    left: number;
    visible: boolean;
}

export const FloatingToolbar: React.FC<FloatingToolbarProps> = ({
    plugins,
    editorAPI,
    editorElement,
}) => {
    const [position, setPosition] = useState<Position>({
        top: 0,
        left: 0,
        visible: false,
    });
    const toolbarRef = useRef<HTMLDivElement>(null);
    const updateTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const inlinePlugins = plugins.filter(
        (p) => p.type === "inline" && p.name !== "clearFormatting"
    );

    const updatePosition = React.useCallback(() => {
        if (typeof window === 'undefined') {
            setPosition((prev) => ({ ...prev, visible: false }));
            return;
        }
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0 || !editorElement) {
            setPosition((prev) => ({ ...prev, visible: false }));
            return;
        }

        const range = selection.getRangeAt(0);
        
        if (range.collapsed) {
            setPosition((prev) => ({ ...prev, visible: false }));
            return;
        }

        if (!editorElement.contains(range.commonAncestorContainer)) {
            setPosition((prev) => ({ ...prev, visible: false }));
            return;
        }

        const rect = range.getBoundingClientRect();
        const editorRect = editorElement.getBoundingClientRect();
        const toolbarHeight = toolbarRef.current?.offsetHeight || 40;
        const toolbarWidth = toolbarRef.current?.offsetWidth || 200;

        let viewportTop = rect.top - toolbarHeight - 8;
        let viewportLeft = rect.left + rect.width / 2 - toolbarWidth / 2;

        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        if (viewportLeft < 8) {
            viewportLeft = 8;
        }
        if (viewportLeft + toolbarWidth > viewportWidth - 8) {
            viewportLeft = viewportWidth - toolbarWidth - 8;
        }

        if (viewportTop < 8) {
            viewportTop = rect.bottom + 8;
        }
        if (viewportTop + toolbarHeight > viewportHeight - 8) {
            viewportTop = rect.top - toolbarHeight - 8;
            if (viewportTop < 8) {
                viewportTop = 8;
            }
        }

        const relativeTop = viewportTop - editorRect.top + editorElement.scrollTop;
        const relativeLeft = viewportLeft - editorRect.left + editorElement.scrollLeft;

        setPosition({
            top: relativeTop,
            left: relativeLeft,
            visible: true,
        });
    }, [editorElement]);

    const scheduleUpdate = React.useCallback(() => {
        if (updateTimeoutRef.current) {
            clearTimeout(updateTimeoutRef.current);
        }
        updateTimeoutRef.current = setTimeout(() => {
            updatePosition();
        }, 10);
    }, [updatePosition]);

    useEffect(() => {
        const handleSelectionChange = () => {
            scheduleUpdate();
        };

        const handleMouseUp = () => {
            scheduleUpdate();
        };

        const handleKeyUp = () => {
            scheduleUpdate();
        };

        const handleScroll = () => {
            if (position.visible) {
                scheduleUpdate();
            }
        };

        const handleResize = () => {
            if (position.visible) {
                scheduleUpdate();
            }
        };

        document.addEventListener("selectionchange", handleSelectionChange);
        document.addEventListener("mouseup", handleMouseUp);
        document.addEventListener("keyup", handleKeyUp);
        window.addEventListener("scroll", handleScroll, true);
        window.addEventListener("resize", handleResize);

        return () => {
            document.removeEventListener("selectionchange", handleSelectionChange);
            document.removeEventListener("mouseup", handleMouseUp);
            document.removeEventListener("keyup", handleKeyUp);
            window.removeEventListener("scroll", handleScroll, true);
            window.removeEventListener("resize", handleResize);
            if (updateTimeoutRef.current) {
                clearTimeout(updateTimeoutRef.current);
            }
        };
    }, [position.visible, scheduleUpdate]);

    useEffect(() => {
        scheduleUpdate();
    }, [scheduleUpdate]);

    const handlePluginClick = (plugin: Plugin, value?: string) => {
        if (plugin.canExecute?.(editorAPI) !== false) {
            if (plugin.execute) {
                plugin.execute(editorAPI, value);
            } else if (plugin.command && value !== undefined) {
                editorAPI.executeCommand(plugin.command, value);
            } else if (plugin.command) {
                editorAPI.executeCommand(plugin.command);
            }
            setTimeout(() => {
                scheduleUpdate();
            }, 50);
        }
    };

    if (!position.visible || inlinePlugins.length === 0) {
        return null;
    }

    return (
        <div
            ref={toolbarRef}
            className="rte-floating-toolbar"
            style={{
                position: "absolute",
                top: `${position.top}px`,
                left: `${position.left}px`,
            }}
        >
            <div className="rte-floating-toolbar-content">
                {inlinePlugins.map((plugin) => {
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
        </div>
    );
};

