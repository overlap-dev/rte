import React from 'react';

interface IconProps {
    width?: number;
    height?: number;
    className?: string;
}

export const BoldIcon: React.FC<IconProps> = ({ width = 18, height = 18, className }) => (
    <svg width={width} height={height} viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M15.6 10.79c.97-.67 1.65-1.77 1.65-2.79 0-2.26-1.75-4-4-4H7v14h7.04c2.09 0 3.71-1.7 3.71-3.79 0-1.52-.86-2.82-2.15-3.42zM10 6.5h3c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5h-3v-3zm3.5 9H10v-3h3.5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5z"/>
    </svg>
);

export const ItalicIcon: React.FC<IconProps> = ({ width = 18, height = 18, className }) => (
    <svg width={width} height={height} viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M10 4v3h2.21l-3.42 8H6v3h8v-3h-2.21l3.42-8H18V4z"/>
    </svg>
);

export const UnderlineIcon: React.FC<IconProps> = ({ width = 18, height = 18, className }) => (
    <svg width={width} height={height} viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M12 17c3.31 0 6-2.69 6-6V3h-2.5v8c0 1.93-1.57 3.5-3.5 3.5S8.5 12.93 8.5 11V3H6v8c0 3.31 2.69 6 6 6zm-7 2v2h14v-2H5z"/>
    </svg>
);

export const UndoIcon: React.FC<IconProps> = ({ width = 18, height = 18, className }) => (
    <svg width={width} height={height} viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M12.5 8c-2.65 0-5.05.99-6.9 2.6L2 7v9h9l-3.62-3.62c1.39-1.16 3.16-1.88 5.12-1.88 3.54 0 6.55 2.31 7.6 5.5l2.37-.78C21.08 11.03 17.15 8 12.5 8z"/>
    </svg>
);

export const RedoIcon: React.FC<IconProps> = ({ width = 18, height = 18, className }) => (
    <svg width={width} height={height} viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M18.4 10.6C16.55 8.99 14.15 8 11.5 8c-4.65 0-8.58 3.03-9.96 7.22L3.9 16c1.05-3.19 4.05-5.5 7.6-5.5 1.95 0 3.73.72 5.12 1.88L13 16h9V7l-3.6 3.6z"/>
    </svg>
);

export const ClearFormattingIcon: React.FC<IconProps> = ({ width = 18, height = 18, className }) => (
    <svg width={width} height={height} viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M6 5v.18L8.82 8h2.4L7.73 4.36C7.26 3.85 6.61 3.5 6 3.5c-1.11 0-2 .89-2 2 0 .61.35 1.26.86 1.73L6 5zm14.27 2.5L18.73 9H21v1h-4.27L15 8.27l1.23-1.23c.5-.5 1.15-.73 1.77-.73 1.11 0 2 .89 2 2 0 .62-.23 1.27-.73 1.77L18.27 13H21v1h-5.27l-2-2H9.73l-2 2H3v-1h4.27l2-2H7v-1h2.73l2-2H12v-1h-2.27l2-2h4.54zM5 15h14v2H5v-2z"/>
    </svg>
);

export const LinkIcon: React.FC<IconProps> = ({ width = 18, height = 18, className }) => (
    <svg width={width} height={height} viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"/>
    </svg>
);

export const QuoteIcon: React.FC<IconProps> = ({ width = 18, height = 18, className }) => (
    <svg width={width} height={height} viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M6 17h3l2-4V7H5v6h3zm8 0h3l2-4V7h-6v6h3z"/>
    </svg>
);

export const BulletListIcon: React.FC<IconProps> = ({ width = 18, height = 18, className }) => (
    <svg width={width} height={height} viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M4 10.5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5zm0-6c-.83 0-1.5.67-1.5 1.5S3.17 7.5 4 7.5 5.5 6.83 5.5 6 4.83 4.5 4 4.5zm0 12c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5zM7 19h14v-2H7v2zm0-6h14v-2H7v2zm0-8v2h14V5H7z"/>
    </svg>
);

