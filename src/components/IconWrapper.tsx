import React from 'react';
import { Icon } from './Icons';

interface IconWrapperProps {
    icon: string;
    width?: number;
    height?: number;
    className?: string;
}

export const IconWrapper: React.FC<IconWrapperProps> = ({ icon, width = 18, height = 18, className }) => {
    return <Icon icon={icon} width={width} height={height} className={className} />;
};

