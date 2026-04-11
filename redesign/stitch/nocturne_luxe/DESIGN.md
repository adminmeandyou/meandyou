# Design System Document: The Midnight Editorial

## 1. Overview & Creative North Star
**The Creative North Star: "The Noir Curator"**
This design system moves away from the utilitarian, "swipe-heavy" aesthetics of mainstream dating apps. Instead, it adopts the persona of a high-end digital concierge. We are not building a database; we are curating an atmosphere. 

To achieve this, the system breaks the "template" look through **intentional asymmetry**, high-contrast editorial typography, and a "depth-first" philosophy. Expect overlapping elements, large serif displays that bleed off-canvas, and a color palette that prioritizes the space between elements as much as the elements themselves. We don't just show profiles; we present portraits.

---

## 2. Colors & Surface Philosophy

### The Palette
- **Main Background (`surface`):** `#08090E` – The void. A deep, ink-black foundation.
- **Primary Surface (`surface-container-low`):** `#0F1117` – Subtle lift for secondary sections.
- **Secondary Surface (`surface-container`):** `#13161F` – For high-level interaction nodes.
- **Accent Red (`primary-container`):** `#E11D48` – Passion, urgency, and high-value actions.
- **Gold (`secondary-container`):** `#F59E0B` – Reserved strictly for VIP, legacy, and premium status.

### The "No-Line" Rule
Sectioning must never be achieved with 1px solid borders. Boundaries are defined solely through background tonal shifts. To separate a profile bio from the image gallery, use a transition from `surface` to `surface-container-low`. Standard lines feel "web-like"; tonal shifts feel "architectural."

### Surface Hierarchy & Nesting
Treat the UI as a series of stacked sheets of obsidian and smoked glass. 
- **The Base:** `surface` (#08090E)
- **Nested Content:** Place a `surface-container-highest` card within a `surface-container-low` section to create natural focus without shadows.

### The Glass & Gradient Rule
For floating elements (modals, navigation bars), use **Glassmorphism**:
- `background: rgba(15, 17, 23, 0.7)`
- `backdrop-filter: blur(12px)`
- This ensures the "Dark Romantic" vibe remains fluid and integrated, rather than blocky.

---

## 3. Typography
The tension between the classic serif and the modern sans-serif creates the "Premium" feel.

- **Display & Headlines (Fraunces):** These are your "Editorial" voices. Use `display-lg` (3.5rem) for hero statements with tight letter-spacing. Fraunces should feel heavy, authoritative, and romantic.
- **Body & UI (Plus Jakarta Sans):** Your "Functional" voice. Use for all data-heavy points. 
- **Visual Hierarchy:** Large Fraunces titles should often be paired with a `label-sm` in `tertiary-text` (uppercase, tracked out +10%) to create a high-fashion magazine layout feel.

---

## 4. Elevation & Depth

### The Layering Principle
Depth is achieved by stacking. Use `surface-container-lowest` for background-level utility and `surface-bright` for interaction triggers.

### Ambient Shadows
Shadows must be "unseen." Use the following for floating cards:
- `box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.05);`
The shadow should feel like a soft glow of darkness rather than a harsh drop-shadow.

### The "Ghost Border" Fallback
Where containment is legally or functionally required, use a **Ghost Border**:
- `border: 1px solid rgba(255, 255, 255, 0.04)`
This provides just enough contrast for the eye to find the edge without interrupting the visual flow of the dark background.

---

## 5. Components

### Buttons
- **Primary Action:** Use the **Button Gradient** (`135deg, #E11D48 to #be123c`). Border-radius: `full`. Text must be white. Use a subtle `0 4px 15px rgba(225, 29, 72, 0.3)` shadow to make it "pop" against the dark background.
- **Secondary Action:** Ghost style. `border: 1px solid rgba(255, 255, 255, 0.1)`. No fill.
- **VIP Action:** Use the **Gold Gradient**. Reserved for "Send a Rose" or "Premium Match" functions.

### Input Fields
- **Styling:** No background. Only a bottom border of `Soft Border` (rgba 255, 255, 255, 0.04). 
- **Focus State:** Transition the bottom border to `Accent Red` and add a very soft red outer glow. 
- **Labels:** `label-sm` in `secondary-text`, floating above the input.

### Cards & Profiles
- **Rule:** Forbid divider lines. Use vertical white space (32px or 48px) to separate the name/age from the bio.
- **Images:** Use a `0.5rem` (DEFAULT) corner radius. To lean into the "Romantic" theme, images should have a subtle dark vignette overlay on the bottom 30% to ensure text legibility.

### Selection Chips
- **Inactive:** `surface-container-high` background, no border.
- **Active:** `primary-container` (Accent Red) background with white text.

---

## 6. Do’s and Don’ts

### Do
- **Use White Space as a Luxury:** Premium brands aren't afraid of "empty" space. Let the dark background breathe.
- **Embrace Asymmetry:** Align a headline to the left, but place the CTA on the far right of the next row.
- **Use High-End Transitions:** Elements should "fade and slide" (Ease-out-expo), never just appear.

### Don’t
- **Don’t use "Pure" White:** Except for text on buttons. For body text, use `primary-text` (#F8F9FA) to prevent eye strain.
- **Don’t use Dividers:** If you feel the need to add a line, try adding 16px of extra padding instead.
- **Don’t use Standard Icons:** Use thin-stroke (1px or 1.5px) icons. Avoid filled, heavy, or "bubbly" icon sets.
- **Don’t Overuse Gold:** If everything is Gold, nothing is Premium. Save it for the 1% of the user experience.

---

## 7. Signature Textures
To add "soul" to the dark interface, use a **Grain Overlay**:
- Apply a fixed `opacity: 0.02` noise texture over the entire `surface`. This breaks the digital perfection and gives the app a filmic, cinematic quality suitable for a "Dark Romantic" aesthetic.