export const NumberedListIcon: React.FC<IconProps> = ({ width = 18, height = 18, className }) => (
    <svg width={width} height={height} viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M2 17h2v.5H3v1h1v.5H2v1h3v-4H2v1zm1-9h1V4H2v1h1v3zm-1 3h1.8L2 13.1v.9h3v-1H3.2L5 11.9V11H2zm6-5v2h14V6H8zm0 14h14v-2H8v2zm0-6h14v-2H8v2z"/>
    </svg>
);

export const TextColorIcon: React.FC<IconProps> = ({ width = 18, height = 18, className }) => (
    <svg width={width} height={height} viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M2 20h20v4H2v-4zm3.49-3h2.42l1.27-3.58h5.64L16.09 17h2.42L13.25 3h-2.5L5.49 17zm4.22-5.61l2.03-5.79h.12l2.03 5.79H9.71z"/>
    </svg>
);

export const BackgroundColorIcon: React.FC<IconProps> = ({ width = 18, height = 18, className }) => (
    <svg width={width} height={height} viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M20 6h-2.18c.11-.31.18-.65.18-1 0-1.66-1.34-3-3-3-1.05 0-1.96.54-2.5 1.35l-.5.67-.5-.68C10.96 2.54 10.05 2 9 2 7.34 2 6 3.34 6 5c0 .35.07.69.18 1H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-5-2c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zM9 4c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm11 15H4v-2h16v2zm0-5H4V8h5.08L7 10.83 8.62 12 11 8.76l1-1.36 1 1.36L15.38 12 17 10.83 14.92 8H20v6z"/>
    </svg>
);

export const HeadingIcon: React.FC<IconProps> = ({ width = 18, height = 18, className }) => (
    <svg width={width} height={height} viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M5 4v3h5.5v12h3V7H19V4H5z"/>
    </svg>
);

export const FontSizeIcon: React.FC<IconProps> = ({ width = 18, height = 18, className }) => (
    <svg width={width} height={height} viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M9 4v3h5v12h3V7h5V4H9zm-6 8h3v8h3v-8h3V10H3z"/>
    </svg>
);

export const ImageIcon: React.FC<IconProps> = ({ width = 18, height = 18, className }) => (
    <svg width={width} height={height} viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
    </svg>
);

export const CloseIcon: React.FC<IconProps> = ({ width = 18, height = 18, className }) => (
    <svg width={width} height={height} viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
    </svg>
);

export const LoadingIcon: React.FC<IconProps> = ({ width = 18, height = 18, className }) => (
    <svg width={width} height={height} viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z"/>
    </svg>
);

export const UploadIcon: React.FC<IconProps> = ({ width = 18, height = 18, className }) => (
    <svg width={width} height={height} viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M9 16h6v-6h4l-7-7-7 7h4zm-4 2h14v2H5z"/>
    </svg>
);

const iconMap: Record<string, React.FC<IconProps>> = {
    'mdi:format-bold': BoldIcon,
    'mdi:format-italic': ItalicIcon,
    'mdi:format-underline': UnderlineIcon,
    'mdi:undo': UndoIcon,
    'mdi:redo': RedoIcon,
    'mdi:format-clear': ClearFormattingIcon,
    'mdi:link': LinkIcon,
    'mdi:format-quote-close': QuoteIcon,
    'mdi:format-list-bulleted': BulletListIcon,
    'mdi:format-list-numbered': NumberedListIcon,
    'mdi:format-color-text': TextColorIcon,
    'mdi:format-color-fill': BackgroundColorIcon,
    'mdi:format-header-1': HeadingIcon,
    'mdi:format-size': FontSizeIcon,
    'mdi:image': ImageIcon,
    'mdi:close': CloseIcon,
    'mdi:loading': LoadingIcon,
    'mdi:upload': UploadIcon,
};

export const Icon: React.FC<{ icon: string; width?: number; height?: number; className?: string }> = ({ icon, width = 18, height = 18, className }) => {
    const IconComponent = iconMap[icon];
    if (!IconComponent) {
        return <span style={{ width, height, display: 'inline-block' }} />;
    }
    return <IconComponent width={width} height={height} className={className} />;
};

