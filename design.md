# Shelfcast Design System

> AI analytics platform for retail inventory intelligence. Ranked #1 in Ghana.

---

## Brand Identity

**Shelfcast** helps retailers stock the right products, eliminate dead inventory, and never lose a sale to an empty shelf. The visual language reflects precision, growth, and market intelligence — rooted in a deep green palette with sharp golden accents.

---

## Color Palette

| Token | Hex | Usage |
|---|---|---|
| `--color-primary` | `#E8A205` | Buttons, highlights, active states, accent text |
| `--color-primary-dark` | `#C88A00` | Button hover states |
| `--color-bg-dark` | `#0A1F0A` | Hero section background (deep forest green) |
| `--color-bg-surface` | `#FFFFFF` | Card backgrounds, page body |
| `--color-border` | `#CDCDCD` | Default card borders |
| `--color-border-input` | `#C0C0C0` | Input field borders |
| `--color-warning-bg` | `#E7FFE2` | Warning / info card background |
| `--color-warning-border` | `#178A00` | Warning / info card border |
| `--color-text-dark` | `#0D1F0D` | Body text on light backgrounds |
| `--color-text-light` | `#FFFFFF` | Text on dark/hero backgrounds |
| `--color-text-muted` | `#666666` | Secondary / subtext |

### Usage in Context

- **Hero section**: Dark green background (`#0A1F0A`) with a geometric abstract image overlay. White body text, golden accent on keyword in headline.
- **CTA buttons**: Solid `#E8A205` background, dark text, `15px` border radius.
- **Cards**: White background, `#CDCDCD` border.
- **Warning/info callouts**: `#E7FFE2` background, `#178A00` dashed border.

---

## Typography

### Typefaces

| Role | Font | Weight | Notes |
|---|---|---|---|
| H1, H2 | ES Klarheit Plakat TRIAL | Extrabold | Display / hero headings only |
| H3 | Gilroy | Semibold | Section headings |
| Body / P | Gilroy | Regular | All paragraph text |
| Buttons | Gilroy | Regular | CTA labels |
| Inputs | Gilroy | Regular | Placeholder and input text |
| Warning Cards — Heading | ES Klarheit Plakat TRIAL | Extrabold | Inside callout cards |
| Warning Cards — Body | Gilroy | Regular | Inside callout cards |

### Type Scale (recommended)

```css
h1, h2 {
  font-family: 'ES Klarheit Plakat TRIAL', sans-serif;
  font-weight: 800;
  /* Hero: ~56–72px; Section H2: ~40–48px */
}

h3 {
  font-family: 'Gilroy', sans-serif;
  font-weight: 600;
  /* ~24–32px */
}

p, li, label, input {
  font-family: 'Gilroy', sans-serif;
  font-weight: 400;
  /* ~14–18px */
}
```

### Homepage Example

The hero headline splits across two lines with a keyword highlighted in `#E8A205`:

```
Stock the **right** products   ← "right" in #E8A205
Leave the rest behind
```

Subheadline is Gilroy Regular, ~16–18px, white, at ~60% opacity on the dark background.

---

## Buttons

### Primary Button

| Property | Value |
|---|---|
| Background | `#E8A205` |
| Text color | `#0D1F0D` (near black) |
| Font | Gilroy Regular |
| Icon | Phosphor Icons (arrow / chevron right) |
| Border radius | `2px`, `5px`, `10px`, `15px` — use `10px` as default |
| Padding | `12px 24px` (recommended) |
| Hover | Darken to `#C88A00`, slight scale or shadow |

```css
.btn-primary {
  background: #E8A205;
  color: #0D1F0D;
  font-family: 'Gilroy', sans-serif;
  font-weight: 400;
  border-radius: 10px;
  padding: 12px 24px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border: none;
  cursor: pointer;
  transition: background 0.2s ease;
}

.btn-primary:hover {
  background: #C88A00;
}
```

**Examples in use**: "Book a demo" (navbar), "Get started" (hero), "Start Free Trial" (pricing card).

---

## Input Fields

| Property | Value |
|---|---|
| Font | Gilroy Regular |
| Border color | `#C0C0C0` |
| Border weight | `7px` (bottom border / underline style) |
| Background | White / transparent |
| Placeholder color | `#999999` |

The input style uses a thick **bottom-border only** (underline input), not a full box border — giving a clean, editorial feel.

```css
.input-field {
  font-family: 'Gilroy', sans-serif;
  font-weight: 400;
  border: none;
  border-bottom: 7px solid #C0C0C0;
  background: transparent;
  padding: 8px 4px;
  outline: none;
  width: 100%;
}
```

---

## Cards

### Default Card

| Property | Value |
|---|---|
| Background | `#FFFFFF` |
| Border color | `#CDCDCD` |
| Border radius | `10px` (recommended) |
| Shadow | Subtle: `0 2px 12px rgba(0,0,0,0.06)` |

Used for: pricing cards, feature cards, data summary panels.

