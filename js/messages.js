import { listBookings } from './storage.js';

const API_BASE_URL = 'http://localhost:3000';
const DEMO_BOOKING = {
  code: 'CF-24810293',
  from: 'Manila',
  to: 'Cebu',
  pickupDate: '2026-09-10',
  eta: '2026-09-15',
  carrier: 'LBC Express',
};
const PREVIOUS_TRANSACTIONS = [
  {
    code: 'CF-24750118',
    from: 'Quezon City',
    to: 'Davao',
    pickupDate: '2026-08-28',
    paymentMethod: 'Credit or debit card',
    status: 'Delivered',
    carrier: 'Carrier support',
  },
  {
    code: 'CF-24690457',
    from: 'Pasig',
    to: 'Iloilo',
    pickupDate: '2026-08-12',
    paymentMethod: 'Cash on pickup',
    status: 'Delivered',
    carrier: 'Carrier support',
  },
  {
    code: 'CF-24610932',
    from: 'Makati',
    to: 'Baguio',
    pickupDate: '2026-07-30',
    paymentMethod: 'GCash',
    status: 'Delivered',
    carrier: 'Carrier support',
  },
];
const MAX_MESSAGE_LENGTH = 500;
const conversationList = document.querySelector('.conversation-list');
const searchInput = document.querySelector('.search-box input');
const messageInput = document.querySelector('.message-input');
const sendButton = document.querySelector('.send-btn');
const messagesContainer = document.querySelector('.messages-container');
const messageCharacterCount = document.querySelector('#messageCharacterCount');
const messageSendStatus = document.querySelector('#messageSendStatus');
const emptyConversation = document.querySelector('#conversationEmpty');
const chatCarrierAvatar = document.querySelector('#chatCarrierAvatar');
const chatCarrierName = document.querySelector('#chatCarrierName');
const chatRoute = document.querySelector('#chatRoute');
const chatTrackingNumber = document.querySelector('#chatTrackingNumber');
const chatShipmentSummary = document.querySelector('#chatShipmentSummary');

let conversations = getConversations();
let activeConversation = null;
let isSending = false;

function getConversations() {
  const bookings = listBookings().map(({ code, ...booking }) => ({
    ...booking,
    code,
    carrier: code === DEMO_BOOKING.code ? DEMO_BOOKING.carrier : 'Carrier match pending',
  }));
  const savedCodes = new Set(bookings.map((booking) => booking.code));
  bookings.push(
    ...[...PREVIOUS_TRANSACTIONS, DEMO_BOOKING]
      .filter((transaction) => !savedCodes.has(transaction.code)),
  );
  return bookings.sort((a, b) => {
    const dateDifference = Date.parse(b.createdAt || b.pickupDate || '')
      - Date.parse(a.createdAt || a.pickupDate || '');
    return Number.isNaN(dateDifference) ? 0 : dateDifference;
  });
}

function formatDate(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value || '');
  if (!match) return value || 'Date not provided';
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
    .toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

function getConversationName(conversation) {
  return conversation.carrier || 'Carrier match pending';
}

function setSendStatus(text, isError = false) {
  messageSendStatus.textContent = text;
  messageSendStatus.classList.toggle('is-error', isError);
}

function getConversationIdFromUrl() {
  return new URLSearchParams(window.location.search).get('conversation');
}

function selectConversation(conversation, updateUrl = true) {
  activeConversation = conversation;
  const name = getConversationName(conversation);
  const route = `${conversation.from || 'Pickup'} to ${conversation.to || 'Drop-off'}`;

  chatCarrierAvatar.textContent = name[0].toUpperCase();
  chatCarrierName.textContent = name;
  chatRoute.textContent = route;
  chatTrackingNumber.textContent = conversation.code;
  chatShipmentSummary.textContent = conversation.eta
    ? `${route} · Estimated delivery ${formatDate(conversation.eta)}`
    : `${route} · ${conversation.status ? `${conversation.status} · ` : ''}Pickup ${formatDate(conversation.pickupDate)}`;
  chatCarrierAvatar.setAttribute('aria-label', name);

  conversationList.querySelectorAll('.conversation-item').forEach((item) => {
    const selected = item.dataset.conversationId === conversation.code;
    item.classList.toggle('active', selected);
    item.setAttribute('aria-current', selected ? 'true' : 'false');
  });
  messagesContainer.replaceChildren();
  emptyConversation.hidden = true;
  setSendStatus('');
  if (updateUrl) {
    const url = new URL(window.location.href);
    url.searchParams.set('conversation', conversation.code);
    window.history.replaceState(null, '', url);
  }
  loadMessages();
}

