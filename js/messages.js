// Select the chat elements we need to use.
const messageInput = document.querySelector('.message-input');
const sendButton = document.querySelector('.send-btn');
const messagesContainer = document.querySelector('.messages-container');
const messageCharacterCount = document.querySelector('#messageCharacterCount');
const messageSendStatus = document.querySelector('#messageSendStatus');
let isSending = false;

// Storage helpers as advised during mentoring session - MDN WebDocs
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

function saveMessage(text, messageType, timestamp = Date.now()) {
  const currentMessages = getStoredMessages();
  currentMessages.push({ text: text, messageType: messageType, timestamp: timestamp });
  localStorage.setItem('chatMessages', JSON.stringify(currentMessages));
}

function loadMessages() {
  const storedMessages = getStoredMessages();
  storedMessages.forEach(function (msg) {
    addMessage(msg.text, msg.messageType, false, msg.timestamp);
  });
}

//Chat functions.
function addMessage(text, messageType, shouldSave = true, timestamp = Date.now()) {
  const message = document.createElement('div');
  const messageContent = document.createElement('div');
  const messageText = document.createElement('p');
  const messageTime = document.createElement('span');

  // Add the same classes used by the messages already in the HTML.
  message.className = 'message ' + messageType;
  messageContent.className = 'message-content';
  messageText.textContent = text;
  messageTime.className = 'time';
  const date = new Date(timestamp);
  const status = messageType === 'outgoing' ? 'Sent' : 'Delivered';
  messageTime.textContent = Number.isNaN(date.getTime())
    ? `${status} · time unavailable`
    : `${status} · ${new Intl.DateTimeFormat(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(date)}`;

  // Put the text and time inside the message, then add it to the chat.
  messageContent.appendChild(messageText);
  messageContent.appendChild(messageTime);

  if (messageType === 'incoming') {
    const avatar = document.createElement('div');
    avatar.className = 'avatar bg-navy message-avatar';
    avatar.textContent = 'N';
    message.appendChild(avatar);
  }

  message.appendChild(messageContent);
  messagesContainer.appendChild(message);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;

  if (shouldSave) {
    saveMessage(text, messageType, timestamp);
  }
}

async function sendMessage() {
  const text = messageInput.value.slice(0, 300).trim();
  if (text === '' || isSending) return;

  isSending = true;
  messageInput.readOnly = true;
  messageSendStatus.textContent = 'Sending…';
  messageSendStatus.removeAttribute('data-error');
  updateSendButton();

  try {
    await new Promise((resolve) => setTimeout(resolve, 150));
    const sentAt = Date.now();
    saveMessage(text, 'outgoing', sentAt);
    addMessage(text, 'outgoing', false, sentAt);
    messageInput.value = '';
    messageSendStatus.textContent = 'Sent';

    setTimeout(function () {
      addMessage('Hello! Your shipment is currently in transit to Cebu and on schedule.', 'incoming');
    }, 1500);
  } catch (error) {
    console.error('Unable to save outgoing message:', error);
    messageSendStatus.textContent = "Couldn't send your message. Please try again.";
    messageSendStatus.dataset.error = 'true';
  } finally {
    isSending = false;
    messageInput.readOnly = false;
    updateSendButton();
  }
}

function updateSendButton() {
  sendButton.disabled = isSending || messageInput.value.trim() === '';
  messageCharacterCount.textContent = `${messageInput.value.length} / 300`;
}

// Function to clear all stored messages
function clearChat() {
  if (!window.confirm('Are you sure you want to clear this chat? This cannot be undone.')) {
    return;
  }
  localStorage.removeItem('chatMessages');
  messagesContainer.innerHTML = '';
}

sendButton.addEventListener('click', sendMessage);
messageInput.addEventListener('input', () => {
  messageSendStatus.textContent = '';
  messageSendStatus.removeAttribute('data-error');
  updateSendButton();
});
updateSendButton();

//This code would help load the messages from local storage when the page is loaded.
loadMessages();
messagesContainer.setAttribute('aria-live', 'polite');

// Key listener.
messageInput.addEventListener('keydown', function (event) {
  if (event.key === 'Enter') {
    sendMessage();
  }
});

const clearButton = document.querySelector('#clear-btn');
if (clearButton) {
  clearButton.addEventListener('click', clearChat);
}