# Design System Guide

## Color Palette

### Primary (Orange) - Main brand color
- **Use for**: Primary actions, CTAs, important buttons, active states
- Shades: 50-900
- Main: `#f97316` (500)

### Secondary (Blue) - Supporting color
- **Use for**: Secondary actions, info messages, links
- Shades: 50-900
- Main: `#3b82f6` (500)

### Success (Green)
- **Use for**: Success messages, completed states, positive indicators
- Main: `#22c55e` (500)

### Warning (Amber)
- **Use for**: Warning messages, pending states, caution indicators
- Main: `#f59e0b` (500)

### Error (Red)
- **Use for**: Error messages, destructive actions, critical alerts
- Main: `#ef4444` (500)

### Gray Scale
- **Use for**: Text, borders, backgrounds, neutral elements
- Shades: 50-900

## Typography

### Font Families
- **Headings**: Poppins (bold, eye-catching)
- **Body**: Inter (readable, modern)

### Font Sizes
```
xs:   0.75rem  (12px)
sm:   0.875rem (14px)
base: 1rem     (16px)
lg:   1.125rem (18px)
xl:   1.25rem  (20px)
2xl:  1.5rem   (24px)
3xl:  1.875rem (30px)
4xl:  2.25rem  (36px)
5xl:  3rem     (48px)
```

## Spacing

Use Tailwind's spacing scale (4px base):
- `p-2` = 8px
- `p-4` = 16px
- `p-6` = 24px
- `p-8` = 32px

## Components Usage

### Button
```jsx
import { Button } from '@/components/ui';

<Button variant="primary" size="md">Click me</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="outline">Outline</Button>
<Button variant="danger" loading>Loading...</Button>
```

**Variants**: primary, secondary, success, danger, outline, ghost
**Sizes**: sm, md, lg, xl

### Card
```jsx
import { Card } from '@/components/ui';

<Card padding="md" hover>
  <h3>Card Title</h3>
  <p>Card content</p>
</Card>
```

**Padding**: sm, md, lg
**Props**: hover (boolean)

### Badge
```jsx
import { Badge } from '@/components/ui';
import { CheckCircle } from 'lucide-react';

<Badge variant="success" icon={CheckCircle}>Active</Badge>
```

**Variants**: primary, success, warning, error, info, gray

### Input
```jsx
import { Input } from '@/components/ui';

<Input 
  label="Email"
  type="email"
  placeholder="Enter email"
  helper="We'll never share your email"
  error={errors.email}
/>
```

### StatsCard
```jsx
import { StatsCard } from '@/components/ui';
import { Users } from 'lucide-react';

<StatsCard 
  label="Total Students"
  value="156"
  icon={Users}
  iconVariant="primary"
/>
```

### PageHeader
```jsx
import { PageHeader, Button } from '@/components/ui';
import { Plus } from 'lucide-react';

<PageHeader 
  title="My Classes"
  subtitle="Manage your classes and subjects"
  actions={
    <Button variant="primary">
      <Plus className="w-4 h-4" />
      Create Class
    </Button>
  }
/>
```

## Design Tokens

### Shadows
- `shadow-sm`: Subtle elevation
- `shadow-md`: Card elevation
- `shadow-lg`: Modal, dropdown elevation
- `shadow-xl`: Prominent elements
- `shadow-card`: Primary colored shadow

### Border Radius
- `rounded-lg`: 0.5rem (8px)
- `rounded-xl`: 1rem (16px)
- `rounded-2xl`: 1.5rem (24px)
- `rounded-3xl`: 2rem (32px)

### Animations
- `animate-fade-in`: Fade in effect
- `animate-slide-up`: Slide up from bottom
- `animate-slide-down`: Slide down from top
- `animate-scale-in`: Scale in effect

## Best Practices

1. **Consistency**: Use design system components instead of custom styles
2. **Spacing**: Use consistent spacing (multiples of 4px)
3. **Colors**: Stick to the defined color palette
4. **Typography**: Use heading font for titles, body font for content
5. **Buttons**: Primary for main actions, secondary/outline for less important
6. **States**: Use appropriate colors (success=green, error=red, warning=amber)
7. **Dark Mode**: All components support dark mode automatically

## Example Page Structure

```jsx
import { PageHeader, Card, Button, StatsCard, Badge } from '@/components/ui';
import { Users, BookOpen } from 'lucide-react';

function MyPage() {
  return (
    <div className="space-y-6">
      <PageHeader 
        title="Dashboard"
        subtitle="Welcome back!"
        actions={<Button variant="primary">Action</Button>}
      />
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatsCard 
          label="Total Students"
          value="156"
          icon={Users}
          iconVariant="primary"
        />
        <StatsCard 
          label="Total Classes"
          value="12"
          icon={BookOpen}
          iconVariant="secondary"
        />
      </div>
      
      <Card padding="lg">
        <h2 className="text-2xl font-bold mb-4">Content</h2>
        <Badge variant="success">Active</Badge>
      </Card>
    </div>
  );
}
```

## SweetAlert2 Theme

For consistent alerts, use:
```js
Swal.fire({
  icon: 'success',
  title: 'Success!',
  text: 'Your message here',
  confirmButtonColor: '#f97316', // Primary orange
});
```
