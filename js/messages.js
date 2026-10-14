/**
 * Connect to Carrier / Messages page.
 *
 * A simulated chat with a carrier ("LBC Express"): every message the user
 * sends gets a canned auto-reply after a short "typing..." delay. There is
 * no backend or real carrier on the other end - chat history is saved in
 * the browser through js/storage.js (key "chatMessages") so it survives a
 * page reload, and can be wiped with the trash-icon "clear chat" control.
 */

import { getMessages, addMessage as storeMessage, clearMessages } from './storage.js';

// Select the chat elements we need to use.
/** @type {HTMLInputElement} The message composer text input. */
const messageInput = document.querySelector('.message-input');
/** @type {HTMLButtonElement} The paper-plane "send" button. */
const sendButton = document.querySelector('.send-btn');
/** @type {HTMLElement} Scrollable container holding all message bubbles. */
const messagesContainer = document.querySelector('.messages-container');

/**
 * Gets the current time as a short display string (e.g. "10:30 AM"),
 * stamped onto each message bubble.
 * @returns {string}
 */
function getCurrentFormattedTime() {
  const now = new Date();
  return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// Storage helpers as advised during mentoring session - MDN WebDocs

/**
 * Reads the saved chat history. js/storage.js returns an empty array when
 * nothing is saved or the saved value is corrupted (and resets it), so a bad
 * value can never stop the rest of this script, such as Enter-to-send, from
 * running.
 * @returns {{text: string, messageType: string, time: string}[]} The saved
 *   messages in send order.
 */
function getStoredMessages() {
  return getMessages();
}

/**
 * Appends one message to the saved chat history.
 * @param {string} text The message body.
 * @param {string} messageType Either "incoming" (from the carrier) or
 *   "outgoing" (from the user) - matches the CSS class used to style it.
 * @param {string} time Pre-formatted display time for this message.
 */
function saveMessage(text, messageType, time) {
  storeMessage({ text: text, messageType: messageType, time: time });
}

/**
 * Replays every saved message into the chat window on page load, without
 * re-saving them (they're already in storage).
 */
function loadMessages() {
  const storedMessages = getStoredMessages();
  storedMessages.forEach(function (msg) {
    const msgTime = msg.time || getCurrentFormattedTime();
    addMessage(msg.text, msg.messageType, false, msgTime);
  });
}

/**
 * Updates the conversation list's preview snippet (in the sidebar) to
 * show the most recent message. Tries a few different selectors since the
 * sidebar markup has varied across page revisions.
 * @param {string} latestText The message text to show as the preview.
 */
function updateSidebarPreview(latestText) {
  // Finds the preview text in left sidebar conversation item
  const sidebarPreview = document.querySelector('.conversation-item p') ||
                         document.querySelector('.sidebar p') ||
                         document.querySelector('aside p');
  if (sidebarPreview) {
    sidebarPreview.textContent = latestText;
  }
}

//Typing indicator functions

/**
 * Inserts a temporary "LBC Express is typing..." bubble at the bottom of
 * the chat, used while the fake auto-reply delay is running.
 */
function showTypingIndicator() {
  const typingDiv = document.createElement('div');
  typingDiv.className = 'message incoming typing-indicator';
  typingDiv.id = 'typing-status';
  typingDiv.innerHTML = `
    <div class="avatar bg-navy message-avatar">L</div>
    <div class="message-content"><p><i>LBC Express is typing...</i></p></div>
  `;
  messagesContainer.appendChild(typingDiv);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

/** Removes the "typing..." bubble added by `showTypingIndicator`, if present. */
function removeTypingIndicator() {
  const indicator = document.getElementById('typing-status');
  if (indicator) indicator.remove();
}

//Chat functions.

/**
 * Builds and appends one message bubble to the chat window, then scrolls
 * to the bottom so the newest message is visible.
 *
 * @param {string} text The message body to display.
 * @param {string} messageType "incoming" or "outgoing" - controls bubble
 *   alignment/color and whether an avatar is shown.
 * @param {boolean} [shouldSave=true] Whether to persist this message to
 *   saved history (js/storage.js). Set to false when replaying history on load (via
 *   `loadMessages`) so it isn't duplicated in storage.
 * @param {string|null} [formattedTime=null] A pre-formatted time to show
 *   instead of the current time - used when replaying a saved message so
 *   it keeps its original timestamp instead of getting "now".
 */
function addMessage(text, messageType, shouldSave = true, formattedTime = null) {
  const message = document.createElement('div');
  const messageContent = document.createElement('div');
  const messageText = document.createElement('p');
  const messageTime = document.createElement('span');

  const timeToDisplay = formattedTime || getCurrentFormattedTime();

  // Add the same classes used by the messages already in the HTML.
  message.className = 'message ' + messageType;
  messageContent.className = 'message-content';
  messageText.textContent = text;
  messageTime.className = 'time';
  messageTime.textContent = timeToDisplay;

  // Put the text and time inside the message, then add it to the chat.
  messageContent.appendChild(messageText);
  messageContent.appendChild(messageTime);

  if (messageType === 'incoming') {
    const avatar = document.createElement('div');
    avatar.className = 'avatar bg-navy message-avatar';
    avatar.textContent = 'L';
    message.appendChild(avatar);
  }

  message.appendChild(messageContent);
  messagesContainer.appendChild(message);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;

  // Update sidebar preview on every message
  updateSidebarPreview(text);

  if (shouldSave) {
    saveMessage(text, messageType, timeToDisplay);
  }
}

/**
 * Sends whatever is currently typed in the composer: adds it as an
 * outgoing message, clears the input, then simulates the carrier "typing"
 * for 1.5s before posting a fixed auto-reply. Does nothing if the input
 * is empty/whitespace-only.
 */
function sendMessage() {
  const text = messageInput.value.trim();
  if (text === '') return;
  addMessage(text, 'outgoing');
  messageInput.value = '';

  showTypingIndicator();

  setTimeout(function () {
    removeTypingIndicator();
    addMessage('Hello! Your shipment is currently in transit to Cebu and on schedule.', 'incoming');
  }, 1500);

}

/**
 * Wipes the entire chat history: clears the saved history, empties the chat
 * window, and resets the sidebar preview text. Triggered by the trash
 * icon after a confirmation prompt.
 */
function clearChat() {
  clearMessages();
  messagesContainer.innerHTML = '';

  const sidebarPreview = document.querySelector('.preview-text');
  if (sidebarPreview) {
    sidebarPreview.textContent = 'No messages yet';
  }
}

sendButton.addEventListener('click', sendMessage);

//Event listeners for sending messages and clearing chat history.
// Send triggers
if (sendButton) sendButton.addEventListener('click', sendMessage);

// Enter key also sends, same as clicking the send button.
messageInput.addEventListener('keydown', function (event) {
  if (event.key === 'Enter') {
    sendMessage();
  }
});

// Clear Button / Trash Icon Listener
const trashIcon = document.querySelector('.fa-trash') ||
                  document.querySelector('button[title*="Delete"]') ||
                  document.querySelector('#clear-btn');

if (trashIcon) {
  trashIcon.addEventListener('click', function () {
    if (confirm('Are you sure you want to clear this conversation history?')) {
      clearChat();
    }
  });
}

// Initialize messages on page load
loadMessages();
