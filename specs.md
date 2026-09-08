# CargoFlow — Project Specification

> **Share the Road. Share the Cost.**
> A browser-based cargo-sharing platform for the Philippines that matches partial
> shipments with unused truck capacity.

- **Course:** MO-IT161 — Web Systems and Technology
- **Program:** BS Information Technology · **Section:** A3101
- **Institution:** Mapúa Malayan Digital College (MMDC)
- **Term:** Term 1, SY 2026–2027
- **Repository:** `Web-Systems-and-Technology-CargoFlow`

This branch (`specs`) holds only this document. The implementation lives on the
other branches (`vanilla-js` is the current framework-free build).

---

## 1. Problem Statement

Shipping in the Philippines is expensive for small businesses that cannot fill an
entire truck. At the same time, carriers regularly run routes with **unused cargo
space**. There is no easy, local, low-friction way to connect the two.

## 2. Solution Overview

Instead of booking a whole truck, CargoFlow **fills unused cargo space** by
matching multiple compatible shipments traveling the same route. Matching is based
on:

| Factor              | Meaning                                            |
| ------------------- | ------------------------------------------------- |
| **Route**           | Shipments headed the same direction               |
| **Cargo size**      | Fits the space still available on the vehicle     |
| **Vehicle capacity**| Matched to the carrier's truck                    |
| **Delivery schedule**| Aligned pickup and drop-off windows             |

## 3. Goals

- Let a shipper describe a shipment (origin, destination, weight) and see carriers
  going the same way.
- Let shippers reserve only the space they need and share the cost of the trip.
- Help carriers monetise empty capacity on trips they are already making.
- Work on any modern browser with no install, no build step, and no backend.

### Non-Goals (this prototype)

- Real accounts, authentication, or user profiles.
- Live carrier inventory, real pricing, or payment processing.
- Real-time GPS tracking or push notifications.
- Native mobile apps.

---

## 4. Target Users

| User                    | Need                                                     |
| ----------------------- | ------------------------------------------------------- |
| **SMEs**                | Move partial-load shipments affordably                  |
| **Online sellers**      | Ship e-commerce orders to customers                     |
| **Manufacturers**       | Move goods between locations                            |
| **Independent shippers**| Occasional, one-off cargo needs                         |
| **Local carriers**      | Earn more by filling empty truck space                  |

---

## 5. Scope & Status

| Area                  | Planned                                              | Prototype status |
| --------------------- | -------------------------------------------------- | ---------------- |
| Route/quick search    | Filter demo routes by origin, destination, weight  | **Implemented** (browser-only, mock data) |
| Responsive marketing site | Home, how-it-works, why-CargoFlow, CTA         | **Implemented** |
| Mobile navigation     | Accessible hamburger menu                          | **Implemented** |
| Find Matches page     | Browse shipments/carriers by route, size, schedule | Planned |
| Book Cargo Space      | Reserve space, view shared-cost breakdown          | Planned |
| Track Shipment        | Status timeline from pickup to delivery            | Planned |
| Messages              | Direct chat with carriers                          | Planned |
| Accounts / backend / payments | —                                         | Out of scope |

---

## 6. Feature Specification

### 6.1 Quick Search (implemented)

**Purpose:** From the Home page, find carrier routes that can carry a shipment.

**Inputs**

| Field       | Control              | Rules                                                        |
| ----------- | -------------------- | ---------------------------------------------------------- |
| Pickup      | `<select>`           | One of the known cities, or "Any origin" (empty)            |
| Drop-off    | `<select>`           | One of the known cities, or "Any destination" (empty)       |
| Cargo weight| `<number>` (kg)      | Optional. `min=1`, `max=50000`, integer step. Empty = no minimum |

**Known cities:** Manila, Batangas, Baguio, Cebu, Davao, Pampanga.

**Behaviour**

- **Submit** runs the filter and renders a result list with a count heading
  ("N matching routes") and a disclaimer that listings and prices are illustrative.
- **Validation:** if pickup and drop-off are the same non-empty city, show
  "Choose a destination different from your pickup location." and do not search.
- **Swap** button exchanges the pickup and drop-off values.
- **Popular routes** chips (Manila→Batangas, Manila→Baguio, Cebu→Davao) set both
  selects, clear the weight, and run the search immediately.
- **Empty result:** show an empty state ("No shared routes found just yet.") with
  guidance to try another destination or a smaller weight.
- **Hide results** button clears and hides the result panel and scrolls back to
  the search heading.
- Results panel receives focus after each search for screen-reader users.

**Matching rule (`findRoutes`)**

A route matches when **all** of the following hold:

1. `from` is empty **or** equals the route's origin.
2. `to` is empty **or** equals the route's destination.
3. The route's `capacity` is **≥** the requested weight (weight `0`/empty ⇒ always true).

Invalid weight (negative or non-numeric) returns **no results**.
Direction is significant: Manila→Batangas and Batangas→Manila are different routes.

**Result card fields:** origin → destination, carrier name, vehicle type,
available space (kg), schedule, estimated transit time, and a "Starting at ₱N per
shipment" price. Every card is labelled **DEMO ROUTE**.

### 6.2 Marketing / informational sections (implemented)

- **Hero** — tagline, primary CTA to search, secondary CTA to "How it works",
  branded truck illustration.
