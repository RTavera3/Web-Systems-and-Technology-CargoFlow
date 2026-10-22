/**
 * Message routes, mounted in server.js at /api/messages.
 *
 * Each booking has its own conversation, named by its booking code
 * (conversationId, e.g. "CF-24810293"):
 *
 *   GET    /api/messages?conversationId=CF-...  - one booking's chat history
 *                                                 (no conversationId: every message)
 *   POST   /api/messages  - validates and saves one message
 *                           ({ conversationId, clientMessageId, text, sender, recipient })
 *   DELETE /api/messages?conversationId=CF-...  - clears one booking's chat history
 *                                                 (no conversationId: every message)
 *
 * Messages saved before conversations existed have no conversationId; they
 * belong to the demo booking's conversation (DEMO_CONVERSATION).
 *
 * clientMessageId is the browser's own ID for a message. A message sent
 * again with the same clientMessageId (js/messages.js retries one that may
 * have reached the server before the connection dropped) is not saved
 * twice: the saved one comes back with "duplicate": true.
 *
 * The history lives in data/messages.json and is read and written through
 * lib/json-store.js: a save goes through a temp file and a rename, a damaged
 * file is set aside instead of breaking every request, and saves run one at
 * a time so two messages sent together are both kept.
 *
 * References:
 *   Express routing and express.Router: https://expressjs.com/en/guide/routing.html#express-router
 *   Express API (req.body, req.query, res.json, res.status): https://expressjs.com/en/api.html
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
const MAX_CONVERSATION_ID = 64;
const MAX_CLIENT_ID = 128;

/** The demo booking; messages saved before conversations existed belong to it. */
const DEMO_CONVERSATION = 'CF-24810293';

/** A conversationId as it is saved: trimmed and upper-case. "" when not text. */
const normalizeConversation = (value) => (typeof value === 'string' ? value.trim().toUpperCase() : '');

/** Whether a saved message is part of `conversationId`'s conversation. */
const inConversation = (message, conversationId) =>
  (message.conversationId || DEMO_CONVERSATION) === conversationId;

/** The saved messages as a list (anything else in the file counts as none). */
async function readMessages() {
  const messages = await readJson(messagesFile(), []);
  return Array.isArray(messages) ? messages : [];
}

/**
 * GET /api/messages - sends back one conversation's history, or every
 * message when no conversationId is given.
 */
router.get('/', async (req, res) => {
  const conversationId = normalizeConversation(req.query.conversationId);
  try {
    const messages = await readMessages();
    res.json(conversationId ? messages.filter((m) => inConversation(m, conversationId)) : messages);
  } catch (error) {
    console.error('Error reading messages:', error);
    res.status(500).json({ error: 'Failed to read messages.' });
  }
});

/**
 * POST /api/messages - checks the request, saves the message, and returns it
 * with status 201 (Created), or the already-saved copy with status 200 when
 * its clientMessageId was sent before. Anything wrongly shaped gets a 400 and
 * a JSON error.
 */
router.post('/', async (req, res) => {
  if (!isPlainObject(req.body)) {
    return res.status(400).json({ error: 'Send the message as a JSON object.' });
  }

  const { text, sender, recipient, clientMessageId } = req.body;
  const conversationId = req.body.conversationId == null
    ? DEMO_CONVERSATION
    : normalizeConversation(req.body.conversationId);

  if (!conversationId || conversationId.length > MAX_CONVERSATION_ID) {
    return res.status(400).json({ error: 'A valid booking conversation is required.' });
  }
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
  if (clientMessageId != null
    && (typeof clientMessageId !== 'string' || clientMessageId.trim().length > MAX_CLIENT_ID)) {
    return res.status(400).json({ error: 'Invalid client message ID.' });
  }
  const clientId = clientMessageId?.trim() || '';

  try {
    const result = await oneAtATime(async () => {
      const messages = await readMessages();
      const existing = clientId && messages.find((m) => m.clientMessageId === clientId);
      if (existing) return { entry: existing, duplicate: true };

      const entry = {
        id: Date.now().toString(),
        ...(clientId ? { clientMessageId: clientId } : {}),
        conversationId,
        sender: sender?.trim() || 'Shipper',
        recipient: recipient?.trim() || 'Carrier',
        text: text.trim(),
        timestamp: new Date().toISOString(),
      };
      await writeJson(messagesFile(), [...messages, entry]);
      return { entry, duplicate: false };
    });

    if (result.duplicate) {
      return res.status(200).json({ message: 'Message was already saved.', data: result.entry, duplicate: true });
    }
    res.status(201).json({ message: 'Message saved successfully.', data: result.entry, duplicate: false });
  } catch (error) {
    console.error('Error saving message:', error);
    res.status(500).json({ error: 'Failed to save message.' });
  }
});

/**
 * DELETE /api/messages - clears one conversation's history, or every
 * message when no conversationId is given.
 */
router.delete('/', async (req, res) => {
  const conversationId = normalizeConversation(req.query.conversationId);
  try {
    await oneAtATime(async () => {
      const kept = conversationId
        ? (await readMessages()).filter((m) => !inConversation(m, conversationId))
        : [];
      await writeJson(messagesFile(), kept);
    });
    res.status(200).json({
      message: conversationId
        ? 'Conversation messages deleted successfully.'
        : 'All messages deleted successfully.',
    });
  } catch (error) {
    console.error('Error deleting messages:', error);
    res.status(500).json({ error: 'Failed to delete messages.' });
  }
});

export default router;
