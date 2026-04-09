## 2026-04-09 - ARIA labels on icon-only buttons
**Learning:** Found that some icon-only interactive components (`Navbar.jsx`, `GlassModal.jsx`) in this application were missing ARIA labels, a common pattern that makes navigation difficult for screen reader users.
**Action:** When adding new icon-only buttons, specifically check for `aria-label` attributes to ensure keyboard and screen reader accessibility are maintained.
