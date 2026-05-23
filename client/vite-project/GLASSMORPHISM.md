# Glassmorphism Design System

A comprehensive glass-effect design system that creates a modern, frosted-glass appearance across all UI components.

## Core Principles

The glassmorphism effect works by layering semi-transparent elements with `backdrop-filter: blur()` over gradient backgrounds. **Never use glass effects on solid colors** — they require a textured or gradient background to be visually effective.

## CSS Classes

### Primary Glass Variants

#### `.glass` (Standard)
The default glass effect for most components.
- Background: `rgba(255, 255, 255, 0.08)`
- Blur: `16px` + `saturate(180%)`
- Border: `1px solid rgba(255, 255, 255, 0.12)`
- Shadow: `0 8px 32px rgba(0, 0, 0, 0.25)` + inset highlight

```jsx
<div className="glass p-6">Content</div>
```

#### `.glass-light` (Cards & Modals)
Enhanced glass effect for prominent surfaces like cards and modal dialogs.
- Background: `rgba(255, 255, 255, 0.12)` (12% opacity instead of 8%)
- Better visibility on cards and modal dialogs
- Stronger inset highlight for depth

```jsx
<Card glass={true} />
<Modal />
```

#### `.glass-dark` (Sidebars & Overlays)
For dark surfaces like sidebars that float over the background.
- Background: `rgba(0, 0, 0, 0.25)`
- Maintains dark aesthetic while showing background texture
- Used in sidebar and dark overlay components

```jsx
<Sidebar /> // Already applies glass-dark
```

#### `.glass-frosted` (Hero Sections)
Maximum blur for prominent hero sections and statements.
- Background: `rgba(255, 255, 255, 0.05)` (subtle)
- Blur: `24px` (double strength)
- Best for large featured areas

```jsx
<div className="glass-frosted p-12">Featured content</div>
```

#### `.glass-sm` (Small Elements)
Compact glass effect for buttons, badges, and small UI elements.
- Background: `rgba(255, 255, 255, 0.08)`
- Blur: `12px` (reduced)
- Border-radius: `12px` (smaller)
- Shadow: `0 4px 16px` (reduced)

```jsx
<Button variant="glass" />
<Badge glass={true} />
```

## Component Usage

### Cards
```jsx
import { Card, CardHeader, CardBody } from "@/components/ui/Card";

// With glassmorphism (default)
<Card>
  <CardHeader title="Analytics" />
  <CardBody>Content</CardBody>
</Card>

// Without glassmorphism
<Card glass={false}>
  <CardHeader title="Analytics" />
  <CardBody>Content</CardBody>
</Card>
```

### Modals
```jsx
import { Modal } from "@/components/ui/Modal";

<Modal open={open} onClose={close} title="Edit Profile">
  {/* Modal automatically uses glass-light effect */}
</Modal>
```

### Buttons
```jsx
import { Button } from "@/components/ui/Button";

// Solid primary button
<Button variant="primary">Save</Button>

// Glass button (subtle, modern)
<Button variant="glass">Settings</Button>

// Danger button
<Button variant="danger">Delete</Button>

// Ghost button
<Button variant="ghost">Cancel</Button>
```

### Badges
```jsx
import { Badge } from "@/components/ui/Badge";

// Traditional badge
<Badge label="paid" />

// Glass badge (modern, matches card background)
<Badge label="paid" glass={true} />
```

### Stat Cards
```jsx
import { StatCard } from "@/components/ui/StatCard";

// With glassmorphism (default)
<StatCard icon="💰" label="Revenue" value="$45,231" />

// Without glassmorphism
<StatCard icon="💰" label="Revenue" value="$45,231" glass={false} />
```

### Empty State
```jsx
import { EmptyState } from "@/components/ui/EmptyState";

// With glassmorphism (default)
<EmptyState 
  icon="📭" 
  title="No invoices" 
  description="Create your first invoice to get started"
/>

// Without glassmorphism
<EmptyState 
  icon="📭" 
  title="No invoices"
  glass={false}
/>
```

### Dark Mode Toggle
```jsx
import { DarkModeToggle } from "@/components/ui/DarkModeToggle";

// Automatically uses glass-sm styling
<DarkModeToggle />
```

### Sidebar
```jsx
import { Sidebar } from "@/components/layout/Sidebar";

// Automatically uses glass-dark for sidebar background
<Sidebar />
```

## Dark Mode Support

