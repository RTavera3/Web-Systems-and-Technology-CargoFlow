/**
 * lib/json-store.js
 *
 * Small helpers for the routes that keep their data in a JSON file under
 * data/ (users, contact messages, the account profile):
 *   - dataFile() picks the file, which the tests can point elsewhere.
 *   - readJson() reads a file, or returns a fallback when it doesn't exist
 *     yet or is empty. If the file is damaged (not valid JSON, for example
 *     after a crash cut a write short), it moves the broken copy aside as
 *     <name>.corrupt-<time> and returns the fallback, so the server keeps
 *     running instead of failing every request.
 *     Pass { quarantine: false } for files that people edit by hand, so a
 *     typo is reported and the file is left alone.
 *   - writeJson() saves a file, creating data/ first if needed. It writes to
 *     a temp file in the same folder and then renames it over the real file,
 *     so a crash leaves either the old complete file or the new complete
 *     one, never half of a write. The temp file has to be in the same
 *     folder, because a rename only replaces a file in one step when both
 *     paths are on the same drive.
 *   - queue() runs saves one at a time. Each save reads the whole file and
 *     writes it back, so two requests arriving together could otherwise
 *     overwrite each other (routes/bookings.js does the same).
 *
 * References:
 *   Node.js fs promises API: https://nodejs.org/api/fs.html#promises-api
 *   fs.rename: https://nodejs.org/api/fs.html#fspromisesrenameoldpath-newpath
 *   import.meta.url: https://nodejs.org/api/esm.html#importmetaurl
 */

import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { randomUUID } from "crypto";

// ES modules have no __dirname; build it from this file's URL.
const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** A function returning data/<name>, or the file in `envVar` when set (the tests set it). */
export function dataFile(envVar, name) {
  return () => process.env[envVar] || path.join(__dirname, "..", "data", name);
}

/**
 * The parsed file, or `fallback` when it is missing, empty or damaged.
 * A damaged file is moved aside and `fallback` returned, unless `quarantine`
 * is false: then the SyntaxError is thrown and the file is left alone. Use
 * that for files people edit by hand (data/users.json), where silently
 * starting from the fallback would hide a typo.
 */
export async function readJson(file, fallback, { quarantine = true } = {}) {
  let raw;
  try {
    raw = await fs.readFile(file, "utf8");
  } catch (error) {
    if (error.code === "ENOENT") return fallback;
    throw error;
  }

  try {
    return JSON.parse(raw || "null") ?? fallback;
  } catch (error) {
    if (!(error instanceof SyntaxError) || !quarantine) throw error;
    // The file is damaged, for example a crash cut a write short. Keep the
    // broken copy for inspection and carry on from the fallback.
    await fs.rename(file, `${file}.corrupt-${Date.now()}`).catch(() => {});
    console.error(`${file} was not valid JSON. Moved it aside and started fresh.`);
    return fallback;
  }
}

/** Saves `value` as JSON, creating the folder first if it doesn't exist. */
export async function writeJson(file, value) {
  const dir = path.dirname(file);
  await fs.mkdir(dir, { recursive: true });

  // Write to a temp file in the same folder, then rename it over the real
  // one. A rename replaces the file in a single step, so a crash leaves the
  // old complete file or the new complete file, never half of a write.
  const temp = path.join(dir, `.${path.basename(file)}.${randomUUID()}.tmp`);
  try {
    await fs.writeFile(temp, JSON.stringify(value, null, 2), "utf8");
    await fs.rename(temp, file);
  } catch (error) {
    await fs.rm(temp, { force: true });
    throw error;
  }
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
