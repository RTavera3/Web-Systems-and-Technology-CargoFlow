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

// Serve static frontend files (html, css, js) 
// Reference: https://expressjs.com/en/starter/static-files.html
const publicPath = path.join(__dirname, 'public');
app.use(express.static(publicPath));

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

// Reference: https://expressjs.com/en/4x/api.html#res.status
// Reference: https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/400
if (!req.body || !req.body.text || req.body.text.trim() === '') {
  return res.status(400).json({ error: 'Message text cannot be empty.' });
}


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

    // Reference: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/toISOString
    // Reference: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/now
    const newMessage = {
      id: Date.now().toString(),
      ...req.body,
      timestamp: new Date().toISOString()
    };


app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});