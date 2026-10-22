import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { readJson, writeJson, queue } from "../lib/json-store.js";

async function tempFile() {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "cargoflow-"));
  return path.join(dir, "data.json");
}

test("returns the fallback when the file does not exist", async () => {
  const file = await tempFile();
  assert.deepEqual(await readJson(file, []), []);
});

test("returns the fallback for an empty file", async () => {
  const file = await tempFile();
  await fs.writeFile(file, "", "utf8");
  assert.deepEqual(await readJson(file, []), []);
});

test("saves data, reads it back, and leaves no temp files behind", async () => {
  const file = await tempFile();
  await writeJson(file, [{ id: 1 }]);

  assert.deepEqual(await readJson(file, []), [{ id: 1 }]);
  assert.deepEqual(await fs.readdir(path.dirname(file)), ["data.json"]);
});

test("data saved earlier is still there when read again, as after a restart", async () => {
  const file = await tempFile();
  await writeJson(file, [{ id: 1 }, { id: 2 }]);

  // readJson keeps nothing in memory, so this reads only what is on disk.
  assert.deepEqual(await readJson(file, []), [{ id: 1 }, { id: 2 }]);
});

test("a corrupted file is moved aside, the fallback is returned, and saving works again", async () => {
  const file = await tempFile();
  await fs.writeFile(file, '[{"id": 1}, {"id"', "utf8");

  assert.deepEqual(await readJson(file, []), []);

  const files = await fs.readdir(path.dirname(file));
  assert.equal(files.length, 1);
  assert.match(files[0], /^data\.json\.corrupt-/);

  await writeJson(file, [{ id: 2 }]);
  assert.deepEqual(await readJson(file, []), [{ id: 2 }]);
});

test("a failed save keeps the old data and removes its temp file", async () => {
  const file = await tempFile();
  await fs.mkdir(file); // a folder where the file should be, so the rename fails

  await assert.rejects(writeJson(file, [{ id: 1 }]));
  assert.deepEqual(await fs.readdir(path.dirname(file)), ["data.json"]);
});

test("queued saves run one after another and none is lost", async () => {
  const file = await tempFile();
  const run = queue();

  await Promise.all(
    Array.from({ length: 20 }, (_, i) =>
      run(async () => {
        const items = await readJson(file, []);
        items.push(i);
        await writeJson(file, items);
      }),
    ),
  );

  const items = await readJson(file, []);
  assert.deepEqual(
    [...items].sort((a, b) => a - b),
    Array.from({ length: 20 }, (_, i) => i),
  );
});

test("with quarantine off, a damaged file is left alone and the error is thrown", async () => {
  const file = await tempFile();
  const broken = '[{"id": 1}, {"id"';
  await fs.writeFile(file, broken, "utf8");

  await assert.rejects(readJson(file, [], { quarantine: false }), SyntaxError);

  assert.equal(await fs.readFile(file, "utf8"), broken);
  assert.deepEqual(await fs.readdir(path.dirname(file)), ["data.json"]);
});