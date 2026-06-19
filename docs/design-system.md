# 🎨 bayluv Design System — "Playful & Warm"

bayluv's visual language is **warm, friendly, and a little playful** — the feeling of a cozy coffee
shop, not a corporate SaaS dashboard. Cream paper backgrounds, a confident coral accent, soft candy
colors for variety, generous rounding, and a rounded display typeface give the product personality
while staying clean and legible.

Everything is **token-driven**. Tokens live in [`app/app.css`](../app/app.css) inside Tailwind v4's
`@theme` block, which turns each CSS variable into a utility class (e.g. `--color-primary` →
`bg-primary`, `text-primary`). Components compose those utilities via the `cn()` helper
([`app/lib/utils.ts`](../app/lib/utils.ts)). Browse everything live at **`/dev/styleguide`**.

---

## Color

### Surfaces
| Token | Value | Use |
|---|---|---|
| `cream` | `#fdf6ee` | Page background (warm paper) |
| `paper` | `#fffaf4` | Slightly lifted sections / sidebars |
| `surface` | `#ffffff` | Cards |
| `border` | `#efe4d6` | Hairline borders |
| `border-strong` | `#e3d4c1` | Hover / emphasized borders |

### Ink (text)
| Token | Value | Use |
|---|---|---|
| `ink` | `#2a2018` | Headings & body (warm near-black) |
| `ink-soft` | `#5b4f44` | Secondary text |
| `muted` | `#8a7d70` | Tertiary text & placeholders |

### Primary — friendly coral
A full ramp `primary-50 … primary-700`, with `--color-primary` (`#ff5c39`) as the base and
`primary-foreground` (`#ffffff`) for text on top. Used for the main CTA, links, and focus rings.

### Candy accents
Each is a saturated color + a soft tint, used for tier cards, badges, and illustration:
`mint` / `mint-soft`, `sky` / `sky-soft`, `grape` / `grape-soft`, `sunny` / `sunny-soft`.

### Status
`success` (+`success-soft`) for goal bars & confirmations, `danger` (+`danger-soft`) for destructive
actions and errors.

> **Per-page theming.** Creators pick an accent (`primary`/`mint`/`sky`/`grape`/`sunny`) for their
> public page. [`app/lib/theme.ts`](../app/lib/theme.ts) maps that choice to a set of utility classes
> (`bg`, `text`, `soft`, `ring`, `coverFrom`) so the page, support widget, tier cards, and product
> cards all re-skin consistently.

---

## Typography

Two Google fonts, loaded in [`app/root.tsx`](../app/root.tsx):

- **Inter** (`--font-sans`) — body text, UI, forms. Tuned with stylistic sets for a friendly feel.
- **Baloo 2** (`--font-display`) — a rounded display face for headings and the wordmark. Applied
  automatically to `h1–h4` via the base layer.

Use `font-display` for big, expressive headings; everything else inherits Inter.

---

## Shape, depth & motion

- **Radii** — generous: `--radius-xl` (1rem), `--radius-2xl` (1.25rem), `--radius-3xl` (1.75rem).
  Buttons are fully rounded pills; cards use `rounded-3xl`.
- **Shadows** — soft and warm, tinted toward the ink/coral rather than neutral gray:
  `--shadow-soft`, `--shadow-card`, and `--shadow-pop` (a coral glow for primary hovers).
- **Tactile buttons** — solid buttons sit on a darker color "lip" (a bottom `box-shadow`) so they
  feel like physical, pressable candy. They **lift** on hover (`-translate-y-0.5`, bigger lip) and
  **squish** on tap (`active:scale-[0.96]`).
- **Warm inputs** — fields use a soft cream (`bg-paper`) fill that turns white on focus with a
  friendly coral **glow** (`box-shadow: 0 0 0 4px primary-100`) instead of a hard outline.
- **Motion** — purposeful, not flashy: cards lift on hover, feature icons rotate slightly, decorative
  landing cards **bob** (`animate-float`), the hero sparkle wiggles, toasts/dialogs `fadeIn`/`slideUp`.
  All motion respects `prefers-reduced-motion`.
- **Focus** — a consistent `outline: 3px solid primary` with offset, applied globally in the base
  layer. (Outline, not a ring, so it never conflicts with the button lip / input glow box-shadows.)

---

## Component primitives

All primitives live in [`app/components/ui/`](../app/components/ui/) and re-export from
`~/components/ui`. They're lightweight (no heavy UI dependency) and styled with the tokens above.

| Component | Notes |
|---|---|
| `Button` / `ButtonLink` | Chunky, tactile pills with a color lip, hover-lift, and tap-squish. Variants: `primary`, `secondary`, `outline`, `ghost`, `soft`, `danger`. Sizes: `sm`, `md`, `lg`, `icon`. `ButtonLink` is the same styling on a router `<Link>`. |
| `Input` / `Textarea` | Shared `inputBase`; rounded-2xl, warm cream fill, coral glow on focus. |
| `Label` / `Field` | `Field` wraps a label + control + hint/error text. |
| `Card` (+ `Header`/`Title`/`Content`/`Footer`) | The workhorse container. |
| `Avatar` | Image or initials fallback; sizes `sm`–`xl`. |
| `Badge` | Tones map to the candy + status palette. |
| `Progress` | The goal bar (success green, clamped 0–100). |
| `Tabs` | Context-driven, controlled or uncontrolled — used for About/Membership/Shop. |
| `Dialog` | Lightweight modal: Escape + backdrop close, scroll lock. |
| `DropdownMenu` | Outside-click / Escape close. |
| `Toast` | `ToastProvider` (mounted in `root.tsx`) + `useToast()`; `success`/`error`/`info` tones. |

### Conventions

- **Compose, don't fork.** Build new UI from these primitives + Tailwind utilities. Reach for
  `cn()` to merge conditional classes (it de-duplicates conflicting Tailwind utilities via
  `tailwind-merge`).
- **Tokens over hex.** Use semantic classes (`bg-surface`, `text-ink-soft`, `border-border`) so a
  future palette tweak is a one-file change.
- **Icons** come from `lucide-react`; brand/social marks are inline SVGs in
  [`app/components/profile/brand-icons.tsx`](../app/components/profile/brand-icons.tsx) (lucide
  dropped brand glyphs in v1).
- **Rounded + soft.** New surfaces should feel consistent: rounded corners, soft shadows, warm
  borders, and breathing room.

---

## Quick reference

```tsx
import { Button, Card, CardContent, Field, Input, Badge, useToast } from "~/components/ui";
import { cn, formatMoney } from "~/lib/utils";

<Card>
  <CardContent className="space-y-4">
    <Badge tone="mint">New</Badge>
    <Field label="Amount" hint="In USD">
      <Input type="number" />
    </Field>
    <Button className="w-full">Support {formatMoney(500)}</Button>
  </CardContent>
</Card>
```
