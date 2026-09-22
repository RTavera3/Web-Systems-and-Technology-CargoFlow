// Select the chat elements we need to use.
const messageInput = document.querySelector('.message-input');
const sendButton = document.querySelector('.send-btn');
const messagesContainer = document.querySelector('.messages-container');

// -------------------------------------------------------------
// STORAGE HELPERS
// -------------------------------------------------------------

// 1. Get existing messages array from localStorage (or return empty array [])
function getStoredMessages() {
  const saved = localStorage.getItem('chatMessages');
  return saved ? JSON.parse(saved) : [];
}

// 2. Save a new message object into localStorage
function saveMessage(text, messageType) {
  const currentMessages = getStoredMessages();
  currentMessages.push({ text: text, messageType: messageType });
  localStorage.setItem('chatMessages', JSON.stringify(currentMessages));
}

// 3. Load stored messages on page load
function loadMessages() {
  const storedMessages = getStoredMessages();
  storedMessages.forEach(function (msg) {
    // Pass false for 'shouldSave' so loading old messages doesn't duplicate them in storage
    addMessage(msg.text, msg.messageType, false);
  });
}

// -------------------------------------------------------------
// CHAT FUNCTIONS
// -------------------------------------------------------------

// Add one message to the chat window.
function addMessage(text, messageType, shouldSave = true) {
  // Create the elements that make up a message.
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

  // Scroll down so the newest message is visible.
  messagesContainer.scrollTop = messagesContainer.scrollHeight;

  // Save to localStorage if this is a new message being sent/received
  if (shouldSave) {
    saveMessage(text, messageType);
  }
}

// Send the typed message and prepare the automatic reply.
function sendMessage() {
  const text = messageInput.value.trim();

  // Do not add an empty message.
  if (text === '') {
    return;
  }

  addMessage(text, 'outgoing');
  messageInput.value = '';

  // Simulate a short wait before the carrier replies.
  setTimeout(function () {
    addMessage('Got it! We are on schedule for pick-up.', 'incoming');
  }, 1500);
}

// -------------------------------------------------------------
// EVENT LISTENERS & INITIALIZATION
// -------------------------------------------------------------

// Load previously saved messages when the JS script runs
loadMessages();

// The click listener sends a message when the user presses Send.
sendButton.addEventListener('click', sendMessage);

// The key listener also lets the user press Enter to send.
messageInput.addEventListener('keydown', function (event) {
  if (event.key === 'Enter') {
    sendMessage();
  }
});