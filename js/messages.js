/**
 * Connect to Carrier / Messages page.
 *
 * A simulated chat with a carrier ("LBC Express"): every message the user
 * sends gets a canned auto-reply after a short "typing..." delay. Chat
 * history is saved on the server (data/messages.json) through the
 * /api/messages routes in server.js, so it survives a page reload, and can
 * be wiped with the trash-icon "clear chat" control. Run the site with
 * `npm start` so these routes are available.
 */

// Express serves this page too, so the API is on the same host and port:
// relative URLs work wherever the server runs, not only localhost:3000.
const API_BASE_URL = '';

/** Longest message the server accepts (see POST /api/messages in server.js). */
const MAX_MESSAGE_LENGTH = 500;

// Select the chat elements we need to use.
/** @type {HTMLInputElement} The message composer text input. */
const messageInput = document.querySelector('.message-input');
/** @type {HTMLButtonElement} The paper-plane "send" button. */
const sendButton = document.querySelector('.send-btn');
/** @type {HTMLElement} Scrollable container holding all message bubbles. */
const messagesContainer = document.querySelector('.messages-container');
/** @type {HTMLElement} "0 / 500" counter under the composer. */
const messageCharacterCount = document.querySelector('#messageCharacterCount');
/** @type {HTMLElement} Status line for "Sending...", "Sent" and errors. */
const messageSendStatus = document.querySelector('#messageSendStatus');

/** True while a message is being sent, so it can't be sent twice. */
let isSending = false;

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
/**
 * Reference: https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch#supplying_options
 * Saves one message on the server (POST /api/messages).
 * @param {string} text The message body.
 * @param {string} messageType Either "incoming" (from the carrier) or
 *   "outgoing" (from the user) - matches the CSS class used to style it.
 * @returns {Promise<boolean>} Whether the server saved it.
 */
