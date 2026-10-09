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
 * Only the front-end folders are served, so files like server.js and
 * package.json are not reachable from the browser.
 *
 * Run:  npm install   (first time only)
 *       npm run dev   (restarts automatically when a file changes)
 *       npm start
 */

const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// Front-end folders, served at the same paths the HTML already links to.
for (const folder of ["css", "js", "pages", "resources"]) {
  app.use(`/${folder}`, express.static(path.join(__dirname, folder)));
}

// Home page (the other pages link back to ../index.html).
app.get(["/", "/index.html"], (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// Anything else is not part of the site.
app.use((req, res) => {
  res.status(404).send("Page not found");
});

app.listen(PORT, () => {
  console.log(`CargoFlow running on http://localhost:${PORT}`);
});