- **Benefit strip** — pay for the space you need; fewer empty trucks; local
  connections.
- **How it works** — three steps: *Find your match → Share the space → Move together*.
- **Why CargoFlow** — value propositions (share the ride not the full cost; turn
  empty space into opportunity; keep local businesses moving).
- **CTA section** — closing call to action into the search.
- **Footer** — brand, navigation anchors, dynamic copyright year.

### 6.3 Planned pages (not implemented)

1. **Home** — overview + quick search *(implemented)*
2. **Find Matches** — full listing filtered by route, size, and schedule
3. **Book Cargo Space** — reserve space, shared-cost breakdown
4. **Track Shipment** — status and timeline
5. **Messages** — direct carrier chat

---

## 7. Data Model (prototype mock data)

All data is hard-coded in `search.js`; there is no persistence.

### Route

| Field      | Type    | Example                 |
| ---------- | ------- | ----------------------- |
| `id`       | number  | `1`                     |
| `from`     | string  | `"Manila"`              |
| `to`       | string  | `"Batangas"`            |
| `carrier`  | string  | `"Southbound Logistics"`|
| `vehicle`  | string  | `"Closed van"`          |
| `capacity` | number  | `800` (kg)              |
| `price`    | number  | `850` (₱, starting rate)|
| `duration` | string  | `"2–3 hours"`           |
| `schedule` | string  | `"Weekdays"`            |

**Seed routes:** Manila→Batangas, Manila→Baguio, Cebu→Davao, Manila→Pampanga,
Batangas→Manila (5 total).

---

## 8. Technical Specification

| Concern        | Decision                                                          |
| -------------- | --------------------------------------------------------------- |
| Markup         | Single `index.html`, semantic HTML5, section-anchor navigation    |
| Styling        | One `styles.css`; CSS custom properties; responsive via fl/grid + media queries |
| Behaviour      | Vanilla ES6+ in `app.js` + `search.js`; **no framework, no bundler** |
| Script loading | Classic scripts with `defer`; `search.js` before `app.js`; must also work from `file://` |
| Icons          | Inline SVG generated in JS from a path table (no icon font/library) |
| Assets         | `cargo-journey.svg` (original artwork), `favicon.svg` — all local |
| Fonts          | DM Sans + Manrope via Google Fonts; system sans-serif fallback offline |
| Backend / API  | None. No API keys. All logic runs client-side                     |
| Hosting        | Any static file server, or open `index.html` directly             |
| Version control| Git + GitHub                                                     |

### File structure (implementation branches)

```
index.html          # All markup
styles.css          # Brand styles and responsive layout
app.js              # Icon rendering, mobile nav, search UI
search.js           # Mock route data + findRoutes() filter
tests.html          # Browser test runner page
search.test.js      # Route-search assertions
cargo-journey.svg   # Branded truck illustration
favicon.svg         # Site icon
```

---

## 9. Non-Functional Requirements

- **Responsive:** usable from ~320px mobile up to desktop; no horizontal scroll.
- **Accessibility:** skip link; ARIA labels/roles on nav, form, and results;
  `aria-expanded` on the menu toggle; Escape closes the mobile menu and restores
  focus; results container is focusable and focused after each search;
  keyboard-operable controls.
- **Offline-tolerant:** page and all artwork work without network; only web fonts
  degrade to system fonts.
- **Security:** user-supplied strings are HTML-escaped before being inserted into
  result markup (`escapeHtml`).
- **Performance:** no build, minimal JS, hero image marked `fetchpriority="high"`.
- **Compatibility:** current Chrome, Firefox, Safari, and Edge.

---

## 10. Testing

- **Runner:** open `tests.html` in a browser — prints a pass/fail list on the page
  and logs a summary to the console. No Node required.
- **Coverage (`search.test.js`):**
  - empty search returns all demo routes
  - direction-sensitive matching (Manila→Batangas vs Batangas→Manila)
  - capacity filtering (`capacity >= weight`)
  - no matches for unavailable routes or invalid weight (`-1`, non-numeric)
- Optional tooling on the implementation branch: ESLint, Prettier, Vitest, and a
  pinned Node version for contributors who want a CLI workflow.

---

## 11. Brand

From the supplied CargoFlow brand board:

| Token        | Value      |
| ------------ | ---------- |
| Deep blue    | `#0B3D91`  |
| Sky blue     | `#3882F6`  |
| Flow orange  | `#FF7A00`  |
| Sand         | `#F4F1EA`  |
| Charcoal     | `#1F2937`  |

Typography: **Manrope** (display) + **DM Sans** (body). The logo is an SVG
recreation inspired by the reference board; the truck illustration is original
local artwork, not an extracted board image.

---

## 12. Future Work

- Build the Find Matches, Book Cargo Space, Track Shipment, and Messages pages.
- Replace mock data with a real carrier/route source.
- Shared-cost calculator (split a trip's price across booked shipments by space).
- Accounts, saved searches, and booking history.
- Real scheduling and pickup/drop-off time windows in the matcher.

---

## 13. Team

| Name                  |
| --------------------- |
| Armielyn Obinguar     |
| Chantal Louise Flor   |
| Mitzi Reese Arrogante |
| Ryan Keneth Tavera    |
