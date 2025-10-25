import React from 'react';
import { pageHeaderStyles, cn } from '../../styles/designSystem';

const PageHeader = ({ 
  title,
  subtitle,
  actions,
  className = '',
  ...props 
}) => {
  return (
    <div className={cn(pageHeaderStyles.container, className)} {...props}>
      <div className={pageHeaderStyles.titleWrapper}>
        <h1 className={pageHeaderStyles.title}>{title}</h1>
        {subtitle && <p className={pageHeaderStyles.subtitle}>{subtitle}</p>}
      </div>
      {actions && (
        <div className={pageHeaderStyles.actions}>
          {actions}
        </div>
      )}
    </div>
  );
};

export default PageHeader;
