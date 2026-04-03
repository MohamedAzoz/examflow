# Design System Specification: Editorial Academic Dashboard

## 1. Overview & Creative North Star
**The Creative North Star: "The Academic Atelier"**
This design system moves away from the sterile, modular grid typical of educational software, moving instead toward a high-end editorial experience. It treats the student's journey as a curated workspace—clean, intentional, and intellectually stimulating. We break the "template" look through a philosophy of **Atmospheric Depth**: using subtle tonal shifts and generous negative space rather than rigid borders to define zones of focus. The result is a dashboard that feels less like a database and more like a premium, focused environment for academic achievement.

---

## 2. Colors & Tonal Architecture
The palette is rooted in deep teals and aquatic blues, balanced by a sophisticated range of "cool stone" neutrals.

### The "No-Line" Rule
To maintain a high-end feel, **1px solid borders are prohibited** for sectioning content. Visual boundaries must be achieved through:
- **Background Contrast:** Use `surface-container-low` for large sections sitting on a `background` base.
- **Tonal Shifts:** Define content areas by nesting a `surface-container-lowest` card inside a `surface-container` section.

### Color Tokens
- **Primary (The Authority):** `#13626c` (Primary) & `#357B85` (Primary Container). Used for critical actions and core branding.
- **Secondary (The Clarity):** `#006a62` (Secondary) & `#62CEC2` (Secondary Fixed Dim). Used for accenting and progress indicators.
- **Tertiary (The Accent):** `#814c28` (Tertiary). Reserved for warm highlights or alerts to provide a humanistic break from the cool palette.
- **Surface Palette:** Utilizing the full range from `surface-container-lowest` (#FFFFFF) for cards to `surface-dim` (#D5DBE1) for subtle background recessions.

### Signature Textures
- **The Gradient Soul:** For primary CTAs and hero headers, use a subtle linear gradient (135°) transitioning from `primary` to `primary-container`. This adds a "soul" to the UI that flat color cannot replicate.
- **Glassmorphism:** For floating overlays or sidebars, utilize `surface` colors at 85% opacity with a `24px` backdrop-blur to create an integrated, modern depth.

---

## 3. Typography: Editorial Authority
We utilize a dual-font strategy to balance character with readability.

- **Display & Headlines (Manrope):** This geometric sans-serif provides a modern, authoritative voice. Use `headline-lg` (2rem) for page titles like "Student Dashboard" to command attention.
- **Body & Labels (Inter):** The industry standard for legibility. Used for all functional data.
- **Visual Hierarchy:**
    - **Display-SM/MD:** Used for hero stats or large numerical data.
    - **Title-LG:** Used for card headings.
    - **Label-MD:** Used for sidebar navigation and metadata, often with increased letter-spacing (0.05em) for a premium feel.

---

## 4. Elevation & Depth: The Layering Principle
Depth is not an afterthought; it is our primary structural tool.

- **Tonal Stacking:** Instead of shadows, stack surfaces. A `surface-container-lowest` card placed on a `surface-container-low` background provides a "soft lift" that feels natural and architectural.
- **Ambient Shadows:** When a card requires a floating state (e.g., on hover), use a highly diffused shadow: `0px 12px 32px rgba(22, 28, 33, 0.06)`. The shadow color should be a tinted version of `on-surface`, never pure black.
- **The Ghost Border:** If a boundary is strictly required for accessibility, use `outline-variant` at **15% opacity**. This creates a "suggestion" of a border rather than a hard line.

---

## 5. Components

### Sidebar Navigation
- **Architecture:** A wide, breathable column using `surface-container-low`.
- **Active State:** Use a "Pill" container with `primary-container` background and `on-primary-container` text. 
- **Typography:** `label-md` with semi-bold weight. Icons should be optical-sized to 20px.

### Cards (The "Atelier" Card)
- **Styling:** `0.75rem (md)` or `1rem (lg)` corner radius. 
- **Background:** Always `surface-container-lowest`.
- **Header:** Title should be `title-sm` or `title-md` using Manrope to maintain the editorial feel.
- **Constraint:** No internal dividers. Use `1.5rem (xl)` of vertical padding to separate sections.

### Buttons
- **Primary:** High-contrast `primary` fill with `on-primary` text. Use `full` roundedness (capsule) for a modern, friendly touch.
- **Secondary:** `surface-container-highest` fill with `primary` text. No border.
- **Tertiary/Ghost:** No fill. `primary` text. Used for low-emphasis actions.

### Inputs & Fields
- **Surface:** `surface-container-high`.
- **States:** On focus, transition the background to `surface-container-lowest` and apply a `2px` "Ghost Border" of `primary` at 40% opacity.

---

## 6. Do's and Don'ts

### Do
- **Do** use whitespace as a functional element to group related content.
- **Do** utilize the `secondary` (#62CEC2) for success states and progress bars to keep the UI feeling "fresh."
- **Do** apply `backdrop-filter: blur(20px)` to any element that overlaps background content.

### Don't
- **Don't** use 100% black text; always use `on-surface` (#161C21) for better optical comfort.
- **Don't** use high-contrast borders (e.g., solid grey) to separate cards; use background shifts.
- **Don't** use standard "drop shadows" (small blur, high opacity). They break the sophisticated atmosphere of the system.
- **Don't** cram content. If a section feels tight, increase the `surface-container` padding before reducing font size.