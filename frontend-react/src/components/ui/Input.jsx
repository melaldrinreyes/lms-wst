import React from 'react';
import { inputStyles, formStyles, cn } from '../../styles/designSystem';

const Input = ({ 
  label,
  error,
  helper,
  className = '',
  containerClassName = '',
  ...props 
}) => {
  return (
    <div className={cn(formStyles.group, containerClassName)}>
      {label && (
        <label className={formStyles.label}>
          {label}
        </label>
      )}
      <input
        className={cn(
          inputStyles.base,
          error && inputStyles.error,
          className
        )}
        {...props}
      />
      {helper && !error && (
        <p className={formStyles.helper}>{helper}</p>
      )}
      {error && (
        <p className={formStyles.error}>{error}</p>
      )}
    </div>
  );
};

export default Input;
