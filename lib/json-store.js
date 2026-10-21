/**
 * lib/json-store.js
 *
 * Small helpers for the routes that keep their data in a JSON file under
 * data/ (users, contact messages, the account profile):
 *   - dataFile() picks the file, which the tests can point elsewhere.
 *   - readJson() reads a file, or returns a fallback when it doesn't exist yet.
 *   - writeJson() saves a file, creating data/ first if needed.
 *   - queue() runs saves one at a time. Each save reads the whole file and
 *     writes it back, so two requests arriving together could otherwise
 *     overwrite each other (routes/bookings.js does the same).
 *
 * References:
 *   Node.js fs promises API: https://nodejs.org/api/fs.html#promises-api
 *   import.meta.url: https://nodejs.org/api/esm.html#importmetaurl
 */

import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

// ES modules have no __dirname; build it from this file's URL.
const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** A function returning data/<name>, or the file in `envVar` when set (the tests set it). */
export function dataFile(envVar, name) {
  return () => process.env[envVar] || path.join(__dirname, "..", "data", name);
}

/** The parsed file, or `fallback` when it doesn't exist yet or is empty. */
export async function readJson(file, fallback) {
  try {
    return JSON.parse((await fs.readFile(file, "utf8")) || "null") ?? fallback;
  } catch (error) {
    if (error.code === "ENOENT") return fallback;
    throw error;
  }
}

/** Saves `value` as JSON, creating the folder first if it doesn't exist. */
export async function writeJson(file, value) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, JSON.stringify(value, null, 2), "utf8");
}

/** A function that runs the tasks given to it one at a time, in order. */
export function queue() {
  let last = Promise.resolve();
  return (task) => {
    const run = last.then(task);
    last = run.catch(() => {});
    return run;
  };
}

/** A plain object (not null, not an array). */
export const isPlainObject = (value) =>
  value !== null && typeof value === "object" && !Array.isArray(value);

/** `value` trimmed when it's a string, else "". */
export const text = (value) => (typeof value === "string" ? value.trim() : "");
