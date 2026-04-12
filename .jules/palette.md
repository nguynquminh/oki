## 2026-04-09 - ARIA labels on icon-only buttons
**Learning:** Found that some icon-only interactive components (`Navbar.jsx`, `GlassModal.jsx`) in this application were missing ARIA labels, a common pattern that makes navigation difficult for screen reader users.
**Action:** When adding new icon-only buttons, specifically check for `aria-label` attributes to ensure keyboard and screen reader accessibility are maintained.
## 2025-02-20 - Adding ARIA attributes and Focus Indicators to Custom Clear Buttons
**Learning:** Icon-only interactive elements like custom "clear search" buttons need explicitly defined `aria-label`s to communicate their purpose to screen reader users, and strong focus indicators (`focus-visible:ring-2`) so keyboard navigators can track their position. Hiding decorative icons with `aria-hidden="true"` reduces noise for screen reader users.
**Action:** When creating custom inputs or overriding default browser UI (like search clear buttons), proactively add `aria-label`, `focus-visible` styles, and hide decorative nested SVGs from screen readers using `aria-hidden`.
## YYYY-MM-DD - [Title]
**Learning:** [UX/a11y insight]
**Action:** [How to apply next time]
## 2026-04-12 - Proper Screen Reader Support for Custom React Modals
**Learning:** Custom modal dialogs (like `GlassModal.jsx`) are invisible to screen readers without explicit ARIA attributes. A `<div>` masquerading as a modal needs `role="dialog"`, `aria-modal="true"`, and must link its title via `aria-labelledby` pointing to the title element's `id`.
**Action:** When building or maintaining custom modals, always implement the required ARIA dialog pattern (`role="dialog"`, `aria-modal="true"`, `aria-labelledby`) so assistive technologies recognize when focus is trapped and can accurately announce the dialog's purpose.
