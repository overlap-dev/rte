import React, { useEffect, useState } from "react";
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

    useEffect(() => {
        setIsClient(true);
        
        const handleSelectionChange = () => {
            setUpdateTrigger((prev) => prev + 1);
        };

        const handleMouseUp = () => {
            setTimeout(handleSelectionChange, 10);
        };

        const handleKeyUp = () => {
            setTimeout(handleSelectionChange, 10);
        };

        if (typeof document !== 'undefined') {
            document.addEventListener("selectionchange", handleSelectionChange);
            document.addEventListener("mouseup", handleMouseUp);
            document.addEventListener("keyup", handleKeyUp);
        }

        return () => {
            if (typeof document !== 'undefined') {
                document.removeEventListener(
                    "selectionchange",
                    handleSelectionChange
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

    return (
        <div className={`rte-toolbar rte-toolbar-sticky ${className || ""}`}>
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
