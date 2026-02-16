import React from 'react';
import { Plugin, EditorAPI, ButtonProps } from '../types';
import { Dropdown } from '../components/Dropdown';
import { getCurrentTextColor, getCurrentBackgroundColor } from '../utils/stateReflection';

const defaultColors = [
    { value: '#000000', label: 'Black', color: '#000000' },
    { value: '#333333', label: 'Dark Gray', color: '#333333' },
    { value: '#666666', label: 'Gray', color: '#666666' },
    { value: '#ff0000', label: 'Red', color: '#ff0000' },
    { value: '#0000ff', label: 'Blue', color: '#0000ff' },
    { value: '#00aa00', label: 'Green', color: '#00aa00' },
    { value: '#ffaa00', label: 'Orange', color: '#ffaa00' },
    { value: '#aa00ff', label: 'Purple', color: '#aa00ff' },
];

export function createTextColorPlugin(colors: string[] = defaultColors.map(c => c.value)): Plugin {
    // Find labels for known colors
    const getColorLabel = (color: string): string => {
        const found = defaultColors.find(c => c.value.toLowerCase() === color.toLowerCase());
        return found ? found.label : color;
    };
    
    const colorOptions = colors.map(color => ({
        value: color,
        label: getColorLabel(color),
        color,
    }));

    return {
        name: 'textColor',
        type: 'inline',
        renderButton: (props: ButtonProps & { onSelect?: (value: string) => void; editorAPI?: EditorAPI; currentValue?: string }) => {
            // Current text color from state reflection
            const currentValue = props.currentValue || (props.editorAPI ? getCurrentTextColor(props.editorAPI) : undefined);
            
            return (
                <Dropdown
                    icon="mdi:format-color-text"
                    label="Text Color"
                    options={colorOptions.map(opt => ({
                        value: opt.value,
                        label: opt.label,
                        color: opt.color,
                    }))}
                    onSelect={(value) => {
                        if (props.onSelect) {
                            props.onSelect(value);
                        } else {
                            props.onClick();
                        }
                    }}
                    currentValue={currentValue}
                    disabled={props.disabled}
                    showCustomColorInput
                />
            );
        },
        execute: (editor: EditorAPI, value?: string) => {
            if (value) {
                editor.executeCommand('foreColor', value);
            }
        },
        canExecute: () => true,
        getCurrentValue: (editor: EditorAPI) => {
            return getCurrentTextColor(editor);
        },
    };
}

export function createBackgroundColorPlugin(colors: string[] = defaultColors.map(c => c.value)): Plugin {
    // Find labels for known colors
    const getColorLabel = (color: string): string => {
        const found = defaultColors.find(c => c.value.toLowerCase() === color.toLowerCase());
        return found ? found.label : color;
    };
    
    const colorOptions = colors.map(color => ({
        value: color,
        label: getColorLabel(color),
        color,
    }));

    return {
        name: 'backgroundColor',
        type: 'inline',
        renderButton: (props: ButtonProps & { onSelect?: (value: string) => void; editorAPI?: EditorAPI; currentValue?: string }) => {
            // Current background color from state reflection
            const currentValue = props.currentValue || (props.editorAPI ? getCurrentBackgroundColor(props.editorAPI) : undefined);
            
            return (
                <Dropdown
                    icon="mdi:format-color-fill"
                    label="Background Color"
                    options={colorOptions.map(opt => ({
                        value: opt.value,
                        label: opt.label,
                        color: opt.color,
                    }))}
                    onSelect={(value) => {
                        if (props.onSelect) {
                            props.onSelect(value);
                        } else {
                            props.onClick();
                        }
                    }}
                    currentValue={currentValue}
                    disabled={props.disabled}
                    showCustomColorInput
                />
            );
        },
        execute: (editor: EditorAPI, value?: string) => {
            if (value) {
                editor.executeCommand('backColor', value);
            }
        },
        canExecute: () => true,
        getCurrentValue: (editor: EditorAPI) => {
            return getCurrentBackgroundColor(editor);
        },
    };
}

