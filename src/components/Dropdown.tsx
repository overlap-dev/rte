import React, { useState, useRef, useEffect } from 'react';
import { Icon } from './Icons';

interface DropdownProps {
    icon: string;
    label: string;
    options: Array<{ value: string; label: string; icon?: string; color?: string; preview?: string; headingPreview?: string }>;
    onSelect: (value: string) => void;
    currentValue?: string;
    disabled?: boolean;
    showCustomColorInput?: boolean;
}

export const Dropdown: React.FC<DropdownProps> = ({
    icon,
    label,
    options,
    onSelect,
    currentValue,
    disabled,
    showCustomColorInput,
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [customColor, setCustomColor] = useState("#000000");
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const handleSelect = (value: string) => {
        onSelect(value);
        setIsOpen(false);
    };

    const currentOption = options.find(opt => opt.value === currentValue);

    return (
        <div className="rte-dropdown" ref={dropdownRef} onMouseDown={(e) => e.preventDefault()}>
            <button
                type="button"
                onClick={() => !disabled && setIsOpen(!isOpen)}
                disabled={disabled}
                className={`rte-toolbar-button rte-dropdown-button ${currentOption ? 'rte-dropdown-button-has-value' : ''}`}
                title={label}
                aria-label={label}
            >
                <Icon icon={icon} width={18} height={18} />
                {currentOption && (
                    <span className="rte-dropdown-value">{currentOption.label}</span>
                )}
            </button>
            {isOpen && (
                <div className="rte-dropdown-menu">
                    {options.map((option) => (
                        <button
                            key={option.value}
                            type="button"
                            className={`rte-dropdown-item ${currentValue === option.value ? 'rte-dropdown-item-active' : ''}`}
                            onClick={() => handleSelect(option.value)}
                        >
                            {option.color && (
                                <span 
                                    className={`rte-dropdown-color-preview ${currentValue === option.value ? 'active' : ''}`}
                                    style={{ backgroundColor: option.color }}
                                />
                            )}
                            {option.preview && !option.headingPreview && (
                                <span 
                                    className="rte-dropdown-fontsize-preview"
                                    style={{ fontSize: `${option.preview}px` }}
                                >
                                    Aa
                                </span>
                            )}
                            {option.headingPreview && (
                                <span 
                                    className={`rte-dropdown-heading-preview ${option.headingPreview}`}
                                >
                                    {option.headingPreview === 'p' ? 'Normal' : option.headingPreview.toUpperCase()}
                                </span>
                            )}
                            {option.icon && <Icon icon={option.icon} width={16} height={16} />}
                            <span style={{ flex: 1, fontWeight: currentValue === option.value ? 600 : 400 }}>
                                {option.label}
                            </span>
                        </button>
                    ))}
                    {showCustomColorInput && (
                        <div
                            className="rte-color-custom-input"
                            onMouseDown={(e) => e.stopPropagation()}
                        >
                            <input
                                type="color"
                                value={customColor}
                                onChange={(e) => setCustomColor(e.target.value)}
                                title="Pick a color"
                            />
                            <input
                                type="text"
                                value={customColor}
                                onChange={(e) => {
                                    const v = e.target.value;
                                    setCustomColor(v);
                                }}
                                placeholder="#000000"
                                maxLength={7}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        e.preventDefault();
                                        if (/^#[0-9a-fA-F]{3,6}$/.test(customColor)) {
                                            handleSelect(customColor);
                                        }
                                    }
                                }}
                            />
                            <button
                                type="button"
                                className="rte-color-custom-apply"
                                onClick={() => {
                                    if (/^#[0-9a-fA-F]{3,6}$/.test(customColor)) {
                                        handleSelect(customColor);
                                    }
                                }}
                            >
                                Apply
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

