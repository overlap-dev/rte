import React, { useState, useEffect } from 'react';

interface IconWrapperProps {
    icon: string;
    width?: number;
    height?: number;
    className?: string;
}

export const IconWrapper: React.FC<IconWrapperProps> = ({ icon, width = 18, height = 18, className }) => {
    const [isClient, setIsClient] = useState(false);
    const [IconComponent, setIconComponent] = useState<React.ComponentType<any> | null>(null);

    useEffect(() => {
        setIsClient(true);
        import('@iconify/react').then((module) => {
            setIconComponent(() => module.Icon);
        }).catch(() => {
            console.warn('Failed to load Iconify icon');
        });
    }, []);

    if (!isClient || !IconComponent) {
        return <span style={{ width, height, display: 'inline-block' }} className={className} />;
    }

    return <IconComponent icon={icon} width={width} height={height} className={className} />;
};

