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