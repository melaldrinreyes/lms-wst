import React from 'react';
import { statsCardStyles, cn } from '../../styles/designSystem';

const StatsCard = ({ 
  label,
  value,
  icon: Icon,
  iconVariant = 'primary',
  className = '',
  ...props 
}) => {
  return (
    <div className={cn(statsCardStyles.container, className)} {...props}>
      <div className={statsCardStyles.header}>
        <div>
          <p className={statsCardStyles.label}>{label}</p>
          <p className={statsCardStyles.value}>{value}</p>
        </div>
        {Icon && (
          <div className={cn(
            statsCardStyles.icon,
            statsCardStyles.iconVariants[iconVariant]
          )}>
            <Icon className="w-6 h-6 text-white" />
          </div>
        )}
      </div>
    </div>
  );
};

export default StatsCard;
