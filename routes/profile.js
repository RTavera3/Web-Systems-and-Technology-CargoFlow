/**
 * Account profile, mounted in server.js at /api/profile.
 *
 *   GET /api/profile  - the shipper's account details (the demo account
 *                       until it has been edited)
 *   PUT /api/profile  - checks and saves the details from pages/profile.html
 *
 * There are no real accounts yet, so the site has one profile, saved in
 * data/profile.json. It is used by:
 *   - pages/profile.html, which shows and edits it,
 *   - js/booking-details.js, which fills step 4's account owner details,
 *   - js/payment.js, which starts on the preferred payment method.
 *
 * Reference: https://expressjs.com/en/api.html#router.METHOD
 */

import express from "express";
import { dataFile, isPlainObject, queue, readJson, text, writeJson } from "../lib/json-store.js";

const router = express.Router();
const profileFile = dataFile("PROFILE_FILE", "profile.json");
const oneAtATime = queue();

/** The demo account used until the profile is edited. */
export const DEFAULT_PROFILE = Object.freeze({
  userId: "BC0001",
  name: "Juan Dela Cruz",
  accountType: "Individual shipper",
  companyName: "",
  email: "",
  contact: "0999-123-4567",
  streetAddress: "123 Rizal Street, Barangay 143",
  city: "Quezon City",
  province: "Metro Manila",
  zipCode: "1100",
  emergencyContact: "",
  preferredPayment: "",
  notifications: "Email and SMS",
  memberSince: "",
});

// The fields pages/profile.html edits. userId and memberSince are kept by the server.
const EDITABLE = [
  "name", "accountType", "companyName", "email", "contact", "emergencyContact",
  "streetAddress", "city", "province", "zipCode", "preferredPayment", "notifications",
];
const REQUIRED = ["name", "contact", "streetAddress", "city", "province", "zipCode"];
const MAX_LENGTH = 200;

/** The saved profile, with any missing field filled from DEFAULT_PROFILE. */
async function readProfile() {
  const saved = await readJson(profileFile(), {});
  return { ...DEFAULT_PROFILE, ...(isPlainObject(saved) ? saved : {}) };
}

router.get("/", async (req, res) => {
  try {
    res.json(await readProfile());
  } catch (error) {
    console.error("Error reading profile:", error);
    res.status(500).json({ error: "Failed to read the profile." });
  }
});

router.put("/", async (req, res) => {
  const changes = {};
  const errors = [];
  for (const field of EDITABLE) {
    const value = text(req.body?.[field]);
    if (REQUIRED.includes(field) && !value) {
      errors.push({ field, message: `Enter the ${field}.` });
    } else if (value.length > MAX_LENGTH) {
      errors.push({ field, message: `The ${field} can be at most ${MAX_LENGTH} characters.` });
    }
    changes[field] = value;
  }
  if (errors.length) {
    return res.status(400).json({ error: errors[0].message, errors });
  }

  try {
    const saved = await oneAtATime(async () => {
      const profile = await readProfile();
      const updated = {
        ...profile,
        ...changes,
        // Recorded the first time the profile is saved.
        memberSince: profile.memberSince || new Date().toISOString(),
      };
      await writeJson(profileFile(), updated);
      return updated;
    });
    res.json(saved);
  } catch (error) {
    console.error("Error saving profile:", error);
    res.status(500).json({ error: "Failed to save the profile." });
  }
});

export default router;
