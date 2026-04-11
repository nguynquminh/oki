## 2026-04-09 - ARIA labels on icon-only buttons
**Learning:** Found that some icon-only interactive components (`Navbar.jsx`, `GlassModal.jsx`) in this application were missing ARIA labels, a common pattern that makes navigation difficult for screen reader users.
**Action:** When adding new icon-only buttons, specifically check for `aria-label` attributes to ensure keyboard and screen reader accessibility are maintained.
## 2025-02-20 - Adding ARIA attributes and Focus Indicators to Custom Clear Buttons
**Learning:** Icon-only interactive elements like custom "clear search" buttons need explicitly defined `aria-label`s to communicate their purpose to screen reader users, and strong focus indicators (`focus-visible:ring-2`) so keyboard navigators can track their position. Hiding decorative icons with `aria-hidden="true"` reduces noise for screen reader users.
**Action:** When creating custom inputs or overriding default browser UI (like search clear buttons), proactively add `aria-label`, `focus-visible` styles, and hide decorative nested SVGs from screen readers using `aria-hidden`.
## YYYY-MM-DD - [Title]
**Learning:** [UX/a11y insight]
**Action:** [How to apply next time]
