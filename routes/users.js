/**
 * User directory, mounted in server.js at /api/users.
 *
 *   GET /api/users      - every user's ID and name, for the booking form's
 *                         User ID suggestions
 *   GET /api/users/:id  - one user's saved details, which the booking form
 *                         fills into the sender or receiver address
 *
 * The users are in data/users.json, which the browser can't load directly,
 * so it only ever gets everyone's names, and one person's details at a time.
 *
 * Reference: https://expressjs.com/en/guide/routing.html#express-router
 */

import express from "express";
import { dataFile, readJson } from "../lib/json-store.js";

const router = express.Router();
const usersFile = dataFile("USERS_FILE", "users.json");

// "BC" plus 4 digits, e.g. BC0001.
const USER_ID_PATTERN = /^BC\d{4}$/;

async function readUsers() {
  const users = await readJson(usersFile(), []);
  return Array.isArray(users) ? users : [];
}

router.get("/", async (req, res) => {
  try {
    const users = await readUsers();
    res.json(users.map(({ userId, name }) => ({ userId, name })));
  } catch (error) {
    console.error("Error reading users:", error);
    res.status(500).json({ error: "Failed to read users." });
  }
});

router.get("/:id", async (req, res) => {
  const id = req.params.id.trim().toUpperCase();
  if (!USER_ID_PATTERN.test(id)) {
    return res.status(400).json({ error: "User ID must look like BC0001." });
  }

  try {
    const user = (await readUsers()).find((u) => String(u.userId).toUpperCase() === id);
    if (!user) return res.status(404).json({ error: "User ID not found." });
    res.json(user);
  } catch (error) {
    console.error("Error reading users:", error);
    res.status(500).json({ error: "Failed to read users." });
  }
});

export default router;
