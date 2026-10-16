// Reference: https://expressjs.com/en/starter/hello-world/
// Reference: https://expressjs.com/en/starter/static-files.html
// Reference: https://expressjs.com/en/4x/api.html#app.get.method

// PLAN: This placeholder tests if the Express server runs on local port 3000.
// FUTURE WORK: We will add GET /api/messages and POST /api/messages routes here
// to read and save chat messages into data/messages.json instead of localStorage.

//Reference:https://expressjs.com/en/resources/middleware/cors/

const express = require('express');
const cors = require('cors');

const fs = require('fs');
const path = require('path');

const app = express();
const port = 3000;

//Reference: https://nodejs.org/api/path.html#pathjoinpaths
// Absolute path to data/messages.json
// Uses path.join() and __dirname to build reliable absolute directory paths on any OS.
// Locates where messages are saved and where HTML/CSS/JS frontend files live.
const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'messages.json');
const PUBLIC_PATH = path.join(__dirname, 'public');

// Write queue to prevent file write race conditions
let writeQueue = Promise.resolve();

/**
 * Write to a temp file first, then rename it.
 * Prevents file corruption if the server crashes mid-write.
 */
function saveJsonAtomic(data) {
  const tempFile = path.join(DATA_DIR, `messages_${Date.now()}.tmp`);
  fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf8');
  fs.renameSync(tempFile, DATA_FILE);
}

function readMessagesSafe() {
  ensureDataFileExists();
  try {
    const fileData = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(fileData || '[]');
  } catch (err) {
    console.error('Corrupted JSON file detected. Resetting array:', err);
    saveJsonAtomic([]);
    return [];
  }
}

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
    saveJsonAtomic([]);
  }
}

ensureDataFileExists();

// Enable CORS and JSON body parsing middleware
app.use(cors());
app.use(express.json());

// Serve static frontend files (html, css, js) 
// Reference: https://expressjs.com/en/starter/static-files.html
app.use(express.static(__dirname));

// Reference: https://expressjs.com/en/4x/api.html#app.get.method
// Listens for GET requests made to '/api/health' and returns status JSON.
// Offers a quick endpoint to verify server status.
app.get('/api/health', (req, res) => {
  res.send({ status: 'OK', message: 'CargoFlow Messaging Server is Running!' });
});

app.get('/', (req, res) => {
  res.send('CargoFlow Messaging Server is Running!');
});

// GET route: Load chat history from data/messages.json
app.get('/api/messages', (req, res) => {
  try {
    const messages = readMessagesSafe();
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: 'Failed to read messages.' });
  }
});


// POST route: Save a new message to data/messages.json - acccepted 
app.post('/api/messages', async (req, res) => {
  try {
    const { text, sender, recipient } = req.body;

    // Validation: Reject empty or non-string messages
    if (!text || typeof text !== 'string' || text.trim() === '') {
      return res.status(400).json({ error: 'Message text cannot be empty.' });
    }

    // Reference: https://expressjs.com/en/4x/api.html#res.status
    // Reference: https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/400
    // Reject messages exceeding 500 characters
    if (text.length > 500) {
      return res.status(400).json({ error: 'Message exceeds the 500 character limit.' });
    }

    const newMessage = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      sender: sender || 'Shipper',
      recipient: recipient || 'Carrier',
      text: text.trim(),
      timestamp: new Date().toISOString()
    }

    writeQueue = writeQueue.then(() => {
      const messages = readMessagesSafe();
      messages.push(newMessage);
      saveJsonAtomic(messages);
    });
    await writeQueue;

    res.status(201).json({
      message: 'Message saved successfully.',
      data: newMessage
    });
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
app.delete('/api/messages', async (req, res) => {
  try {
    writeQueue = writeQueue.then(() => {
      saveJsonAtomic([]);
    });
    await writeQueue;
    res.status(200).json({
      message: 'All messages deleted successfully.'
    });
  } catch (error) {
    console.error('Error deleting messages:', error);
    res.status(500).json({ error: 'Failed to delete messages.' });
  }
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});