async function saveMessage(text, messageType) {
  try {
    const sender = messageType === 'outgoing' ? 'Shipper' : 'LBC Express';
    const response = await fetch(`${API_BASE_URL}/api/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: text, sender: sender, recipient: 'Carrier' })
    });
    if (!response.ok) throw new Error(`Server returned status ${response.status}`);
    return true;
  } catch (error) {
    console.error('Error posting message:', error);
    return false;
  }
}

/**
 * Shows a message on the status line under the composer.
 * @param {string} text Empty to clear it.
 * @param {boolean} [isError=false]
 */
function setSendStatus(text, isError = false) {
  messageSendStatus.textContent = text;
  messageSendStatus.classList.toggle('is-error', isError);
}

/**
 * Marks an outgoing bubble as not sent and adds a Retry button to it.
 * @param {HTMLElement} message The `.message` element.
 */
function markFailed(message) {
  message.classList.add('failed');
  message.querySelector('.time').textContent = 'Not sent';
  if (!message.querySelector('.message-retry-btn')) {
    const retryButton = document.createElement('button');
    retryButton.type = 'button';
    retryButton.className = 'message-retry-btn';
    retryButton.textContent = 'Retry';
    retryButton.setAttribute('aria-label', 'Retry sending this message');
    message.querySelector('.message-content').appendChild(retryButton);
  }
}

/**
 * Reference: https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch
 * Replays every saved message into the chat window on page load, without
 * re-saving them (they're already in storage).
 */
async function loadMessages() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/messages`);
    if (!response.ok) throw new Error('Failed to load messages.');
    const messages = await response.json();

    messagesContainer.innerHTML = '';
    messages.forEach(function (msg) {
      const displayTime = msg.timestamp
        ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : getCurrentFormattedTime();

      const messageType = msg.sender === 'Shipper' ? 'outgoing' : 'incoming';
      addMessage(msg.text, messageType, false, displayTime);
    });

    if (messages.length > 0) {
      updateSidebarPreview(messages[messages.length - 1].text);
    } else {
      updateSidebarPreview('No messages yet.');
    }
  } catch (error) {
    console.error('Error fetching messages:', error);
  }
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
 * @param {boolean} [shouldSave=true] Whether to save this message on the
 *   server. Set to false when replaying history on load (via
 *   `loadMessages`) so it isn't saved twice.
 * @param {string|null} [formattedTime=null] A pre-formatted time to show
 *   instead of the current time - used when replaying a saved message so
 *   it keeps its original timestamp instead of getting "now".
 * @returns {Promise<{message: HTMLElement, saved: boolean}>} The new bubble,
 *   and whether it was saved (always true when `shouldSave` is false).
 */
async function addMessage(text, messageType, shouldSave = true, formattedTime = null) {
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

  const saved = shouldSave ? await saveMessage(text, messageType) : true;
  return { message, saved };
}

/** Shows the carrier "typing..." for 1.5s, then posts the fixed auto-reply. */
function replyFromCarrier() {
  showTypingIndicator();
  setTimeout(async function () {
    removeTypingIndicator();
    await addMessage('Hello! Your shipment is currently in transit to Cebu and on schedule.', 'incoming');
  }, 1500);
}

/**
 * Sends whatever is currently typed in the composer: adds it as an
 * outgoing message, clears the input, then simulates the carrier "typing"
 * for 1.5s before posting a fixed auto-reply. Does nothing if the input
 * is empty/whitespace-only or a message is already sending. If the server
 * can't save it, the bubble is marked "Not sent" with a Retry button.
 */
async function sendMessage() {
  const text = messageInput.value.trim();
  if (text === '' || isSending) return;

  // The input's maxlength already stops longer messages; this is a backstop.
  if (text.length > MAX_MESSAGE_LENGTH) {
    setSendStatus(`Messages can be up to ${MAX_MESSAGE_LENGTH} characters.`, true);
    return;
  }

  isSending = true;
  setSendStatus('Sending…');
  updateComposer();
  try {
    const { message, saved } = await addMessage(text, 'outgoing');
    messageInput.value = '';
    if (saved) {
      setSendStatus('Sent');
      replyFromCarrier();
    } else {
      markFailed(message);
      setSendStatus("Couldn't send your message. Check that the server is running (npm start), then press Retry.", true);
    }
  } finally {
    isSending = false;
    updateComposer();
  }
}

/**
 * Sends a "Not sent" message again. On success the bubble goes back to
 * normal and the carrier replies.
 * @param {HTMLElement} message The failed `.message` element.
 */
async function retryMessage(message) {
  const retryButton = message.querySelector('.message-retry-btn');
  retryButton.disabled = true;
  retryButton.textContent = 'Retrying…';
  const text = message.querySelector('.message-content p').textContent;
  if (await saveMessage(text, 'outgoing')) {
    message.classList.remove('failed');
    message.querySelector('.time').textContent = getCurrentFormattedTime();
    retryButton.remove();
    setSendStatus('Sent');
    replyFromCarrier();
  } else {
    retryButton.disabled = false;
    retryButton.textContent = 'Retry';
    setSendStatus("Still couldn't send your message. Please try again.", true);
  }
}

/**
 * Updates the character counter, and enables Send only when there is
 * something to send and nothing is already sending.
 */
function updateComposer() {
  sendButton.disabled = isSending || messageInput.value.trim() === '';
  messageCharacterCount.textContent = `${messageInput.value.length} / ${MAX_MESSAGE_LENGTH}`;
}

/**
 * Reference: https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch#supplying_options
 * Wipes the entire chat history: deletes it on the server, empties the chat
 * window, and resets the sidebar preview text. Triggered by the trash
 * icon after a confirmation prompt.
 */
async function clearChat() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/messages`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error(`Server returned status ${response.status}`);
    }

    const result = await response.json();
    console.log(result.message);

    // Clear the message container on screen
    if (messagesContainer) {
      messagesContainer.innerHTML = '';
    }

    // Reset the sidebar preview snippet
    updateSidebarPreview('No messages yet.');

  } catch (error) {
    console.error('Failed to clear chat:', error);
  }
}

//Event listeners for sending messages and clearing chat history.
// Send triggers
// Event listeners for sending messages and clearing chat history.
document.addEventListener('DOMContentLoaded', () => {
  // Send button click trigger
  if (sendButton) {
    sendButton.addEventListener('click', sendMessage);
  }

  // Enter key trigger
  if (messageInput) {
    messageInput.addEventListener('keydown', function (event) {
      if (event.key === 'Enter') {
        event.preventDefault();
        sendMessage();
      }
    });
    messageInput.addEventListener('input', () => {
      setSendStatus('');
      updateComposer();
    });
    updateComposer();
  }

  // Retry buttons on "Not sent" messages
  messagesContainer.addEventListener('click', (event) => {
    const retryButton = event.target.closest('.message-retry-btn');
    if (retryButton) retryMessage(retryButton.closest('.message'));
  });

  // Clear Button / Trash Icon Listener
  const trashIcon = document.querySelector('#clear-btn') ||
                    document.querySelector('.fa-trash') ||
                    document.querySelector('button[title*="Delete"]');

  if (trashIcon) {
    trashIcon.addEventListener('click', function () {
      if (confirm('Are you sure you want to clear this conversation history?')) {
        clearChat();
      }
    });
  }

  // Initialize messages on page load
  loadMessages();
});