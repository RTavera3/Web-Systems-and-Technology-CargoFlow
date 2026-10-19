/**
 * Message routes, mounted in server.js at /api/messages.
 *
 *   GET    /api/messages  - returns the saved chat history (used by messages.html)
 *   POST   /api/messages  - validates and saves one message ({ text, sender, recipient })
 *   DELETE /api/messages  - clears the chat history
 *
 * References:
 *   Express routing and express.Router: https://expressjs.com/en/guide/routing.html#express-router
 *   Express API (req.body, res.json, res.status): https://expressjs.com/en/api.html
 *   Node.js fs promises API: https://nodejs.org/api/fs.html#promises-api
 *   Node.js path.join: https://nodejs.org/api/path.html#pathjoinpaths
 */

import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

// ES modules have no __dirname; build it from this file's URL.
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const router = express.Router();

// Reference: https://nodejs.org/api/modules.html#__dirname
// This file is inside routes/, so '..' goes up one folder to reach data/.
const MESSAGES_FILE = path.join(__dirname, '..', 'data', 'messages.json');

/**
 * Reads the saved chat history. A missing or corrupted file returns an empty list.
 * Reference: https://nodejs.org/api/fs.html#fspromisesreadfilepath-options
 * Reference: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/parse
 */
async function readMessages() {
  try {
    return JSON.parse(await fs.readFile(MESSAGES_FILE, 'utf8'));
  } catch {
    return [];
  }
}

/**
 * Saves the chat history, creating the data/ folder first if it doesn't exist.
 * Reference: https://nodejs.org/api/fs.html#fspromisesmkdirpath-options
 * Reference: https://nodejs.org/api/fs.html#fspromiseswritefilefile-data-options
 */
async function writeMessages(messages) {
  await fs.mkdir(path.dirname(MESSAGES_FILE), { recursive: true });
  await fs.writeFile(MESSAGES_FILE, JSON.stringify(messages, null, 2), 'utf8');
}

/**
 * GET /api/messages - sends back the whole chat history.
 * Reference: https://expressjs.com/en/api.html#res.json
 */
router.get('/', async (req, res) => {
  res.json(await readMessages());
});

/**
 * POST /api/messages - checks the text, saves the message, and returns it
 * with status 201 (Created).
 */
router.post('/', async (req, res) => {
  const { text, sender, recipient } = req.body;

  // Reference: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/400
  if (!text || typeof text !== 'string' || text.trim() === '') {
    return res.status(400).json({ error: 'Message text cannot be empty.' });
  }
  if (text.length > 500) {
    return res.status(400).json({ error: 'Message exceeds the 500 character limit.' });
  }

  try {
    const messages = await readMessages();
    const newMessage = {
      id: Date.now().toString(),
      sender: sender || 'Shipper',
      recipient: recipient || 'Carrier',
      text: text.trim(),
      timestamp: new Date().toISOString(),
    };
    messages.push(newMessage);
    await writeMessages(messages);

    // Reference: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/201
    res.status(201).json({ message: 'Message saved successfully.', data: newMessage });
  } catch (error) {
    // Reference: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/500
    console.error('Error saving message:', error);
    res.status(500).json({ error: 'Failed to save message.' });
  }
});

/**
 * DELETE /api/messages - clears the chat history by saving an empty list.
 * Reference: https://expressjs.com/en/api.html#router.METHOD
 */
router.delete('/', async (req, res) => {
  try {
    await writeMessages([]);
    res.status(200).json({ message: 'All messages deleted successfully.' });
  } catch (error) {
    console.error('Error deleting messages:', error);
    res.status(500).json({ error: 'Failed to delete messages.' });
  }
});

export default router;