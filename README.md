<div align="center">

# CargoFlow

### _Share the Road. Share the Cost._

**A browser-based cargo-sharing platform for the Philippines** — connecting SMEs, online sellers, manufacturers, independent shippers, and local carriers by matching partial shipments with unused truck capacity.

![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white)

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
| **Account Profile**      | Keep your shipper details; they prefill new bookings              |
| **Direct Messaging**     | Chat with carriers; history is saved on the server through the messages API |
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
|  **Node.js + Express** |       <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nodejs/nodejs-original.svg" width="48" />       | Backend (`server.js`): serves the site and the messages API |
|   **Git & GitHub**    |      <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/github/github-original.svg" width="48" />      | Version control and collaboration           |

</div>

> **Note:** No front-end framework and no build step. Plain HTML, CSS, and
> JavaScript, plus Bootstrap 5 (via CDN) across every page. A Node.js + Express
> backend (`server.js`, with one Express router per resource in `routes/`) serves
> the pages and a REST API. Carrier messages are saved in `data/messages.json` and
> bookings in `data/bookings.json`, so both survive page reloads, server restarts
> and other browsers. The server checks every booking, makes its tracking code and
> answers every tracking lookup. The contact form, the booking form's user lookup
> and the account profile go through it too, so nothing is kept in the browser's
> `localStorage`. Every script, on the server and in the browser, is an ES module
> (`import`/`export`, no CommonJS). See [Backend API](#backend-api).

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 20 or newer (LTS recommended). Check with `node -v`.
- A modern web browser.

### Run it

```bash
git clone https://github.com/RTavera3/Web-Systems-and-Technology-CargoFlow.git
cd Web-Systems-and-Technology-CargoFlow
npm install      # first time only: installs Express and CORS
npm start
```

Then open **http://localhost:3000**. The terminal shows
`CargoFlow running on http://localhost:3000` once the server is up.

| Command       | What it does                                                             |
| ------------- | ------------------------------------------------------------------------ |
| `npm start`   | Runs the server (`node server.js`)                                       |
| `npm run dev` | Runs the server and restarts it whenever a file changes (`node --watch`) |
| `npm test`    | Runs the API tests in `test/` (`node --test`, with Supertest)            |

To check the backend is running, open **http://localhost:3000/api/health**.
Stop the server with `Ctrl + C`.

Every page calls the API with relative URLs (`/api/...`), so the site works on any
port, for example `PORT=8080 npm start`.

The server only serves the front-end folders (`css/`, `js/`, `pages/`, `resources/`)
and `index.html`, so `server.js`, `package.json`, `node_modules/` and the saved
`data/messages.json` are never reachable from the browser except through the API. Serving over `http://` also lets the booking page load
`resources/users.json`, which browsers block when the HTML file is opened directly.
The payment, tracking, history and chat pages also load their scripts as ES modules,
which browsers only run over `http://`, so open the site through the server rather than
by double-clicking an HTML file.

The server is written as ES modules too: `package.json` sets `"type": "module"`, so
`server.js`, `routes/`, `lib/` and `test/` use `import` / `export` rather than
`require` / `module.exports`, and relative imports include the `.js` extension.

### About the pages

`index.html` (project root) is the Home page — Bootstrap 5 navbar, hero with
a floating "Get a price" quote card, a shipment-tracking widget, a carrier
CTA, and an About section. Every other page lives under `pages/`:
`contact.html`, `booking-details.html`, `payment.html`, `messages.html`
(carrier chat whose history is saved on the server through the [messages API](#backend-api)), `trackshipment.html`
(the full tracking page, separate from the home page's quick widget),
`history.html` (Shipment History: every active and past booking, with status
filters, search and sorting; completed bookings appear there automatically), and
`profile.html` (Account Profile: the shipper's details, saved in this browser and
used to prefill the booking form and preferred payment method).

The design follows the CargoFlow brand palette: deep blue (`#0B3D91`) and
flow orange (`#FF7A00`), with sand (`#F4F1EA`) as a secondary background.
Icons are inline SVG (no icon font/CDN) to keep the site's look consistent
and working offline.

**Prototype scope:** shipment tracking and pricing use mock data, and there's no
database or real payment processing. The backend is deliberately lightweight: an
Express server that stores chat messages in a JSON file. No API keys are needed to
run it.

**Saved data:**

- **Chat messages** are saved on the server in `data/messages.json` through the
  [messages API](#backend-api). The server creates the file if it is missing.
- **Bookings** are checked and saved on the server in `data/bookings.json` through
  [`POST /api/bookings`](#bookings). My Shipments and the profile's booking count read
  them from `GET /api/bookings`, and Track Shipment from `GET /api/shipments/:code`.
- **The account profile** is saved on the server in `data/profile.json` through
  `GET` and `PUT /api/profile`. Until it is first saved, the demo account is used.
- **Contact form messages** are checked and saved in `data/contact-messages.json`
  through `POST /api/contact`.
- **Users** for the booking form's User ID lookup are in `data/users.json`. The
  browser can't load that file: `GET /api/users` gives every user's ID and name, and
  `GET /api/users/:id` one user's details.

Fonts load from Google Fonts, which receives normal browser request
metadata; system sans-serif fallbacks are used when offline.

---

## Backend API

The Express server in `server.js` exposes a small REST API under `/api`, with one
`express.Router()` per resource in `routes/` (`messages.js`, `bookings.js`,
`shipments.js`, `contact.js`, `profile.js`, `users.js`). Requests and responses are JSON. The Messages page
(`js/messages.js`) loads, sends and clears the carrier chat through it. The Payment,
My Shipments, Profile and Track Shipment pages save, list and track bookings
through it (`js/api.js`).

| Method   | Route           | What it does                                 | Success response |
| -------- | --------------- | -------------------------------------------- | ---------------- |
| `GET`    | `/api/health`   | Checks that the server is running            | `200` `{ "status": "OK", "message": "CargoFlow Messaging Server is Running!" }` |
| `GET`    | `/api/messages` | Returns the whole chat history, oldest first | `200` an array of messages |
| `POST`   | `/api/messages` | Saves one new message                        | `201` `{ "message": "Message saved successfully.", "data": { ...the saved message } }` |
| `DELETE` | `/api/messages` | Deletes every message                        | `200` `{ "message": "All messages deleted successfully." }` |
| `GET`    | `/api/bookings` | Lists every booking, newest first, summary fields only | `200` `[ { "code", "from", "to", "date", "time", "paymentMethod", "status", "createdAt" } ]` |
| `POST`   | `/api/bookings` | Checks one booking, makes its code and saves it | `201` `{ "message": "Booking saved.", "data": { "code": "CF-12345678", ...the saved booking } }` |
| `PATCH`  | `/api/bookings/:code/status` | Moves a booking to its next delivery step and records when | `200` `{ "message": "Booking is now \"Picked Up\".", "data": { ...summary, "statusHistory": [ { "status", "at" } ] } }` |
| `GET`    | `/api/shipments/:code` | Returns one shipment's route, ETA, status and timeline | `200` `{ "code": "CF-24810293", "route": "Manila → Cebu", "eta": ..., "status": "In Transit", "badgeClass": ..., "timeline": [ ... ] }` |
| `POST`   | `/api/contact`  | Checks and saves one contact form message (`name`, `email`, `message`) | `201` `{ "message": "Message sent.", "data": { "id": ... } }` |
| `GET`    | `/api/profile`  | Returns the account profile (the demo account until it is saved) | `200` the profile |
| `PUT`    | `/api/profile`  | Checks and saves the account profile          | `200` the saved profile |
| `GET`    | `/api/users`    | Lists every user's ID and name               | `200` `[ { "userId": "BC0001", "name": "Juan Dela Cruz" } ]` |
| `GET`    | `/api/users/:id` | Returns one user's saved details            | `200` `{ "userId", "name", "contactNumber", "streetAddress", "city", "province", "zipCode" }` |

### Tracking a shipment

`GET /api/shipments/:code` takes a tracking code such as `CF-24810293`. Case and
surrounding spaces don't matter. The server looks the code up in the demo shipment
(`lib/shipments.js`) and then in the saved bookings, and builds the timeline itself.
A booking shows "Order Placed" as done and the scheduled pickup as the next step.

| Situation                                        | Status | Response body |
| ------------------------------------------------ | ------ | ------------- |
| No code (`/api/shipments/`)                      | `400`  | `{ "error": "Tracking code is required." }` |
| Code isn't `CF-` plus 4-12 letters or digits     | `400`  | `{ "error": "Tracking code must look like CF-24810293." }` |
| Well-formed code with no shipment or booking     | `404`  | `{ "error": "No shipment found for that tracking number." }` |

### Bookings

The Payment page (`js/payment.js`) sends the booking form's fields and the payment
method to `POST /api/bookings`. The browser checks the form too, but the API can be
called directly, so the server checks again (`lib/bookings.js`), then makes the
tracking code itself:

```json
{
  "from": "Manila", "to": "Cebu", "date": "2026-12-01", "time": "09:00",
  "weight": "100", "type": "General goods", "vehicleType": "Van",
  "senderName": "Juan Dela Cruz", "senderContact": "09171234567",
  "pickupAddress": "123 Rizal St", "pickupCity": "Manila", "pickupProvince": "Metro Manila", "pickupZip": "1000",
  "receiverName": "Maria Santos", "receiverContact": "09181234567",
  "dropoffAddress": "45 Osmena Blvd", "dropoffCity": "Cebu City", "dropoffProvince": "Cebu", "dropoffZip": "6000",
  "cargoDescription": "Boxes of books", "packageCount": "3", "declaredValue": "5000",
  "paymentMethod": "GCash"
}
```

| Field | Rule |
| ----- | ---- |
| All of the above | Required, as text or a number (never an object or a list), at most 500 characters |
| `from`, `to` | Must be different cities |
| `date`, `time` | `YYYY-MM-DD` and `HH:MM`, a real date, and later than now (server time) |
| `weight` | A number of kg above 0 and up to 50,000 |
| `packageCount` | A whole number, 1 or more |
| `declaredValue` | A number, 0 or more |
| `paymentMethod` | `GCash`, `Credit or debit card` or `Cash on pickup` |

The form's optional fields (user IDs, special instructions, the fragile and loading
checkboxes, and the account owner's details) are saved too. **Anything else is
dropped**, including a `code` or `status` sent by the browser: the server makes the
code (`CF-` plus 8 digits, never one already used) and sets the status to
`Booking Placed`. Bookings are saved one at a time, so two arriving together can't
overwrite each other.

A booking that breaks a rule gets `400` with the first problem in `error` and every
problem in `errors`:

```json
{
  "error": "Pickup must be in the future.",
  "errors": [{ "field": "time", "message": "Pickup must be in the future." }]
}
```

The Payment page shows that message and doesn't confirm the booking. If the server
can't be reached, it says so instead.

`GET /api/bookings` lists the bookings for My Shipments with summary fields only:
no names, phone numbers or addresses leave the server.

### Moving a shipment along

Every booking starts at **Booking Placed** and moves through the same steps, one at
a time:

**Booking Placed → Picked Up → In Transit → Out for Delivery → Delivered**

Send the next step to `PATCH /api/bookings/:code/status`:

```json
{ "status": "Picked Up" }
```

The server saves the new status with the time it happened in `statusHistory`. The
Track Shipment timeline then shows each step reached with its time and the latest
one as current, and the badge and estimated delivery change with it. My Shipments
shows the new status and can filter by it.

| Situation | Status | Response body |
| --- | --- | --- |
| The next step | `200` | `{ "message": "Booking is now \"Picked Up\".", "data": { ... } }` |
| Skipping a step, going back, repeating one, or anything after Delivered | `409` | `{ "error": "Booking is \"Booking Placed\", so it can't move to \"In Transit\"; the next step is \"Picked Up\"." }` |
| `status` missing or not one of the five steps | `400` | `{ "error": "status must be one of: Booking Placed, Picked Up, In Transit, Out for Delivery, Delivered." }` |
| Code not shaped like `CF-12345678` | `400` | `{ "error": "Booking code must look like CF-12345678." }` |
| No booking has that code (the demo shipment `CF-24810293` included) | `404` | `{ "error": "No booking found for that code." }` |

Naming the step, rather than asking to "advance", means a request sent twice (a
double click, a retry) moves the booking only once. There are no accounts yet, so
like the rest of the API this endpoint is open; a carrier sign-in would guard it.

### Sending a message

Request body for `POST /api/messages`:

```json
{ "text": "Is my shipment on schedule?", "sender": "Shipper", "recipient": "Carrier" }
```

`text` is required. `sender` and `recipient` are optional and default to
`"Shipper"` and `"Carrier"`. The server trims the text, adds an id and a timestamp,
and saves it:

```json
{
  "id": "1792038594020",
  "sender": "Shipper",
  "recipient": "Carrier",
  "text": "Is my shipment on schedule?",
  "timestamp": "2026-10-15T04:29:54.020Z"
}
```

### Validation and errors

| Situation                                    | Status | Response body |
| -------------------------------------------- | ------ | ------------- |
| `text` missing, not a string, or only spaces | `400`  | `{ "error": "Message text cannot be empty." }` |
| `text` longer than 500 characters            | `400`  | `{ "error": "Message exceeds the 500 character limit." }` |
| Request body is not valid JSON               | `400`  | `{ "error": "Invalid JSON" }` |
| The messages file can't be read or written   | `500`  | `{ "error": "Failed to read messages." }` (or `save` / `delete`) |
| Any other path                               | `404`  | `Page not found` |

### Trying it from a terminal

With the server running (`npm start`):

```bash
curl http://localhost:3000/api/health
curl http://localhost:3000/api/messages
curl -X POST http://localhost:3000/api/messages \
  -H "Content-Type: application/json" \
  -d '{"text":"Hello from curl"}'
curl -X DELETE http://localhost:3000/api/messages
curl http://localhost:3000/api/shipments/CF-24810293
curl http://localhost:3000/api/bookings
curl -X POST http://localhost:3000/api/bookings \
  -H "Content-Type: application/json" \
  -d '{"from":"Manila","to":"Cebu","date":"2020-01-01","time":"09:00","weight":100,"paymentMethod":"GCash"}'
curl -X PATCH http://localhost:3000/api/bookings/CF-12345678/status \
  -H "Content-Type: application/json" \
  -d '{"status":"Picked Up"}'
```

### Tests

`npm test` runs the tests in `test/` with Node's built-in test runner. They use
[Supertest](https://github.com/ladjs/supertest) to call the API without starting the
server, so nothing needs to be running first. The tests save to temporary files
(`BOOKINGS_FILE`, `CONTACT_FILE`, `PROFILE_FILE`, `USERS_FILE`), never to `data/`.

### Where the data lives

Messages are stored in `data/messages.json` as a JSON array. A missing file reads as
no messages, and the folder and file are created on the next write. To reset the
chat, use the trash icon on the Messages page, call `DELETE /api/messages`, or stop the server and replace the file's contents with `[]`.

Bookings are stored in `data/bookings.json` as an object keyed by booking code. The
file is created on the first booking and isn't committed (it's in `.gitignore`).

---

## Project Structure

```
Web-Systems-and-Technology-CargoFlow/
├── server.js                     # Express backend: serves the site and the /api routes
├── package.json                  # Project info, npm scripts (start, dev, test), Express and CORS
├── routes/
│   ├── bookings.js               # GET and POST /api/bookings, PATCH .../:code/status (Express router)
│   ├── contact.js                # POST /api/contact: the contact form (Express router)
│   ├── messages.js               # GET, POST and DELETE /api/messages (Express router)
│   ├── profile.js                # GET and PUT /api/profile: the account profile (Express router)
│   ├── shipments.js              # GET /api/shipments/:code: demo shipment or a saved booking
│   └── users.js                  # GET /api/users and /api/users/:id: the booking form's user lookup
├── lib/
│   ├── bookings.js               # Booking rules, delivery steps, data/bookings.json, tracking timeline
│   ├── json-store.js             # Reading and saving the JSON files in data/ for the newer routes
│   └── shipments.js              # Shipment data the tracking route looks up (demo shipment for now)
├── test/
│   ├── bookings.test.js          # API tests for bookings and tracking a saved booking (npm test)
│   ├── errors.test.js            # API tests for the JSON error handler
│   ├── shipments.test.js         # API tests for the shipments route (npm test)
│   ├── contact.test.js           # API tests for the contact route
│   ├── profile.test.js           # API tests for the profile route
│   └── users.test.js             # API tests for the users route
├── data/
│   ├── bookings.json             # Bookings saved by the bookings API (created on first booking, not committed)
│   ├── contact-messages.json     # Contact form messages (created on the first message, not committed)
│   ├── messages.json             # Chat history saved by the messages API (created on first message if missing)
│   ├── profile.json              # The account profile (created on the first save, not committed)
│   └── users.json                # Users for the booking form's User ID lookup
├── index.html                    # Home page: hero, quote form, track widget, carrier CTA, about
├── css/
│   └── theme.css                 # Shared Bootstrap theme overrides for every page (navy/orange brand)
├── js/
│   ├── track.js                  # Home page's quick shipment-tracking widget (GET /api/shipments/:code)
│   ├── trackshipment.js          # Full tracking page logic (pages/trackshipment.html)
│   ├── api.js                    # The browser's calls to the API: bookings, shipments, users, contact, profile
│   ├── history.js                # Shipment History list, filters, search and sort (pages/history.html)
│   ├── profile.js                # Account Profile form (pages/profile.html)
│   └── messages.js               # Carrier chat: loads, sends and clears messages through the API
├── pages/
│   ├── contact.html              # Contact form
│   ├── booking-details.html      # Cargo/address details step of the booking flow
│   ├── payment.html              # Payment step of the booking flow
│   ├── messages.html             # Carrier messaging UI
│   ├── trackshipment.html        # Full shipment-tracking page (accepts ?code=CF-... to search directly)
│   ├── history.html              # Shipment History: active and past bookings
│   └── profile.html              # Account Profile: shipper details used to prefill bookings
└── resources/
    └── cargoflow.logo.png        # Brand logo asset
```

`index.html` stays at the project root (so `index.html` loads by default from any static host);
every other page lives under `pages/`. Pages link to each other with plain relative paths — no
build step, router, or bundler is involved.

---

## Core Pages

1. **Home** — platform overview and quick search
2. **Book Cargo Space** — reserve space and view shared cost breakdown
3. **Track Shipment** — see shipment status and timeline
4. **Shipment History** — view active and past bookings, filter by status, search, and open any one to track it
5. **Account Profile** — manage shipper details used to prefill bookings
6. **Messages** — chat directly with carriers; history is saved on the server

---

## Screenshots

|                Home                 |               Book Cargo                |              Tracking               |
| :----------------------------------: | :--------------------------------------: | :-----------------------------------: |
| ![Home page](resources/screenshots/home.jpg) | ![Book cargo space form](resources/screenshots/book-cargo.jpg) | ![Track shipment results](resources/screenshots/tracking.jpg) |

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

| Link Text | Link URL |
| :--- | :--- |
| **Application Development Worksheet** | [Application Development Worksheet](https://docs.google.com/spreadsheets/d/1dY_Oe7DcTmbCF5gs7h_8In5pB499XdTnBrwlWs6sxXw/edit?usp=sharing) |
| **Project Plan** | [Project Plan](https://docs.google.com/spreadsheets/d/138MnAb0N5k0tvgI0hg_GSXMYZVBpTThv79Nch-e4GCY/edit?usp=sharing) |
| **AI Use Statement** | [AI Use Statement](https://docs.google.com/document/d/1LYv0N-MkpsaRtzsQQ7X2heC_45hTNs3Z9yNxwxWlT0I/edit?tab=t.0) |

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
