// Reference: https://expressjs.com/en/starter/hello-world/
// Reference: https://expressjs.com/en/starter/static-files.html

// PLAN: This placeholder tests if the Express server runs on local port 3000.
// FUTURE WORK: We will add GET /api/messages and POST /api/messages routes here
// to read and save chat messages into data/messages.json instead of localStorage.

const express = require('express');
const app = express();
const port = 3000;

app.get('/', (req, res) => {
  res.send('CargoFlow Messaging Server is Running!');
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