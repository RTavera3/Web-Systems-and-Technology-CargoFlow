/**
 * Contact form, mounted in server.js at /api/contact.
 *
 *   POST /api/contact - checks and saves one message from pages/contact.html
 *                       ({ name, email, message }) to data/contact-messages.json
 *
 * References:
 *   Express routing: https://expressjs.com/en/guide/routing.html#express-router
 *   400 Bad Request: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/400
 */

import express from "express";
import { randomUUID } from "crypto";
import { dataFile, queue, readJson, text, writeJson } from "../lib/json-store.js";

const router = express.Router();
const contactFile = dataFile("CONTACT_FILE", "contact-messages.json");
const oneAtATime = queue();

const LIMITS = { name: 100, email: 254, message: 2000 };
// something@something.something, the same check as the browser's type="email".
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** The cleaned fields and every problem with them, as { field, message }. */
export function validateContact(body) {
  const fields = {
    name: text(body?.name),
    email: text(body?.email),
    message: text(body?.message),
  };
  const errors = [];
  for (const [field, value] of Object.entries(fields)) {
    if (!value) {
      errors.push({ field, message: `Enter your ${field}.` });
    } else if (value.length > LIMITS[field]) {
      errors.push({ field, message: `Your ${field} can be at most ${LIMITS[field]} characters.` });
    }
  }
  if (fields.email && fields.email.length <= LIMITS.email && !EMAIL_PATTERN.test(fields.email)) {
    errors.push({ field: "email", message: "Enter a valid email address." });
  }
  return { fields, errors };
}

router.post("/", async (req, res) => {
  const { fields, errors } = validateContact(req.body);
  if (errors.length) {
    return res.status(400).json({ error: errors[0].message, errors });
  }

  try {
    const saved = await oneAtATime(async () => {
      const messages = await readJson(contactFile(), []);
      const entry = { id: randomUUID(), ...fields, receivedAt: new Date().toISOString() };
      await writeJson(contactFile(), [...(Array.isArray(messages) ? messages : []), entry]);
      return entry;
    });
    res.status(201).json({ message: "Message sent.", data: { id: saved.id } });
  } catch (error) {
    console.error("Error saving contact message:", error);
    res.status(500).json({ error: "Failed to send your message." });
  }
});

export default router;
