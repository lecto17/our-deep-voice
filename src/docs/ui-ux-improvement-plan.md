# UI/UX Improvement Plan for Our Deep Voice

This document outlines a plan to elevate the visual design and user experience of "Our Deep Voice" to a premium, aesthetic standard.

## 1. Design System & Design Tokens

Establish a consistent design language to ensure harmony across the application.

### 🎨 Color Palette (Semantic)

Move away from raw Tailwind colors (e.g., `bg-gray-100`) to semantic design tokens.

- **Primary**: Brand color for main actions (e.g., "Create Channel", "Post"). Suggest a soft but confident color (e.g., Deep Indigo or Warm Coral) instead of generic blue.
- **Surface**:
  - `bg-surface-page`: Slightly off-white/warm-gray for lesser eye strain (`#F9FAFB` or `#FDFDFD`).
  - `bg-surface-card`: Pure white with subtle borders/shadows for content.
- **Text**:
  - `text-primary`: High contrast, almost black (`#1F2937`).
  - `text-secondary`: Medium contrast for metadata (`#6B7280`).
  - `text-tertiary`: Low contrast for placeholders (`#9CA3AF`).

### 🔠 Typography

- **Font**: Use **Pretendard** (or _Inter_) for clean, modern readability, especially if Korean text is primary.
- **Hierarchy**:
  - **H1/H2**: Bold, tight tracking for headings.
  - **Body**: Relaxed line-height (1.6) for readability in posts.

### ✨ Visual Style

- **Radius**: Use `rounded-2xl` or `rounded-3xl` for a friendlier, modern feel (Glassmorphism influence).
- **Shadows**: Soft, diffused shadows (`shadow-lg` with lower opacity) rather than harsh outlines.
- **Micro-interactions**:
  - Hover effects: `scale-105`, `brightness-110` smoothly.
  - Active states: `scale-95` on clicks.

---

## 2. Screen-Specific Improvements

### 🏠 Channel Home (`/channels`)

**Current:** Simple list.
**Improvement:**

- **Hero Section**: Add a welcoming header "Where would you like to dive in today?" with a subtle gradient background.
- **Channel Cards**:
  - Convert plain list items to **Grid Cards**.
  - Show channel stats (members, recent activity) with icons.
  - **Active State**: Visual indicator for "Currently Active" channel.
- **Create Button**: Floating Action Button (FAB) or a prominent card at the start of the grid.

### 📜 Post Feed (`/channels/[id]`)

**Current:** Vertically stacked standard cards.
**Improvement:**

- **Background**: Apply a subtle noise texture or gradient mesh to the `bg-gray-100` area to remove the "default web" feel.
- **Empty State**: Replace text-only empty state with a **vector illustration** or a cute mascot saying "No voices here yet... be the first!".
- **Loading**: Use **Skeleton Loaders** (shimmer effect) instead of a simple spinner for a perceived faster load time.

### 📝 Post Card (`PostCard.tsx`)

**Current:** Functional.
**Improvement:**

- **Header**: Increase avatar size slightly. Add specific date formatting (e.g., "Just now", "2 hrs ago").
- **Content**:
  - Typography: Increase font size for short posts (emphasis).
  - spacing: More breathing room (`p-6` instead of `p-5`).
- **Actions (Comments/Reactions)**:
  - distinct "Action Bar" at the bottom with lighter background or separator.
  - Animated reaction icons (bounce on click).

---

## 3. Implementation Steps

### Phase 1: Foundation

- [x] Install **Pretendard** variable font.
- [x] Configure `tailwind.config.ts` with new color extension (e.g., `colors: { brand: ... }`).
- [x] Create `globals.css` variables for theme abstraction (Light/Dark mode readiness).

### Phase 2: Component Refactor

- [x] Refactor `PostCard` to use new tokens.
- [x] Update `PostList` layout.
- [x] Redesign `ChannelList` into a Grid view.

### Phase 3: Polish

- [x] Add `framer-motion` for transitions (entering feed, opening modals).
- [x] Add toast animations.

---

## 4. Code Example: Design Tokens (Tailwind)

```typescript
// tailwind.config.ts
export default {
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f9ff',
          500: '#0ea5e9', // Replace with chosen brand color
          600: '#0284c7',
        },
        surface: {
          DEFAULT: '#ffffff',
          subtle: '#f3f4f6',
        },
      },
      borderRadius: {
        '3xl': '1.5rem',
      },
      fontFamily: {
        sans: ['var(--font-pretendard)', 'sans-serif'],
      },
    },
  },
};
```
