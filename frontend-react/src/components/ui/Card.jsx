import React from 'react';
import { getCardClasses } from '../../styles/designSystem';

const Card = ({ 
  children, 
  padding = 'md', 
  hover = false, 
  className = '',
  onClick,
  ...props 
}) => {
  return (
    <div
      onClick={onClick}
      className={getCardClasses(padding, hover, className)}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;
