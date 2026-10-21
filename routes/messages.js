/**
 * Message routes, mounted in server.js at /api/messages.
 *
 *   GET    /api/messages  - returns the saved chat history (used by messages.html)
 *   POST   /api/messages  - validates and saves one message ({ text, sender, recipient })
 *   DELETE /api/messages  - clears the chat history
 *
 * The history lives in data/messages.json and is read and written through
 * lib/json-store.js: a save goes through a temp file and a rename, a damaged
 * file is set aside instead of breaking every request, and saves run one at
 * a time so two messages sent together are both kept.
 *
 * References:
 *   Express routing and express.Router: https://expressjs.com/en/guide/routing.html#express-router
 *   Express API (req.body, res.json, res.status): https://expressjs.com/en/api.html
 */

import express from 'express';
import { dataFile, isPlainObject, queue, readJson, writeJson } from '../lib/json-store.js';

const router = express.Router();

// data/messages.json, or the file in MESSAGES_FILE when set (the tests set it).
const messagesFile = dataFile('MESSAGES_FILE', 'messages.json');

// Each save reads the whole file and writes it back, so saves run one at a time.
const oneAtATime = queue();

const MAX_TEXT = 500;
const MAX_NAME = 100;

/** GET /api/messages - sends back the whole chat history. */
router.get('/', async (req, res) => {
  try {
    const messages = await readJson(messagesFile(), []);
    res.json(Array.isArray(messages) ? messages : []);
  } catch (error) {
    console.error('Error reading messages:', error);
    res.status(500).json({ error: 'Failed to read messages.' });
  }
});

/**
 * POST /api/messages - checks the request, saves the message, and returns it
 * with status 201 (Created). Anything wrongly shaped gets a 400 and a JSON error.
 */
router.post('/', async (req, res) => {
  if (!isPlainObject(req.body)) {
    return res.status(400).json({ error: 'Send the message as a JSON object.' });
  }

  const { text, sender, recipient } = req.body;

  if (typeof text !== 'string' || text.trim() === '') {
    return res.status(400).json({ error: 'Message text cannot be empty.' });
  }
  if (text.length > MAX_TEXT) {
    return res.status(400).json({ error: 'Message exceeds the 500 character limit.' });
  }
  for (const [name, value] of [['sender', sender], ['recipient', recipient]]) {
    if (value != null && (typeof value !== 'string' || value.length > MAX_NAME)) {
      return res.status(400).json({ error: `${name} must be text of at most ${MAX_NAME} characters.` });
    }
  }

  try {
    const newMessage = await oneAtATime(async () => {
      const messages = await readJson(messagesFile(), []);
      const entry = {
        id: Date.now().toString(),
        sender: sender?.trim() || 'Shipper',
        recipient: recipient?.trim() || 'Carrier',
        text: text.trim(),
        timestamp: new Date().toISOString(),
      };
      await writeJson(messagesFile(), [...(Array.isArray(messages) ? messages : []), entry]);
      return entry;
    });

    res.status(201).json({ message: 'Message saved successfully.', data: newMessage });
  } catch (error) {
    console.error('Error saving message:', error);
    res.status(500).json({ error: 'Failed to save message.' });
  }
});

/** DELETE /api/messages - clears the chat history by saving an empty list. */
router.delete('/', async (req, res) => {
  try {
    await oneAtATime(() => writeJson(messagesFile(), []));
    res.status(200).json({ message: 'All messages deleted successfully.' });
  } catch (error) {
    console.error('Error deleting messages:', error);
    res.status(500).json({ error: 'Failed to delete messages.' });
  }
});

export default router;