```css
.card {
  background: #FFFFFF;
  border: 1px solid #CDCDCD;
  border-radius: 10px;
  padding: 24px;
}
```

### Warning / Info Card

Used to draw attention to important policy or status information (e.g. billing notices, alerts).

| Property | Value |
|---|---|
| Background | `#E7FFE2` |
| Border color | `#178A00` |
| Border style | Dashed (broken lines) |
| Border radius | `8px` |
| Heading font | ES Klarheit Plakat TRIAL Extrabold |
| Body font | Gilroy Regular |

```css
.card-warning {
  background: #E7FFE2;
  border: 1.5px dashed #178A00;
  border-radius: 8px;
  padding: 16px 20px;
}

.card-warning h4 {
  font-family: 'ES Klarheit Plakat TRIAL', sans-serif;
  font-weight: 800;
  color: #178A00;
  margin-bottom: 6px;
}

.card-warning p {
  font-family: 'Gilroy', sans-serif;
  font-weight: 400;
  color: #0D1F0D;
  font-size: 14px;
}
```

**Example text**: *"We would only charge if you approve — Note that no charges will be made to your account until you have approved for it to be done."*

---

## Icons

**Library**: [Phosphor Icons](https://phosphoricons.com/)

Used in: buttons (arrow right), feature lists (play/chevron), nav, and UI indicators.

- Arrow / chevron right → CTAs and "next" actions
- Play triangle → Active list items (e.g. rotating hero feature list)
- Use at `16–20px` for inline button icons, `20–24px` for standalone UI icons

---

## Navigation

### Navbar (Light / Scroll State)

- Background: `#FFFFFF`
- Logo: Shelfcast wordmark with green grid icon + yellow accent lines
- Nav links: Gilroy Regular, dark text
- Right side: "Log in" text link + "Book a demo" primary button
- Sticky on scroll, no shadow by default

### Navbar (Hero / Dark Background)

On the hero, the navbar sits on top of the dark green background — nav text renders in white.

---

## Hero Section

The homepage hero is the flagship section and sets the full visual identity.

### Structure

```
[Navbar]
[Full-width dark green background with abstract geometric overlay image]
  ├── Badge: "Ranked #1 AI analytics platform in Ghana"
  ├── H1 (2 lines): "Stock the right products / Leave the rest behind"
  ├── Subtext: benefit statement (Gilroy Regular, ~16px, white)
  ├── CTA: "Get started" button (#E8A205)
  └── Trust line: "Trusted by retailers, manufacturers, & importers"
[Right panel — rotating feature list]
  ├── Secure your margins
  ├── Stop losing customers
  ├── ▶ Stock up right  ← active state (white, bold, play icon)
  ├── Know the market
  └── Reduce stockouts
```

### Background Image

A deep dark green abstract image with layered geometric/diagonal forms and light streaks. Conveys structure, precision, and data architecture. Available as:
- **Landing Page Hero Background** — full bleed, high contrast
- **Other Pages Hero Background** — same palette, subtler treatment

### Color & Text on Hero

| Element | Style |
|---|---|
| Background | Dark green image, near-black overlay |
| H1 | ES Klarheit Plakat TRIAL Extrabold, white, ~64px |
| Keyword "right" | `#E8A205` accent |
| Subtext | Gilroy Regular, white ~70% opacity, ~16px |
| Badge | Light-bordered pill, white text, small Gilroy |
| CTA | `#E8A205` button, `10–15px` radius |

---

## Spacing & Layout

| Token | Value | Usage |
|---|---|---|
| `--radius-sm` | `2px` | Subtle rounding |
| `--radius-md` | `5px` | Tags, chips |
| `--radius-lg` | `10px` | Buttons (default), cards |
| `--radius-xl` | `15px` | Large cards, modals |
| Section padding | `80–120px` vertical | Page sections |
| Container max-width | `1280px` | Centered layout |
| Column gutter | `24–32px` | Grid gaps |

---

## Component Checklist

| Component | Status |
|---|---|
| Primary Button | ✅ Defined |
| Text Input (underline) | ✅ Defined |
| Default Card | ✅ Defined |
| Warning / Info Card | ✅ Defined |
| Navbar (light + dark) | ✅ Defined |
| Hero Section | ✅ Defined |
| Feature Rotating List | ✅ Referenced |
| Pricing Card | 🔲 To be designed |
| Form Fields (full) | 🔲 To be designed |
| Footer | 🔲 To be designed |
| Toast / Notification | 🔲 To be designed |

---

## Design Principles

1. **Precision over decoration** — every element earns its place
2. **Golden as a signal** — `#E8A205` is reserved for actions and key emphasis only; don't dilute it
3. **Green is the world** — the dark green is identity, not just background; it should feel like the brand has roots
4. **Typography does the heavy lifting** — ES Klarheit Plakat for impact, Gilroy for trust and readability
5. **Motion is purposeful** — the rotating hero list, hover states, and transitions should feel like a live system, not decoration

---

*Last updated: May 2026 — Shelfcast v1 Design System*
