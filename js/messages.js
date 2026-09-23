// Select the chat elements we need to use.
const messageInput = document.querySelector('.message-input');
const sendButton = document.querySelector('.send-btn');
const messagesContainer = document.querySelector('.messages-container');

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

function saveMessage(text, messageType) {
  const currentMessages = getStoredMessages();
  currentMessages.push({ text: text, messageType: messageType });
  localStorage.setItem('chatMessages', JSON.stringify(currentMessages));
}

function loadMessages() {
  const storedMessages = getStoredMessages();
  storedMessages.forEach(function (msg) {
    addMessage(msg.text, msg.messageType, false);
  });
}

//Chat functions.
function addMessage(text, messageType, shouldSave = true) {
  const message = document.createElement('div');
  const messageContent = document.createElement('div');
  const messageText = document.createElement('p');
  const messageTime = document.createElement('span');

  // Add the same classes used by the messages already in the HTML.
  message.className = 'message ' + messageType;
  messageContent.className = 'message-content';
  messageText.textContent = text;
  messageTime.className = 'time';
  messageTime.textContent = 'Today · Now';

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
    saveMessage(text, messageType);
  }
}

function sendMessage() {
  const text = messageInput.value.trim();
  if (text === '') return;
  addMessage(text, 'outgoing');
  messageInput.value = '';

  setTimeout(function () {
    addMessage('Hello! Your shipment is currently in transit to Cebu and on schedule.', 'incoming');
  }, 1500);

}

// Function to clear all stored messages
function clearChat() {
  localStorage.removeItem('chatMessages');
  messagesContainer.innerHTML = '';
}

sendButton.addEventListener('click', sendMessage);

//This code would help load the messages from local storage when the page is loaded.
loadMessages();

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