All glass variants automatically adjust for dark mode:

```css
:root.dark .glass {
  background: rgba(0, 0, 0, 0.25);
  border-color: rgba(255, 255, 255, 0.1);
}

:root.dark .glass:hover {
  background: rgba(0, 0, 0, 0.3);
  border-color: rgba(255, 255, 255, 0.15);
}
```

Components automatically adapt when `dark` class is added to `<html>`.

## Hover States

All glass effects include smooth hover transitions:

- **Background opacity** increases by ~0.05
- **Border opacity** increases slightly
- **Shadow** becomes more pronounced
- **Transform** lifts element by 2px (`translateY(-2px)`)

Dark mode hover states adjust contrast appropriately.

## Background Gradient Setup

Glassmorphism requires gradient backgrounds to work effectively. The base setup in `index.css`:

```css
body {
  background-image: linear-gradient(135deg, hsl(220, 90%, 96%), hsl(217, 65%, 92%));
}

:root.dark body {
  background-image: linear-gradient(135deg, #0f172a, #1e293b);
}
```

These gradients create texture that the blur effect interacts with, making the glass visible. Without these backgrounds, the glass effect will appear flat.

## Best Practices

✅ **Do:**
- Use `.glass-light` for cards, panels, and modals
- Use `.glass-dark` for sidebars and dark overlays
- Use `.glass-sm` for buttons, badges, and small UI
- Use gradient backgrounds under glass elements
- Apply consistent spacing (p-4 to p-8) inside glass containers
- Maintain dark mode support by testing with `dark` class

❌ **Don't:**
- Place glass effects on solid color backgrounds (they won't be visible)
- Use glass on low-contrast backgrounds
- Mix different glass variants in the same visual hierarchy
- Forget dark mode — always test with `prefers-color-scheme: dark`
- Use glass on text-heavy sections (prefer solid backgrounds for readability)

## Customization

To customize glass effects globally, edit CSS variables in `src/index.css`:

```css
.glass {
  background: rgba(255, 255, 255, 0.08); /* Adjust opacity here */
  backdrop-filter: blur(16px) saturate(180%); /* Adjust blur here */
  border: 1px solid rgba(255, 255, 255, 0.12); /* Adjust border here */
  /* ... */
}
```

To customize for a specific component, override the class:

```jsx
<div className="glass !bg-blue-400/20">
  Custom glass variant
</div>
```

## Browser Support

- ✅ Chrome/Edge 76+
- ✅ Firefox 103+
- ✅ Safari 9+
- Support for `-webkit-backdrop-filter` is included for broader compatibility

## Examples

### Dashboard Layout
```jsx
<div className="gap-6 grid grid-cols-3">
  <StatCard icon="💰" label="Revenue" value="$45,231" glass={true} />
  <StatCard icon="📦" label="Orders" value="1,234" glass={true} />
  <StatCard icon="👥" label="Customers" value="892" glass={true} />
</div>
```

### Form with Glass Card
```jsx
<Card glass={true}>
  <CardHeader title="Edit Profile" />
  <CardBody>
    <form className="space-y-4">
      <input type="text" placeholder="Name" />
      <Button variant="primary">Save</Button>
      <Button variant="ghost">Cancel</Button>
    </form>
  </CardBody>
</Card>
```

### Navigation with Glass Elements
```jsx
<Sidebar /> {/* Uses glass-dark automatically */}
<header className="glass-sm">
  <div className="flex justify-between items-center px-6 py-3">
    <h1>Dashboard</h1>
    <DarkModeToggle /> {/* Uses glass-sm automatically */}
  </div>
</header>
```

## Migration Guide

If converting existing components to glass:

1. Identify where you want the glass effect (cards, modals, etc.)
2. Add the `glass={true}` prop (default for most components)
3. Ensure the component is on a gradient background
4. Test hover states and dark mode
5. Adjust opacity with `!bg-white/X` utilities if needed

Example before/after:

```jsx
// Before
<Card className="bg-white border border-slate-200">Content</Card>

// After
<Card glass={true}>Content</Card>
```

## Accessibility Considerations

- Glass effects maintain sufficient contrast for text readability
- All interactive elements (buttons, links) have clear hover states
- Dark mode provides appropriate contrast in all themes
- Consider reducing motion preferences (prefers-reduced-motion)

---

For questions or issues, refer to the component source files in `/src/components/ui/`.
