// Reference: https://expressjs.com/en/starter/hello-world/
// Reference: https://expressjs.com/en/starter/static-files.html

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

// Absolute path to data/messages.json
const DATA_FILE = path.join(__dirname, 'data', 'messages.json');

// Enable CORS and JSON body parsing middleware
app.use(cors());
app.use(express.json());

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
    const newMessage = req.body;
    const fileData = fs.readFileSync(DATA_FILE, 'utf8');
    const messages = JSON.parse(fileData || '[]');
    messages.push(newMessage);
    fs.writeFileSync(DATA_FILE, JSON.stringify(messages));
    res.status(201).json({ message: 'Message saved successfully.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save message.' });
  }
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

// Reference: https://expressjs.com/en/guide/routing.html
// Planning to edit the get for the loading of chat history and the post for 
// saving new messages to the data/messages.json file

// GET method route (Placeholder to fetch stored messages)
app.get('/api/messages', (req, res) => {
  res.send('GET request to the messages server');
});

// POST method route (Placeholder to save a new message)
app.post('/api/messages', (req, res) => {
  res.send('POST request to the messages server');
});