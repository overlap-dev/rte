import React, { useState, useRef, useEffect } from 'react';
import { Icon } from './Icons';

interface DropdownProps {
    icon: string;
    label: string;
    options: Array<{ value: string; label: string; icon?: string; color?: string; preview?: string; headingPreview?: string }>;
    onSelect: (value: string) => void;
    currentValue?: string;
    disabled?: boolean;
}

export const Dropdown: React.FC<DropdownProps> = ({
    icon,
    label,
    options,
    onSelect,
    currentValue,
    disabled,
}) => {
    const [isOpen, setIsOpen] = useState(false);
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
        <div className="rte-dropdown" ref={dropdownRef}>
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
                </div>
            )}
        </div>
    );
};

