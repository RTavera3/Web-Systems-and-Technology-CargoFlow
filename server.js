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

// Enable CORS and JSON body parsing middleware
app.use(cors());
app.use(express.json());

// Serve static frontend files (html, css, js) 
// Reference: https://expressjs.com/en/starter/static-files.html
const publicPath = path.join(__dirname, 'public');
app.use(express.static(publicPath));

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
    const fileData = fs.readFileSync(DATA_FILE, 'utf8');
    const messages = JSON.parse(fileData || '[]');
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: 'Failed to read messages.' });
  }
});


// POST route: Save a new message to data/messages.json - acccepted 
app.post('/api/messages', (req, res) => {
  try {
    const { text, sender, recipient } = req.body;

    if (!text || typeof text !== 'string' || text.trim() === '') {
      return res.status(400).json({ error: 'Message text cannot be empty.' });
    }

    ensureDataFileExists();

    const fileData = fs.readFileSync(DATA_FILE, 'utf8');
    const messages = JSON.parse(fileData || '[]');

    const newMessage = {
      id: Date.now().toString(),
      sender: sender || 'Shipper',
      recipient: recipient || 'Carrier',
      text: text.trim(),
      timestamp: new Date().toISOString()
    }

    messages.push(newMessage);
    fs.writeFileSync(DATA_FILE, JSON.stringify(messages, null, 2), 'utf8');

    res.status(201).json({ 
      message: 'Message saved successfully.',
      data: newMessage
    });
  } catch (error) {
    console.error('Error saving message:', error);
    res.status(500).json({ error: 'Failed to save message.' });
  }
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

// DELETE route: Clear all messages from data/messages.json
// Reference: https://expressjs.com/en/4x/api.html#app.delete.method
// Reference: https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/200
// Writes an empty JSON array [] to data/messages.json.
// Clears stored chat history on the server when requested by the frontend.
app.delete('/api/messages', (req, res) => {
  try {
    ensureDataFileExists();
    fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2), 'utf8');
    res.status(200).json({ message: 'All messages deleted successfully.' });
  } catch (error) {
    console.error('Error deleting messages:', error);
    res.status(500).json({ error: 'Failed to delete messages.' });
  }
});