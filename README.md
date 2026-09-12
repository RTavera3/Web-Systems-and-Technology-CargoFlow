<div align="center">

# CargoFlow

### _Share the Road. Share the Cost._

**A browser-based cargo-sharing platform for the Philippines** — connecting SMEs, online sellers, manufacturers, independent shippers, and local carriers by matching partial shipments with unused truck capacity.

![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)

</div>

---

## About the Project

Shipping in the Philippines is expensive — especially for small businesses that can't fill an entire truck. Meanwhile, carriers often drive routes with **unused cargo space**.

**CargoFlow** solves both problems at once. Instead of simply booking a truck, CargoFlow **fills unused cargo space** by matching multiple compatible shipments traveling along the same route, based on:

- **Route** — shipments headed the same direction
- **Cargo size** — fits available space
- **Vehicle capacity** — matched to the carrier's truck
- **Delivery schedule** — aligned pickup and drop-off windows

> This project was developed as a requirement for **MO-IT161 – Web Systems and Technology**.

---

## Key Features

| Feature                  | Description                                                       |
| ------------------------ | ----------------------------------------------------------------- |
| **Smart Matching**       | Find compatible shipments and carriers going along the same route |
| **Cost Sharing**         | Split transport costs among multiple shippers sharing one truck   |
| **Cargo Booking**        | Reserve available cargo space in a few clicks                     |
| **Shipment Tracking**    | Monitor shipment status from pickup to delivery                   |
| **Direct Messaging**     | Communicate with carriers directly inside the platform            |
| **Capacity Utilization** | Help carriers earn more by filling empty truck space              |

---

## Target Users

- **SMEs** — small and medium enterprises with partial-load shipments
- **Online Sellers** — e-commerce merchants shipping to customers
- **Manufacturers** — businesses moving goods between locations
- **Independent Shippers** — individuals with occasional cargo needs
- **Local Carriers** — truck owners/operators with unused capacity

---

## Tech Stack

<div align="center">

|      Technology       |                                                      Logo                                                      | Purpose                                     |
| :-------------------: | :----------------------------------------------------------------------------------------------------------: | :------------------------------------------ |
|       **HTML5**       |      <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/html5/html5-original.svg" width="48" />      | Markup and page structure (`index.html`)    |
|       **CSS3**        |       <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/css3/css3-original.svg" width="48" />       | Styling, layout, and responsive design      |
| **JavaScript (ES6+)** | <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/javascript/javascript-original.svg" width="48" /> | Icon rendering, mobile nav, and route search |
|   **Git & GitHub**    |      <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/github/github-original.svg" width="48" />      | Version control and collaboration           |

</div>

> **Note:** No framework, no build step, and no backend. Plain HTML, CSS, and JavaScript. Route data is mock data in `search.js` and all filtering runs in the browser.

---

## Getting Started

### Prerequisites

- A modern web browser. That's it — no Node.js, no install step.

### Run it

```bash
git clone https://github.com/armielynobinguar/Web-Systems-and-Technology-CargoFlow.git
cd Web-Systems-and-Technology-CargoFlow
```

Then either:

- **Open `index.html` directly** in your browser, or
- Serve the folder with any static server for a cleaner URL, e.g.
  `python3 -m http.server` (then visit **http://localhost:8000**) or the
  VS Code "Live Server" extension.

### About the page

`index.html` is the Home page: responsive navigation, a platform overview, a
three-step guide, and an interactive quick search with origin, destination, and
optional weight filters. Popular-route shortcuts, location swapping, input
validation, and empty results are supported. `app.js` renders the icons, drives
the mobile menu, and runs the search; `search.js` holds the mock route data.

The design follows the supplied CargoFlow brand board: deep blue (`#0B3D91`), sky blue (`#3882F6`), flow orange (`#FF7A00`), sand (`#F4F1EA`), and charcoal (`#1F2937`). The logo is an SVG recreation inspired by the reference; the truck illustration is original local SVG artwork, not an extracted image from the board.

**Prototype scope:** route listings, schedules, capacities, and starting prices are mock data in `search.js`. Search runs entirely in the browser; booking, accounts, live tracking, and messaging are not implemented. Navigation uses in-page section anchors. No API keys or backend are needed.

Fonts (DM Sans and Manrope) load from Google Fonts, which receives normal browser request metadata. System sans-serif fallbacks are used when offline; all artwork is local.

### Tests

Open **`tests.html`** in a browser. It runs the route-search assertions
against `search.js` and prints a pass/fail list on the page (and to the
console).

---

## Project Structure

```
Web-Systems-and-Technology-CargoFlow/
├── index.html          # The page: all markup
├── styles.css          # Brand styles and responsive layouts
├── app.js              # Icons, mobile nav, and the route search
├── search.js           # Mock route data and the findRoutes filter
├── tests.html          # Opens in a browser to run the tests
├── search.test.js      # Route-search assertions (run by tests.html)
├── cargo-journey.svg   # Local branded truck illustration
└── favicon.svg         # CargoFlow-inspired icon
```

---

## Core Pages

1. **Home** — platform overview and quick search
2. **Book Cargo Space** — reserve space and view shared cost breakdown
3. **Track Shipment** — see shipment status and timeline
4. **Shipment History** - for viewing active and past bookings. 
5. **Messages** — chat directly with carriers

---

## Screenshots

> _Add screenshots of the running app here._

|      Home      |  Book Cargo    |    Tracking    | 
| :------------: | :------------: | :------------: |
| _(screenshot)_ | _(screenshot)_ | _(screenshot)_ |

---

## Team

| Name                  |
| --------------------- |
| Armielyn Obinguar     |
| Chantal Louise Flor   |
| Mitzi Reese Arrogante |
| Ryan Keneth Tavera    |

---

## Links
[Application Development Worksheet](https://docs.google.com/spreadsheets/d/1dY_Oe7DcTmbCF5gs7h_8In5pB499XdTnBrwlWs6sxXw/edit?usp=sharing)
[Project Plan](https://docs.google.com/spreadsheets/d/138MnAb0N5k0tvgI0hg_GSXMYZVBpTThv79Nch-e4GCY/edit?usp=sharing)

## Course Information

- **Course Code:** MO-IT161
- **Subject:** Web Systems and Technology
- **Term:** Term 1, SY 2026–2027
- **Program:** Bachelor of Science in Information Technology
- **Section:** A3101
- **Institution:** Mapúa Malayan Digital College (MMDC)

---

<div align="center">

Made in the Philippines

</div>