function renderConversations() {
  conversationList.replaceChildren();
  conversations.forEach((conversation) => {
    const item = document.createElement('button');
    item.type = 'button';
    item.className = 'conversation-item';
    item.dataset.conversationId = conversation.code;

    const avatar = document.createElement('span');
    avatar.className = 'avatar bg-navy';
    avatar.textContent = getConversationName(conversation)[0].toUpperCase();

    const info = document.createElement('span');
    info.className = 'conversation-info';
    const header = document.createElement('span');
    header.className = 'item-header';
    const title = document.createElement('strong');
    title.textContent = conversation.code === DEMO_BOOKING.code
      ? getConversationName(conversation)
      : `Booking ${conversation.code}`;
    const route = document.createElement('span');
    route.className = 'location-tag bg-light-blue';
    route.textContent = `${conversation.from || 'Pickup'} to ${conversation.to || 'Drop-off'}`;
    const preview = document.createElement('span');
    preview.className = 'preview-text';
    preview.textContent = conversation.status
      ? `Previous transaction · ${conversation.status}`
      : conversation.code === DEMO_BOOKING.code
        ? 'Ongoing shipment'
        : 'New booking · conversation ready';
    header.append(title);
    info.append(header, route, preview);
    item.append(avatar, info);
    item.addEventListener('click', () => selectConversation(conversation));
    conversationList.append(item);
  });
}

async function saveMessage(text, messageType, conversation = activeConversation) {
  const response = await fetch(`${API_BASE_URL}/api/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      conversationId: conversation.code,
      text,
      sender: messageType === 'outgoing' ? 'Shipper' : getConversationName(conversation),
      recipient: messageType === 'outgoing' ? getConversationName(conversation) : 'Shipper',
    }),
  });
  if (!response.ok) throw new Error(`Server returned status ${response.status}`);
}

function addMessage(text, messageType, timestamp) {
  const message = document.createElement('div');
  const content = document.createElement('div');
  const messageText = document.createElement('p');
  const time = document.createElement('span');
  message.className = `message ${messageType}`;
  content.className = 'message-content';
  messageText.textContent = text;
  time.className = 'time';
  const date = new Date(timestamp);
  time.textContent = Number.isNaN(date.getTime())
    ? 'Time unavailable'
    : date.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
  content.append(messageText, time);

  if (messageType === 'incoming') {
    const avatar = document.createElement('span');
    avatar.className = 'avatar bg-navy message-avatar';
    avatar.textContent = getConversationName(activeConversation)[0].toUpperCase();
    message.append(avatar);
  }
  message.append(content);
  messagesContainer.append(message);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

async function loadMessages(conversation = activeConversation) {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/messages?conversationId=${encodeURIComponent(conversation.code)}`,
    );
    if (!response.ok) throw new Error(`Server returned status ${response.status}`);
    const messages = await response.json();
    if (activeConversation === conversation) {
      messagesContainer.replaceChildren();
      messages.forEach((message) => {
        addMessage(message.text, message.sender === 'Shipper' ? 'outgoing' : 'incoming', message.timestamp);
      });
      emptyConversation.hidden = messages.length > 0;
      updateComposer();
    }
    updateSidebarPreview(
      messages.length ? messages[messages.length - 1].text : 'No messages yet.',
      conversation.code,
    );
  } catch (error) {
    console.error('Unable to load booking messages:', error);
    setSendStatus('Unable to load this conversation. Check that the CargoFlow server is running.', true);
  }
}

