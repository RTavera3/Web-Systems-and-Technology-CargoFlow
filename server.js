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
 * It also hosts the messages API used by js/messages.js, which saves the
 * carrier chat in data/messages.json:
 *   GET    /api/health    server status check
 *   GET    /api/messages?conversationId=...  one booking's chat history
 *   POST   /api/messages  save one message ({ conversationId, text, sender, recipient })
 *   DELETE /api/messages?conversationId=...  clear one booking's chat history
 *
 * Run:  npm install   (first time only)
 *       npm run dev   (restarts automatically when a file changes)
 *       npm start
 */

const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

//Reference: https://nodejs.org/api/path.html#pathjoinpaths
// Absolute path to data/messages.json
// Uses path.join() and __dirname to build reliable absolute directory paths on any OS.
// Locates where messages are saved.
const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'messages.json');

// Reference: https://nodejs.org/api/fs.html#fsexistssyncpath
// Reference: https://nodejs.org/api/fs.html#fsmkdirsyncpath-options
// Reference: https://nodejs.org/api/fs.html#fswritefilesyncfile-data-options
// Ensure that the data directory and messages.json file exist before starting the server
// Prepares the backend database file automatically before reading or writing data.
function ensureDataFileExists() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2), 'utf8');
  }
}

ensureDataFileExists();

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

// GET route: Load chat history from data/messages.json
app.get('/api/messages', (req, res) => {
  try {
    const fileData = fs.readFileSync(DATA_FILE, 'utf8');
    const messages = JSON.parse(fileData || '[]');
    const conversationId = req.query.conversationId;
    if (!conversationId) return res.json(messages);
    res.json(messages.filter((message) =>
      message.conversationId === conversationId ||
      (!message.conversationId && conversationId === 'CF-24810293')
    ));
  } catch (error) {
    res.status(500).json({ error: 'Failed to read messages.' });
  }
});


// POST route: Save a new message to data/messages.json - acccepted 
app.post('/api/messages', (req, res) => {
  try {
    const { text, sender, recipient } = req.body;
    const clientMessageId = typeof req.body.clientMessageId === 'string'
      ? req.body.clientMessageId.trim()
      : '';
    const conversationId = typeof req.body.conversationId === 'string'
      ? req.body.conversationId.trim().toUpperCase()
      : 'CF-24810293';

    if (!conversationId || conversationId.length > 64) {
      return res.status(400).json({ error: 'A valid booking conversation is required.' });
    }

    // Validation: Reject empty or non-string messages
    if (!text || typeof text !== 'string' || text.trim() === '') {
      return res.status(400).json({ error: 'Message text cannot be empty.' });
    }
    if (clientMessageId.length > 128) {
      return res.status(400).json({ error: 'Invalid client message ID.' });
    }

    // Reference: https://expressjs.com/en/4x/api.html#res.status
    // Reference: https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/400
    // Reject messages exceeding 500 characters
    if (text.length > 500) {
      return res.status(400).json({ error: 'Message exceeds the 500 character limit.' });
    }

    ensureDataFileExists();

    const fileData = fs.readFileSync(DATA_FILE, 'utf8');
    const messages = JSON.parse(fileData || '[]');
    if (clientMessageId) {
      const existing = messages.find((message) => message.clientMessageId === clientMessageId);
      if (existing) return res.status(200).json({ message: existing, duplicate: true });
    }

    const newMessage = {
      id: Date.now().toString(),
      ...(clientMessageId ? { clientMessageId } : {}),
      sender: sender || 'Shipper',
      recipient: recipient || 'Carrier',
      conversationId,
      text: text.trim(),
      timestamp: new Date().toISOString()
    }

    messages.push(newMessage);
    fs.writeFileSync(DATA_FILE, JSON.stringify(messages, null, 2), 'utf8');

    res.status(201).json({ message: newMessage, duplicate: false });
  } catch (error) {
    console.error('Error saving message:', error);
    res.status(500).json({ error: 'Failed to save message.' });
  }
});



// DELETE route: Clear all messages from data/messages.json
// Reference: https://expressjs.com/en/4x/api.html#app.delete.method
// Reference: https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/200
// Writes an empty JSON array [] to data/messages.json.
// Clears stored chat history on the server when requested by the frontend.
app.delete('/api/messages', (req, res) => {
  try {
    ensureDataFileExists();
    const conversationId = typeof req.query.conversationId === 'string'
      ? req.query.conversationId.trim().toUpperCase()
      : '';
    if (conversationId) {
      const messages = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8') || '[]');
      const retained = messages.filter((message) =>
        message.conversationId !== conversationId &&
        (message.conversationId || conversationId !== 'CF-24810293')
      );
      fs.writeFileSync(DATA_FILE, JSON.stringify(retained, null, 2), 'utf8');
      return res.status(200).json({ message: 'Conversation messages deleted successfully.' });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2), 'utf8');
    res.status(200).json({ message: 'All messages deleted successfully.' });
  } catch (error) {
    console.error('Error deleting messages:', error);
    res.status(500).json({ error: 'Failed to delete messages.' });
  }
});

// Anything else is not part of the site.
app.use((req, res) => {
  res.status(404).send("Page not found");
});

app.listen(PORT, () => {
  console.log(`CargoFlow running on http://localhost:${PORT}`);
});
