# Crystalline Editorial Design System

A sophisticated, high-end UI design system emphasizing glassmorphism, editorial typography, and atmospheric depth.

## Overview

**The North Star:** "The Atmospheric Curator" — treating the interface as a living environment with layers of frosted crystal suspended in a well-lit gallery. Moving away from "boxed-in" traditional SaaS toward high-end, editorial experiences.

---

## 1. Color Palette

### Surface Hierarchy (No Borders)
Instead of using borders to separate ideas, we use **altitude** and color shifts:

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `surface` | `#f7f9fb` | `#0f1419` | Base canvas |
| `surface-container-lowest` | `#ffffff` | `#0f1419` | Nested content, input fields |
| `surface-container-low` | `#f2f4f6` | `#161b22` | Secondary layout sections |
| `surface-container` | `#eceef0` | `#1d2228` | Glass cards & main UI |
| `surface-container-high` | `#e8eaec` | `#272d34` | Hover states, emphasis |
| `surface-container-highest` | `#e0e3e5` | `#323940` | Active states, nesting |

### Semantic Colors

| Color | Light | Dark | Usage |
|-------|-------|------|-------|
| **Primary** | `#004ac6` | `#a5c9ff` | CTAs, emphasis, primary actions |
| **Primary Container** | `#2563eb` | `#0032cc` | Gradient partner for Primary |
| **Secondary** | `#505f76` | `#cad5e7` | Secondary actions |
| **Tertiary** | `#005a82` | `#7bd4ff` | Success, positive states |
| **Error** | `#ba1a1a` | `#ffb4ab` | Destructive, failures |

### Supporting Tokens

- **on-surface:** `#191c1e` (light), `#e2e2e6` (dark) — Text for primary content
- **on-surface-variant:** `#434655` (light), `#c5c7cf` (dark) — Text for secondary content
- **outline:** `#737686` — Dividers and subtle borders
- **outline-variant:** `#c3c6d7` (light), `#49454e` (dark) — Ghost borders (15% opacity)

---

## 2. Typography

*Dual-font strategy for balance between character and utility.*

### Fonts
- **Headlines (Manrope):** Geometric yet warm curves, architectural feel
- **Body (Inter):** Mathematical precision, optimal readability

### Type Scale

| Style | Size | Weight | Usage |
|-------|------|--------|-------|
| `display-lg` | 3.5rem | 700 | High-impact data points |
| `headline-lg` | 2rem | 600 | Page headers |
| `headline-md` | 1.75rem | 600 | Section headers |
| `headline-sm` | 1.5rem | 600 | Card titles |
| `title-lg` | 1.375rem | 600 | Subheadings |
| `title-md` | 1rem | 600 | Card headers |
| `body-lg` | 1rem | 400 | Primary content |
| `body-md` | 0.875rem | 400 | Default text |
| `label-lg` | 0.75rem | 600 | Button labels, caps |
| `label-md` | 0.625rem | 600 | Status badges, uppercase |

---

## 3. Elevation & Shadow

**Ambient shadows for organic depth**—no artificial drop shadows.

```css
/* Ambient shadows that mimic natural light */
shadow-ambient-sm: 0 2px 8px rgba(25, 28, 30, 0.03)
shadow-ambient: 0 8px 24px rgba(25, 28, 30, 0.05)
shadow-ambient-lg: 0 12px 32px rgba(25, 28, 30, 0.08)

/* Glass shadow with inset highlight */
shadow-glass: 0 8px 32px rgba(25, 28, 30, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.2)
```

---

## 4. Components

### Glass Card  *The Cornerstone*
```jsx
<div className="glass-card p-6 rounded-2xl">
  {content}
</div>
```

**Styling:**
- `background: rgba(242, 244, 246, 0.6)` with `backdrop-filter: blur(20px)`
- `border: 1px solid rgba(255, 255, 255, 0.2)`
- `border-radius: 1.5rem` (xl)
- `shadow-glass` for ambient depth
- No borders to define structure—uses color altitude instead

---

### Button Variants

#### Primary Button
```jsx
<Button variant="primary">Save</Button>
```
- Gradient: `primary` → `primary-container`
- Rounded: `xl` (1.5rem)
- Padding: `px-4 py-2`
- Text: `on-primary` (white)

#### Secondary Button (Glass)
```jsx
<Button variant="secondary">Options</Button>
```
- `glass-card` background with 50% opacity
- Matches card surfaces
- Subtle, editorial feel

#### Ghost Button
```jsx
<Button variant="ghost">Cancel</Button>
```
- Border: `outline/20`
- Background: `surface-container-lowest`
- Minimal, accessible

#### Danger Button
```jsx
<Button variant="danger">Delete</Button>
```
- Background: `error`
- Text: `on-error`
- High-contrast delete action

### Status Badge
```jsx
<Badge label="paid" />
<Badge label="pending" />
<Badge label="overdue" />
```

**Colors:**
- `paid`: `tertiary-container` text
- `pending`: `surface-container-high` text
- `overdue`: `error-container` text
- Style: `px-3 py-1 rounded-full text-label-md uppercase`

---

### Card Component
```jsx
<Card glass={true}>
  <CardHeader title="Title" subtitle="Optional description" />
  <CardBody>{content}</CardBody>
</Card>
```

