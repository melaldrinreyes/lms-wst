# MINSU E-LEARN - Style Guide

## Design System Overview
This document defines the consistent styling patterns used throughout the MINSU E-LEARN LMS application.

## Color Palette

### Primary Colors
- **Orange (Primary)**: `#F97316` - Used for buttons, links, active states, and key UI elements
  - `bg-orange-500` - Primary buttons, active states
  - `bg-orange-600` - Hover states
  - `text-orange-500` - Links, icons
  - `border-orange-500` - Focus rings, active borders

### Background Colors
- **Dark Background**: 
  - `bg-gray-950` - Main page background
  - `bg-gray-900` - Card backgrounds, sidebar
  - `bg-gray-800` - Input fields, secondary cards

### Border Colors
- **Borders**: `border-gray-800` - All borders and dividers
- **Hover Borders**: `border-orange-500/50` - Hover state borders

### Text Colors
- **Primary Text**: `text-white` - Headings, important text
- **Secondary Text**: `text-gray-300` - Normal text
- **Tertiary Text**: `text-gray-400` - Muted text, labels
- **Placeholder**: `text-gray-500` - Input placeholders

### Status Colors
- **Success**: `bg-green-500`, `text-green-400`
- **Error**: `bg-red-500`, `text-red-400`
- **Warning**: `bg-orange-500`, `text-orange-400`
- **Info**: `bg-blue-500`, `text-blue-400`

## Component Patterns

### Cards
```jsx
<div className="bg-gray-900 dark:bg-gray-950 rounded-xl border border-gray-800 p-6">
  {/* Content */}
</div>
```

### Buttons

**Primary Button:**
```jsx
<button className="px-6 py-3 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600 transition">
  Button Text
</button>
```

**Secondary Button:**
```jsx
<button className="px-6 py-3 bg-gray-800 text-white rounded-lg font-semibold hover:bg-gray-700 transition border border-gray-700">
  Button Text
</button>
```

### Input Fields
```jsx
<input 
  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-white placeholder-gray-500"
  placeholder="Enter text..."
/>
```

### Tables
**Header:**
```jsx
<thead>
  <tr className="border-b border-gray-800">
    <th className="text-left py-4 px-6 text-sm font-semibold text-gray-400">Header</th>
  </tr>
</thead>
```

**Rows:**
```jsx
<tbody className="divide-y divide-gray-800">
  <tr className="hover:bg-gray-800/30 transition">
    <td className="py-4 px-6 text-sm text-white">Content</td>
  </tr>
</tbody>
```

### Badges/Status Pills
```jsx
<span className="inline-block px-3 py-1 bg-orange-500/10 text-orange-400 rounded-lg text-xs font-medium border border-orange-500/20">
  Status
</span>
```

### Navigation Links (Active State)
```jsx
<NavLink 
  className={({ isActive }) => 
    `flex items-center gap-3 px-4 py-3 rounded-lg transition ${
      isActive
        ? 'bg-orange-500/10 text-orange-500 border border-orange-500/20'
        : 'text-gray-300 hover:bg-gray-800 hover:text-orange-500'
    }`
  }
>
  {/* Content */}
</NavLink>
```

### Tabs
```jsx
<button 
  className={`px-6 py-3 text-sm font-semibold transition ${
    isActive 
      ? 'text-orange-500 border-b-2 border-orange-500' 
      : 'text-gray-400 hover:text-gray-300'
  }`}
>
  Tab Label
</button>
```

## Layout Patterns

### Page Container
```jsx
<div className="space-y-6">
  {/* Page content with consistent spacing */}
</div>
```

### Page Header
```jsx
<div className="bg-gray-900 dark:bg-gray-950 rounded-xl p-6 border border-gray-800">
  <h1 className="text-2xl font-bold text-white">Page Title</h1>
  <p className="text-sm text-gray-400 mt-1">Description</p>
</div>
```

### Grid Layouts
```jsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {/* Grid items */}
</div>
```

## Typography

### Headings
- **H1**: `text-2xl font-bold text-white`
- **H2**: `text-xl font-bold text-white`
- **H3**: `text-lg font-semibold text-white`

### Body Text
- **Regular**: `text-sm text-gray-300`
- **Small**: `text-xs text-gray-400`

## Spacing
- **Section Gap**: `space-y-6`
- **Card Padding**: `p-6`
- **Button Padding**: `px-6 py-3`
- **Grid Gap**: `gap-6`

## Border Radius
- **Cards**: `rounded-xl`
- **Buttons**: `rounded-lg`
- **Badges**: `rounded-lg`
- **Avatar**: `rounded-full`

## Hover & Focus States

### Hover
- **Cards**: `hover:border-orange-500/50`
- **Buttons**: `hover:bg-orange-600`
- **Links**: `hover:text-orange-400`

### Focus
- **Inputs**: `focus:ring-2 focus:ring-orange-500 focus:border-transparent`

## Shadows
- Minimal use of shadows; primarily use borders for depth
- **Exception**: Modals and floating elements can use `shadow-xl`

## Transitions
- All interactive elements should have: `transition`
- For complex animations, use Framer Motion

## Dark Mode
All components use the dark theme by default. The `dark:` prefix is kept for future light mode support but currently applies the same dark styles.

## Accessibility
- Maintain color contrast ratios
- Use semantic HTML elements
- Include proper ARIA labels for interactive elements
- Ensure keyboard navigation works for all interactive components

## Icons
- Use **Lucide React** for all icons
- Standard size: `size={20}` for nav items, `size={24}` for headers
- Icon color matches text color in context

## Consistent Component Usage

### Modal
```jsx
<Modal isOpen={isOpen} onClose={handleClose} title="Modal Title">
  {/* Content */}
</Modal>
```

### Toast
```jsx
<Toast 
  message="Action completed!" 
  type="success" // success, error, info, warning
  onClose={handleClose} 
/>
```

## Don't Use
- ❌ Gradient backgrounds (except for specific feature areas)
- ❌ Light backgrounds (`bg-white`, `bg-gray-50`)
- ❌ Cyan/Teal colors (replaced with orange)
- ❌ `shadow-lg` on cards (use borders instead)
- ❌ Multiple color schemes (stick to orange accent)

## File Organization
```
src/
  components/
    ui/           # Reusable UI components (Modal, Toast, etc.)
    Navbar.jsx
    Footer.jsx
    DashboardLayout.jsx
    Chatbot.jsx
  pages/
    student/      # Student-specific pages
    admin/        # Admin-specific pages
    Home.jsx
    Login.jsx
    Register.jsx
    Profile.jsx
```

## Testing Checklist
Before committing changes, ensure:
- [ ] All backgrounds are dark (gray-900/950)
- [ ] Primary color is orange (#F97316)
- [ ] Borders are gray-800
- [ ] Text colors are white/gray-300/gray-400
- [ ] Hover states use orange-500/600
- [ ] Focus rings are orange-500
- [ ] Consistent spacing (space-y-6, p-6, gap-6)
- [ ] Rounded corners (rounded-xl for cards, rounded-lg for buttons)
