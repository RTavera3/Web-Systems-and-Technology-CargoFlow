/**
 * server.js
 *
 * Basic Node.js + Express server for CargoFlow.
 *
 * For now it only serves the existing front end (HTML, CSS, JS and
 * resources) exactly as it is, so the site works the same as before but
 * runs from http://localhost:3000 instead of opening the HTML files
 * directly. This also lets js/booking-details.js load
 * resources/users.json with fetch(), which browsers block on file:// pages.
 *
 * Only the front-end folders are served, so files like server.js,
 * package.json and data/messages.json are not reachable from the browser.
 *
 * The API is split into Express routers in routes/, each mounted below:
 *   GET    /api/health            server status check
 *   GET    /api/messages          chat history            (routes/messages.js)
 *   POST   /api/messages          save one message
 *   DELETE /api/messages          clear the chat history
 *   GET    /api/bookings          every booking, summary fields only (routes/bookings.js)
 *   POST   /api/bookings          check and save one booking; the server makes its code
 *   PATCH  /api/bookings/:code/status  move a booking to its next delivery step
 *   GET    /api/shipments/:code   one shipment's tracking details   (routes/shipments.js)
 *
 * Run:  npm install   (first time only)
 *       npm run dev   (restarts automatically when a file changes)
 *       npm start
 */

// ES modules ("type": "module" in package.json): import/export instead of
// require/module.exports. Reference: https://nodejs.org/api/esm.html
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

import bookingsRouter from "./routes/bookings.js";
import messagesRouter from "./routes/messages.js";
import shipmentsRouter from "./routes/shipments.js";

// ES modules have no __dirname; build it from this file's URL.
// Reference: https://nodejs.org/api/esm.html#importmetaurl
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const PORT = process.env.PORT || 3000;

//Reference:https://expressjs.com/en/resources/middleware/cors/
// Enable CORS and JSON body parsing middleware
app.use(cors());
app.use(express.json());

// Front-end folders, served at the same paths the HTML already links to.
for (const folder of ["css", "js", "pages", "resources"]) {
  app.use(`/${folder}`, express.static(path.join(__dirname, folder)));
}

// Home page (the other pages link back to ../index.html).
app.get(["/", "/index.html"], (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// Reference: https://expressjs.com/en/4x/api.html#app.get.method
// Listens for GET requests made to '/api/health' and returns status JSON.
// Offers a quick endpoint to verify server status.
app.get('/api/health', (req, res) => {
  res.send({ status: 'OK', message: 'CargoFlow Messaging Server is Running!' });
});

// Reference: https://expressjs.com/en/guide/routing.html#express-router
// API routes. Each router handles everything under its path.
app.use("/api/bookings", bookingsRouter);
app.use("/api/messages", messagesRouter);
app.use("/api/shipments", shipmentsRouter);

// Anything else is not part of the site.
app.use((req, res) => {
  res.status(404).send("Page not found");
});

// Reference: https://expressjs.com/en/guide/error-handling.html
// express.json() throws when a request body isn't valid JSON. Answer with a
// JSON error like the rest of the API instead of Express's default HTML page.
// Any other error goes on to Express's default handler.
app.use((err, req, res, next) => {
  if (err.type === "entity.parse.failed" && !res.headersSent) {
    return res.status(400).json({ error: "Invalid JSON" });
  }
  next(err);
});

// Start listening only when run directly (npm start / npm run dev), not when
// the tests import the app.
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  app.listen(PORT, () => {
    console.log(`CargoFlow running on http://localhost:${PORT}`);
  });
}

export default app;
