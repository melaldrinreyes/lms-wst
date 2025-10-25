// Design System - Consistent styles across the application

export const colors = {
  primary: '#f97316',
  secondary: '#3b82f6',
  success: '#22c55e',
  warning: '#f59e0b',
  error: '#ef4444',
  gray: '#6b7280',
};

// Button Styles
export const buttonStyles = {
  base: 'inline-flex items-center justify-center gap-2 font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed',
  
  sizes: {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2.5 text-base',
    lg: 'px-6 py-3 text-lg',
    xl: 'px-8 py-4 text-xl',
  },
  
  variants: {
    primary: 'bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white shadow-lg hover:shadow-xl focus:ring-primary-500',
    secondary: 'bg-gradient-to-r from-secondary-500 to-secondary-600 hover:from-secondary-600 hover:to-secondary-700 text-white shadow-lg hover:shadow-xl focus:ring-secondary-500',
    success: 'bg-gradient-to-r from-success-500 to-success-600 hover:from-success-600 hover:to-success-700 text-white shadow-lg hover:shadow-xl focus:ring-success-500',
    danger: 'bg-gradient-to-r from-error-500 to-error-600 hover:from-error-600 hover:to-error-700 text-white shadow-lg hover:shadow-xl focus:ring-error-500',
    outline: 'border-2 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 focus:ring-gray-500',
    ghost: 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300',
  },
};

// Card Styles
export const cardStyles = {
  base: 'bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700',
  hover: 'transition-all duration-200 hover:shadow-xl hover:scale-[1.02]',
  padding: {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  },
};

// Input Styles
export const inputStyles = {
  base: 'w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-all',
  error: 'border-error-500 focus:ring-error-500',
  success: 'border-success-500 focus:ring-success-500',
};

// Badge Styles
export const badgeStyles = {
  base: 'inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold',
  variants: {
    primary: 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400',
    success: 'bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-400',
    warning: 'bg-warning-100 text-warning-700 dark:bg-warning-900/30 dark:text-warning-400',
    error: 'bg-error-100 text-error-700 dark:bg-error-900/30 dark:text-error-400',
    info: 'bg-secondary-100 text-secondary-700 dark:bg-secondary-900/30 dark:text-secondary-400',
    gray: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
  },
};

// Table Styles
export const tableStyles = {
  wrapper: 'bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden',
  table: 'w-full',
  thead: 'bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600',
  th: 'px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider',
  tbody: 'divide-y divide-gray-200 dark:divide-gray-700',
  tr: 'hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors',
  td: 'px-6 py-4 text-sm text-gray-900 dark:text-white',
};

// Modal Styles
export const modalStyles = {
  overlay: 'fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4',
  container: 'bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6',
  header: 'text-2xl font-bold text-gray-900 dark:text-white mb-4',
  body: 'text-gray-600 dark:text-gray-400 mb-6',
  footer: 'flex gap-3 justify-end',
};

// Page Header Styles
export const pageHeaderStyles = {
  container: 'flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6',
  titleWrapper: '',
  title: 'text-3xl font-bold text-gray-900 dark:text-white font-heading',
  subtitle: 'text-gray-600 dark:text-gray-400 mt-1',
  actions: 'flex items-center gap-3',
};

// Stats Card Styles
export const statsCardStyles = {
  container: 'bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700',
  header: 'flex items-center justify-between',
  label: 'text-sm text-gray-600 dark:text-gray-400',
  value: 'text-3xl font-bold text-gray-900 dark:text-white mt-2',
  icon: 'p-3 rounded-lg',
  iconVariants: {
    primary: 'bg-gradient-to-br from-primary-500 to-primary-600',
    secondary: 'bg-gradient-to-br from-secondary-500 to-secondary-600',
    success: 'bg-gradient-to-br from-success-500 to-success-600',
    warning: 'bg-gradient-to-br from-warning-500 to-warning-600',
    error: 'bg-gradient-to-br from-error-500 to-error-600',
  },
};

// Form Styles
export const formStyles = {
  group: 'mb-6',
  label: 'block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2',
  helper: 'mt-1 text-sm text-gray-500 dark:text-gray-400',
  error: 'mt-1 text-sm text-error-600 dark:text-error-400',
};

// Gradient Backgrounds
export const gradients = {
  primary: 'bg-gradient-to-r from-primary-500 to-primary-600',
  secondary: 'bg-gradient-to-r from-secondary-500 to-secondary-600',
  success: 'bg-gradient-to-r from-success-500 to-success-600',
  warning: 'bg-gradient-to-r from-warning-500 to-warning-600',
  error: 'bg-gradient-to-r from-error-500 to-error-600',
  primaryBr: 'bg-gradient-to-br from-primary-500 to-primary-600',
  secondaryBr: 'bg-gradient-to-br from-secondary-500 to-secondary-600',
};

// Animations
export const animations = {
  fadeIn: 'animate-fade-in',
  slideUp: 'animate-slide-up',
  slideDown: 'animate-slide-down',
  scaleIn: 'animate-scale-in',
};

// Helper function to combine classes
export const cn = (...classes) => {
  return classes.filter(Boolean).join(' ');
};

// Get button classes
export const getButtonClasses = (variant = 'primary', size = 'md', className = '') => {
  return cn(
    buttonStyles.base,
    buttonStyles.sizes[size],
    buttonStyles.variants[variant],
    className
  );
};

// Get card classes
export const getCardClasses = (padding = 'md', hover = false, className = '') => {
  return cn(
    cardStyles.base,
    cardStyles.padding[padding],
    hover && cardStyles.hover,
    className
  );
};

// Get badge classes
export const getBadgeClasses = (variant = 'primary', className = '') => {
  return cn(
    badgeStyles.base,
    badgeStyles.variants[variant],
    className
  );
};

export default {
  colors,
  buttonStyles,
  cardStyles,
  inputStyles,
  badgeStyles,
  tableStyles,
  modalStyles,
  pageHeaderStyles,
  statsCardStyles,
  formStyles,
  gradients,
  animations,
  cn,
  getButtonClasses,
  getCardClasses,
  getBadgeClasses,
};
