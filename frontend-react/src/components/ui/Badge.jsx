import React from 'react';
import { getBadgeClasses } from '../../styles/designSystem';

const Badge = ({ 
  children, 
  variant = 'primary', 
  className = '',
  icon: Icon,
  ...props 
}) => {
  return (
    <span className={getBadgeClasses(variant, className)} {...props}>
      {Icon && <Icon className="w-3 h-3" />}
      {children}
    </span>
  );
};

export default Badge;
