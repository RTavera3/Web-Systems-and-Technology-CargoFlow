/**
 * Connect to Carrier / Messages page.
 *
 * A simulated chat with a carrier ("LBC Express"): every message the user
 * sends gets a canned auto-reply after a short "typing..." delay. There is
 * no backend or real carrier on the other end - chat history is persisted
 * entirely in `localStorage` (key "chatMessages") so it survives a page
 * reload, and can be wiped with the trash-icon "clear chat" control.
 */

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
 * Reads and parses the saved chat history from localStorage.
 * @returns {{text: string, messageType: string, time: string}[]} The
 *   saved messages in send order, or an empty array if nothing is saved
 *   or the saved value can't be parsed as JSON.
 */
function getStoredMessages() {
  const saved = localStorage.getItem('chatMessages');
  if (!saved) {
    return [];
  }
  try {
    return JSON.parse(saved);
  } catch (error) {
    // Malformed JSON (e.g. hand-edited in DevTools) would otherwise throw
    // here and stop the rest of this script from running, silently
    // breaking Enter-to-send since its listener is registered after
    // loadMessages(). Fall back to an empty history and clear the bad
    // entry so it does not keep failing on every reload.
    console.warn('Could not parse stored chat messages, resetting history.', error);
    localStorage.removeItem('chatMessages');
    return [];
  }
}

/**
 * Appends one message to the saved chat history in localStorage.
 * @param {string} text The message body.
 * @param {string} messageType Either "incoming" (from the carrier) or
 *   "outgoing" (from the user) - matches the CSS class used to style it.
 * @param {string} time Pre-formatted display time for this message.
 */
function saveMessage(text, messageType, time) {
  const currentMessages = getStoredMessages();
  currentMessages.push({ text: text, messageType: messageType, time: time });
  localStorage.setItem('chatMessages', JSON.stringify(currentMessages));
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
 *   localStorage. Set to false when replaying history on load (via
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
 * Wipes the entire chat history: clears localStorage, empties the chat
 * window, and resets the sidebar preview text. Triggered by the trash
 * icon after a confirmation prompt.
 */
function clearChat() {
  localStorage.removeItem('chatMessages');
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

// Search Bar Filtering Listener
// Live-filters the visible messages as the user types, by hiding any
// message bubble whose text doesn't contain the search term.
const searchInput = document.querySelector('input[placeholder*="Search"]') ||
                    document.querySelector('.search-bar input');

if (searchInput) {
  searchInput.addEventListener('input', function (e) {
    const searchTerm = e.target.value.toLowerCase();
    const allMessages = messagesContainer.querySelectorAll('.message');

    allMessages.forEach(function (msg) {
      const p = msg.querySelector('p');
      if (p) {
        const text = p.textContent.toLowerCase();
        msg.style.display = text.includes(searchTerm) ? 'flex' : 'none';
      }
    });
  });
}

// Initialize messages on page load
loadMessages();
