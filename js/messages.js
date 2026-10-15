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

function saveMessage(text, messageType, timestamp = Date.now(), status = 'sent', id = createMessageId()) {
  const currentMessages = getStoredMessages();
  currentMessages.push({ id, text, messageType, timestamp, status });
  localStorage.setItem('chatMessages', JSON.stringify(currentMessages));
  return id;
}

function createMessageId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function updateStoredMessageStatus(id, status, timestamp) {
  const currentMessages = getStoredMessages();
  const message = currentMessages.find((entry) => entry.id === id);
  if (!message) {
    throw new Error('The message could not be found in chat history.');
  }
  message.status = status;
  message.timestamp = timestamp;
  localStorage.setItem('chatMessages', JSON.stringify(currentMessages));
}

function loadMessages() {
  const storedMessages = getStoredMessages();
  storedMessages.forEach(function (msg) {
    addMessage(msg.text, msg.messageType, false, msg.timestamp, msg.status || 'sent', msg.id);
  });
}

//Chat functions.
function addMessage(
  text,
  messageType,
  shouldSave = true,
  timestamp = Date.now(),
  status = 'sent',
  id = createMessageId(),
) {
  const message = document.createElement('div');
  const messageContent = document.createElement('div');
  const messageText = document.createElement('p');
  const messageTime = document.createElement('span');

  // Add the same classes used by the messages already in the HTML.
  message.className = 'message ' + messageType;
  if (status === 'failed') {
    message.classList.add('failed');
  }
  message.dataset.messageId = id;
  message.dataset.status = status;
  messageContent.className = 'message-content';
  messageText.textContent = text;
  messageTime.className = 'time';
  const date = new Date(timestamp);
  const deliveryLabel = status === 'failed'
    ? 'Failed'
    : status === 'queued'
      ? 'Queued'
      : messageType === 'outgoing' ? 'Sent' : 'Delivered';
  messageTime.textContent = Number.isNaN(date.getTime())
    ? `${deliveryLabel} · time unavailable`
    : `${deliveryLabel} · ${new Intl.DateTimeFormat(undefined, {
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

  if (messageType === 'outgoing' && status === 'failed') {
    const retryButton = document.createElement('button');
    retryButton.type = 'button';
    retryButton.className = 'message-retry-btn';
    retryButton.textContent = 'Retry';
    retryButton.setAttribute('aria-label', 'Retry sending this message');
    messageContent.appendChild(retryButton);
  }

  message.appendChild(messageContent);
  messagesContainer.appendChild(message);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;

  if (shouldSave) {
    saveMessage(text, messageType, timestamp, status, id);
  }
  return message;
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
    const isDemoFailure = localStorage.getItem('chatDemoFirstFailureShown') !== 'true';
    if (isDemoFailure) {
      localStorage.setItem('chatDemoFirstFailureShown', 'true');
      addMessage(text, 'outgoing', true, sentAt, 'failed');
      messageSendStatus.textContent = "Couldn't send your message. Retry is available below it.";
      messageSendStatus.dataset.error = 'true';
    } else {
      addMessage(text, 'outgoing', true, sentAt);
      messageSendStatus.textContent = 'Sent';
      setTimeout(function () {
        addMessage('Hello! Your shipment is currently in transit to Cebu and on schedule.', 'incoming');
      }, 1500);
    }
    messageInput.value = '';
  } catch (error) {
    console.error('Unable to save outgoing message:', error);
    messageSendStatus.textContent = "Couldn't save your message. Please try again.";
    messageSendStatus.dataset.error = 'true';
  } finally {
    isSending = false;
    messageInput.readOnly = false;
    updateSendButton();
  }
}

async function retryMessage(messageElement) {
  const messageId = messageElement.dataset.messageId;
  const retryButton = messageElement.querySelector('.message-retry-btn');
  if (!retryButton || messageElement.dataset.status !== 'failed') return;

  retryButton.disabled = true;
  retryButton.textContent = 'Retrying…';
  try {
    await new Promise((resolve) => setTimeout(resolve, 150));
    const sentAt = Date.now();
    updateStoredMessageStatus(messageId, 'sent', sentAt);
    messageElement.dataset.status = 'sent';
    messageElement.classList.remove('failed');
    messageElement.querySelector('.time').textContent =
      `Sent · ${new Intl.DateTimeFormat(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(new Date(sentAt))}`;
    retryButton.remove();
    messageSendStatus.textContent = 'Sent';
    messageSendStatus.removeAttribute('data-error');
    setTimeout(function () {
      addMessage('Hello! Your shipment is currently in transit to Cebu and on schedule.', 'incoming');
    }, 1500);
  } catch (error) {
    console.error('Unable to retry message:', error);
    retryButton.disabled = false;
    retryButton.textContent = 'Retry';
    messageSendStatus.textContent = "Couldn't retry your message. Please try again.";
    messageSendStatus.dataset.error = 'true';
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
messagesContainer.addEventListener('click', (event) => {
  const retryButton = event.target.closest('.message-retry-btn');
  if (retryButton) {
    retryMessage(retryButton.closest('.message'));
  }
});
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