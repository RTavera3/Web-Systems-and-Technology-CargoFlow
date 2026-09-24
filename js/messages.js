// Select the chat elements we need to use.
const messageInput = document.querySelector('.message-input');
const sendButton = document.querySelector('.send-btn');
const messagesContainer = document.querySelector('.messages-container');

// Function to get the current time in a formatted way (e.g., "10:30 AM"). Removed the Today, Now
function getCurrentFormattedTime() {
  const now = new Date();
  return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

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

function saveMessage(text, messageType, time) {
  const currentMessages = getStoredMessages();
  currentMessages.push({ text: text, messageType: messageType, time: time });
  localStorage.setItem('chatMessages', JSON.stringify(currentMessages));
}

function loadMessages() {
  const storedMessages = getStoredMessages();
  storedMessages.forEach(function (msg) {
    const msgTime = msg.time || getCurrentFormattedTime();
    addMessage(msg.text, msg.messageType, false, msgTime);
  });
}

function updateSidebarPreview(latestText) {
  // Finds the preview text in the active sidebar conversation item
  const activePreview = document.querySelector('.conversation-item.active .preview-text');
  if (activePreview) {
    activePreview.textContent = latestText;
  }
}

//Typing indicator functions
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

function removeTypingIndicator() {
  const indicator = document.getElementById('typing-status');
  if (indicator) indicator.remove();
}

//Chat functions.
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

// Function to clear all stored messages
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
if (sendButton) {
  sendButton.addEventListener('click', sendMessage);
}

if (messageInput) {
  messageInput.addEventListener('keydown', function (event) {
    if (event.key === 'Enter') {
      sendMessage();
    }
  });
}

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