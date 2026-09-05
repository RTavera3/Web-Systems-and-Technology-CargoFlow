<div align="center">

# CargoFlow

### *Share the Road. Share the Cost.*

**A browser-based cargo-sharing platform for the Philippines** — connecting SMEs, online sellers, manufacturers, independent shippers, and local carriers by matching partial shipments with unused truck capacity.

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
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

| Feature | Description |
|---|---|
| **Smart Matching** | Find compatible shipments and carriers going along the same route |
| **Cost Sharing** | Split transport costs among multiple shippers sharing one truck |
| **Cargo Booking** | Reserve available cargo space in a few clicks |
| **Shipment Tracking** | Monitor shipment status from pickup to delivery |
| **Direct Messaging** | Communicate with carriers directly inside the platform |
| **Capacity Utilization** | Help carriers earn more by filling empty truck space |

---

## Target Users

- **SMEs** — small and medium enterprises with partial-load shipments
- **Online Sellers** — e-commerce merchants shipping to customers
- **Manufacturers** — businesses moving goods between locations
- **Independent Shippers** — individuals with occasional cargo needs
- **Local Carriers** — truck owners/operators with unused capacity

---

## Tech Stack (Frontend)

<div align="center">

| Technology | Logo | Purpose |
|:---:|:---:|:---|
| **React** | <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg" width="48" /> | Component-based UI library for building the interface |
| **JavaScript (ES6+)** | <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/javascript/javascript-original.svg" width="48" /> | Core programming language powering app logic |
| **HTML5** | <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/html5/html5-original.svg" width="48" /> | Markup and page structure |
| **CSS3** | <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/css3/css3-original.svg" width="48" /> | Styling, layout, and responsive design |
| **React Router** | <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/reactrouter/reactrouter-original.svg" width="48" /> | Client-side routing between pages |
| **Vite** | <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/vitejs/vitejs-original.svg" width="48" /> | Fast development server and build tool |
| **npm** | <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/npm/npm-original-wordmark.svg" width="48" /> | Package management |
| **Git & GitHub** | <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/github/github-original.svg" width="48" /> | Version control and collaboration |

</div>

> **Note:** This project focuses on the **frontend only**. Data is handled on the client side (mock data / local state) — no backend server is required to run it.

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later recommended)
- npm (comes with Node.js)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/your-username/cargoflow.git

# 2. Go to the project folder
cd cargoflow

# 3. Install dependencies
npm install

# 4. Start the development server
npm run dev
```

Then open **http://localhost:5173** in your browser.

---

## Project Structure

```
cargoflow/
├── public/                 # Static assets (icons, images)
├── src/
│   ├── assets/             # Logos, illustrations, images
│   ├── components/         # Reusable UI components
│   │   ├── Navbar.jsx
│   │   ├── ShipmentCard.jsx
│   │   ├── MatchList.jsx
│   │   └── ChatBox.jsx
│   ├── pages/              # Page-level components
│   │   ├── Home.jsx
│   │   ├── FindMatches.jsx
│   │   ├── BookCargo.jsx
│   │   ├── TrackShipment.jsx
│   │   └── Messages.jsx
│   ├── data/               # Mock data (routes, carriers, shipments)
│   ├── styles/             # CSS files
│   ├── App.jsx             # Root component & routes
│   └── main.jsx            # Entry point
├── index.html
├── package.json
└── vite.config.js
```

---

## Core Pages

1. **Home** — platform overview and quick search
2. **Find Matches** — browse shipments/carriers filtered by route, size, and schedule
3. **Book Cargo Space** — reserve space and view shared cost breakdown
4. **Track Shipment** — see shipment status and timeline
5. **Messages** — chat directly with carriers

---

## Screenshots

> *Add screenshots of the running app here.*

| Home | Find Matches | Tracking |
|:---:|:---:|:---:|
| *(screenshot)* | *(screenshot)* | *(screenshot)* |

---

## Team

| Name |
|---|
| Armielyn Obinguar |
| Chantal Louise Flor |
| Mitzi Reese Arrogante |
| Ryan Keneth Tavera |

---

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