function updateSidebarPreview(text, conversationId = activeConversation?.code) {
  const activeItem = conversationList.querySelector(
    `.conversation-item[data-conversation-id="${CSS.escape(conversationId || '')}"]`,
  );
  const preview = activeItem && activeItem.querySelector('.preview-text');
  if (preview) preview.textContent = text;
}

function showTypingIndicator() {
  const indicator = document.createElement('div');
  indicator.className = 'message incoming typing-indicator';
  indicator.id = 'typing-status';
  const content = document.createElement('div');
  content.className = 'message-content';
  const text = document.createElement('p');
  text.textContent = `${getConversationName(activeConversation)} is typing...`;
  content.append(text);
  indicator.append(content);
  messagesContainer.append(indicator);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function replyFromCarrier(conversation) {
  if (activeConversation === conversation) showTypingIndicator();
  window.setTimeout(async () => {
    if (activeConversation === conversation) {
      document.querySelector('#typing-status')?.remove();
    }
    try {
      await saveMessage(
        `Thanks for your message about your ${conversation.from} to ${conversation.to} shipment. We'll follow up here with booking updates.`,
        'incoming',
        conversation,
      );
      await loadMessages(conversation);
      updateSidebarPreview('Carrier replied', conversation.code);
    } catch (error) {
      console.error('Unable to save carrier reply:', error);
    }
  }, 1200);
}

async function sendMessage() {
  const text = messageInput.value.trim();
  if (!text || isSending) return;
  if (text.length > MAX_MESSAGE_LENGTH) {
    setSendStatus(`Messages can be up to ${MAX_MESSAGE_LENGTH} characters.`, true);
    return;
  }

  isSending = true;
  const conversation = activeConversation;
  setSendStatus('Sending…');
  updateComposer();
  try {
    await saveMessage(text, 'outgoing', conversation);
    messageInput.value = '';
    updateSidebarPreview(text, conversation.code);
    await loadMessages(conversation);
    setSendStatus('Sent');
    replyFromCarrier(conversation);
  } catch (error) {
    console.error('Unable to save outgoing message:', error);
    setSendStatus("Couldn't send your message. Check that the server is running and try again.", true);
  } finally {
    isSending = false;
    updateComposer();
  }
}

function updateComposer() {
  sendButton.disabled = isSending || !activeConversation || messageInput.value.trim() === '';
  messageCharacterCount.textContent = `${messageInput.value.length} / ${MAX_MESSAGE_LENGTH}`;
}

async function clearChat() {
  if (!window.confirm('Clear messages for this booking? This cannot be undone.')) return;
  const conversation = activeConversation;
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/messages?conversationId=${encodeURIComponent(conversation.code)}`,
      { method: 'DELETE' },
    );
    if (!response.ok) throw new Error(`Server returned status ${response.status}`);
    updateSidebarPreview('No messages yet.', conversation.code);
    if (activeConversation === conversation) {
      messagesContainer.replaceChildren();
      emptyConversation.hidden = false;
      setSendStatus('Conversation cleared.');
    }
  } catch (error) {
    console.error('Unable to clear booking messages:', error);
    setSendStatus("Couldn't clear this conversation. Please try again.", true);
  }
}

renderConversations();
const requestedConversation = conversations.find(
  (conversation) => conversation.code === getConversationIdFromUrl(),
);
selectConversation(requestedConversation || conversations[0], false);
sendButton.addEventListener('click', sendMessage);
messageInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    event.preventDefault();
    sendMessage();
  }
});
messageInput.addEventListener('input', () => {
  setSendStatus('');
  updateComposer();
});
document.querySelector('#clear-btn').addEventListener('click', clearChat);
searchInput.addEventListener('input', () => {
  const query = searchInput.value.trim().toLowerCase();
  conversationList.querySelectorAll('.conversation-item').forEach((item) => {
    item.hidden = !item.textContent.toLowerCase().includes(query);
  });
  window.addEventListener('storage', (event) => {
    if (event.key !== 'cargoflow_bookings') return;
    const activeCode = activeConversation?.code;
    conversations = getConversations();
    renderConversations();
    const retainedSelection = conversations.find((conversation) => conversation.code === activeCode);
    if (retainedSelection) selectConversation(retainedSelection, false);
  });
});
