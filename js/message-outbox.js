/**
 * js/message-outbox.js
 *
 * Chat messages written while the server can't be reached wait here, in the
 * browser's localStorage under "cargoflow_message_outbox", so they survive a
 * reload or leaving the page. js/messages.js sends them when the server is
 * back and removes each one once it is delivered.
 *
 * Everything else the site saves (bookings, the profile, the chat history)
 * lives on the Express server; this is the one thing kept in the browser,
 * because it exists only for the time the server is unavailable.
 *
 * Reference: https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage
 */

const OUTBOX_KEY = 'cargoflow_message_outbox';

/** A plain object (not null, not an array). */
function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/**
 * The saved outbox. Returns an empty list when storage is unavailable or the
 * saved value is not valid JSON (a damaged value is removed so it does not
 * fail again on every page load).
 */
function readOutbox() {
  let raw;
  try {
    raw = localStorage.getItem(OUTBOX_KEY);
  } catch (error) {
    console.warn('Storage is unavailable; the message outbox is empty.', error);
    return [];
  }
  if (raw === null) return [];
  try {
    return JSON.parse(raw);
  } catch (error) {
    console.warn('The saved message outbox was not valid JSON and has been reset.', error);
    try {
      localStorage.removeItem(OUTBOX_KEY);
    } catch {
      // Nothing to clean up if storage is unavailable.
    }
    return [];
  }
}

/**
 * Saves the outbox.
 * @returns {boolean} false if it could not be saved (storage full or blocked).
 */
function writeOutbox(messages) {
  try {
    localStorage.setItem(OUTBOX_KEY, JSON.stringify(messages));
    return true;
  } catch (error) {
    console.warn('Could not save the message outbox.', error);
    return false;
  }
}

/**
 * Outgoing messages waiting for server delivery.
 * @returns {Array<{id: string, conversationId: string, text: string, sender: string, recipient: string, timestamp: string, status: string}>}
 */
export function getPendingMessages() {
  const messages = readOutbox();
  return Array.isArray(messages)
    ? messages.filter((message) =>
        isPlainObject(message)
        && typeof message.id === 'string'
        && typeof message.conversationId === 'string'
        && typeof message.text === 'string',
      )
    : [];
}

/**
 * Adds or updates one outbox message.
 * @param {object} pendingMessage
 * @returns {boolean} false if browser storage could not save the outbox.
 */
export function savePendingMessage(pendingMessage) {
  if (!pendingMessage || typeof pendingMessage.id !== 'string') {
    throw new TypeError('savePendingMessage needs a message ID.');
  }
  const messages = getPendingMessages();
  const index = messages.findIndex((message) => message.id === pendingMessage.id);
  if (index === -1) messages.push(pendingMessage);
  else messages[index] = pendingMessage;
  return writeOutbox(messages);
}

/** Removes one delivered or discarded message from the outbox. */
export function removePendingMessage(id) {
  return writeOutbox(getPendingMessages().filter((message) => message.id !== id));
}

/** Discards only queued messages belonging to one conversation. */
export function clearPendingMessages(conversationId) {
  return writeOutbox(getPendingMessages().filter((message) => message.conversationId !== conversationId));
}