Uses `.glass-card` by default for the Crystalline aesthetic.

---

### Modal
```jsx
<Modal open={isOpen} onClose={onClose} title="Confirm Action">
  {content}
</Modal>
```

- **Backdrop:** `bg-black/40 backdrop-blur-glass`
- **Panel:** `.glass-card` with `rounded-3xl`
- **Border:** `border-outline/10` for subtle dividers
- **Spacing:** Generous padding (px-8 py-6)

---

### Input Fields
```jsx
<input className="bg-surface-container-lowest border border-outline/20 rounded-lg px-4 py-2" />
```

**Focus State:**
- Border: `primary`
- Shadow: `0 0 0 3px rgba(0, 74, 198, 0.1)`
- No glow effects—sharp, professional

---

### Data Tables
```html
<table>
  <thead className="bg-surface-container-high">
    <tr>
      <th className="text-label-md uppercase">Column</th>
    </tr>
  </thead>
  <tbody className="divide-y divide-outline/10">
    <tr className="hover:bg-surface-container-highest transition">
      <td>{content}</td>
    </tr>
  </tbody>
</table>
```

- **Header:** `surface-container-high` background, no vertical lines
- **Rows:** Divided by `outline/10` border, or no line—just hover state
- **Hover:** Shift to `surface-container-highest`

---

## 5. Layout Patterns

### Sidebar
```jsx
<aside className="glass-card w-64 rounded-none">
  {/* Navigation */}
</aside>
```

- Uses `.glass-card` for the glass effect
- Full-height frosted pane
- Active nav items: `bg-primary-container/10 text-primary`

### Header
```jsx
<header className="glass-card rounded-none">
  {/* Topbar content */}
</header>
```

Continuous frosted layer across viewport width.

---

## 6. Rules & Best Practices

### ✅ Do

- **Embrace negative space** — If crowded, increase margin rather than add dividers
- **Layer glass** — Use glass surfaces for major containers (sidebars, cards)
- **Use tonal shifts** — Distinguish active states through color, not borders
- **Gradient CTAs** — All primary buttons use `primary` → `primary-container` gradient
- **Editorial spacing** — Minimum 32px (2rem) padding inside glass cards
- **On-surface variants** — Use `on-surface` for titles, `on-surface-variant` for descriptions

### ❌ Don't

- **No pure black** — Always use `on-surface` (#191c1e) for dark elements
- **No heavy borders** — Use "ghost borders" (15% opacity) only when necessary
- **Don't over-blur** — Limit to two glass layers max to preserve UI clarity
- **No standard icons** — Use thin-stroke (1.5px) icons matching `body-md` weight
- **No solid backgrounds under glass** — Glass requires texture/gradient to be effective

---

## 7. Dark Mode

All tokens change automatically via CSS variables when `.dark` class is added to `<html>`:

```css
:root.dark {
  --surface: #0f1419;
  --primary: #a5c9ff;
  --error: #ffb4ab;
  /* ... etc */
}
```

Components inherit automatically through tailwind color classes like `text-on-surface`, `bg-surface-container`, etc.

---

## 8. Implementation

### Tailwind Config
```js
extend: {
  colors: {
    surface: '#f7f9fb',
    'surface-container': '#eceef0',
    primary: '#004ac6',
    tertiary: '#005a82',
    // ... etc
  },
  backdropBlur: {
    glass: '20px',
  }
}
```

### CSS Classes
- `.glass-card` — Main glass surface (cards, modals, sidebar)
- `.ghost-border` — Subtle container edges (15% opacity outline)
- `.scale-98-active` — Button press animation (98% scale)

### Component Updates
All major components updated to use new color system:
- ✅ Card
- ✅ Modal
- ✅ Button (4 variants)
- ✅ Badge
- ✅ StatCard
- ✅ EmptyState
- ✅ DarkModeToggle
- ✅ Sidebar

---

## 9. Customization

To adjust glass intensity globally:
```css
.glass-card {
  background: rgba(242, 244, 246, 0.6); /* Adjust opacity: 0.5–0.8 */
  backdrop-filter: blur(20px); /* Adjust blur: 12px–24px */
}
```

To customize for a specific component:
```jsx
<div className="glass-card opacity-80">Stronger glass</div>
```

---

## 10. Browser Support

- ✅ Chrome/Edge 76+
- ✅ Firefox 103+
- ✅ Safari 9+
- Includes `-webkit-backdrop-filter` for broader compatibility

---

## Quick Reference

| Use Case | Component | Class | Color |
|----------|-----------|-------|-------|
| Main content area | Card | `.glass-card` | `surface-container` |
| Modal dialog | Modal | `.glass-card` | `surface-container` |
| Primary action | Button | `variant="primary"` | Gradient: primary → primary-container |
| Sidebar nav | Sidebar | `.glass-card` | `surface-container` |
| Status indicator | Badge | `<Badge label="paid" />` | Based on status |
| Success metric | StatCard | `<StatCard />` | `primary` accent |
| Empty list | EmptyState | `.glass-card` | `surface-container` |

---

**Built for:** High-end, editorial SaaS experiences with atmospheric depth and premium feel.
**Version:** 1.0  
**Last Updated:** April 14, 2026
