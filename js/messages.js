import {
  clearPendingMessages,
  getPendingMessages,
  removePendingMessage,
  savePendingMessage,
} from './message-outbox.js';
import { getTransactionRecords } from './transaction-data.js';

// Express serves this page too, so the API is on the same host and port:
// relative URLs work wherever the server runs, not only localhost:3000.
const API_BASE_URL = '';
const DEMO_BOOKING_CODE = 'CF-24810293';
const MAX_MESSAGE_LENGTH = 500;
const RETRY_AFTER_RECONNECT_MESSAGE =
  "Couldn't reach the server. Your message is saved here. Select Retry when the server is online.";
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
const offlineBanner = document.querySelector('#offlineBanner');

// Reference: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/await#top_level_await
// The conversation list comes from the saved bookings (GET /api/bookings) and the demo records.
let conversations = await getConversations();
let activeConversation = null;
let isSending = false;
let isServerAvailable = navigator.onLine;
let demoFirstSendAvailable = true;
const sendingMessageIds = new Set();
let pendingMessages = getPendingMessages().map((message) => {
  if (message.demoFailureShown && message.lastError?.startsWith('Demo:')) {
    const updated = { ...message, lastError: RETRY_AFTER_RECONNECT_MESSAGE };
    savePendingMessage(updated);
    return updated;
  }
  if (message.status !== 'sending') return message;
  const requeued = { ...message, status: 'queued', lastError: '' };
  savePendingMessage(requeued);
  return requeued;
});
let isCheckingServer = false;

async function getConversations() {
  return (await getTransactionRecords()).map((transaction) => ({
    ...transaction,
    eta: transaction.eta || null,
  })).sort((a, b) => {
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

function setServerAvailability(available) {
  const wasAvailable = isServerAvailable;
  isServerAvailable = available;
  offlineBanner.hidden = available && navigator.onLine;
  if (available && !wasAvailable) flushPendingMessages();
}

function createMessageId() {
  return globalThis.crypto?.randomUUID?.()
    || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function storePendingMessage(message) {
  pendingMessages = pendingMessages.filter((item) => item.id !== message.id);
  const saved = savePendingMessage(message);
  pendingMessages.push(saved ? message : { ...message, volatileOnly: true });
  if (!saved) {
    setSendStatus("Couldn't save the message on this device. It will remain here until this page closes.", true);
    return false;
  }
  return true;
}

function discardPendingMessage(id) {
  if (!removePendingMessage(id)) {
    setSendStatus("Couldn't update the saved message queue on this device.", true);
    return false;
  }
  pendingMessages = pendingMessages.filter((message) => message.id !== id);
  return true;
}

function updatePendingMessage(id, changes) {
  const pending = pendingMessages.find((message) => message.id === id);
  if (!pending) return null;
  const updated = { ...pending, ...changes };
  storePendingMessage(updated);
  return updated;
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
    title.textContent = conversation.code === DEMO_BOOKING_CODE
      ? getConversationName(conversation)
      : `Booking ${conversation.code}`;
    const route = document.createElement('span');
    route.className = 'location-tag bg-light-blue';
    route.textContent = `${conversation.from || 'Pickup'} to ${conversation.to || 'Drop-off'}`;
    const preview = document.createElement('span');
    preview.className = 'preview-text';
    preview.textContent = conversation.status
      ? `Previous transaction · ${conversation.status}`
      : conversation.code === DEMO_BOOKING_CODE
        ? 'Ongoing shipment'
        : 'New booking · conversation ready';
    header.append(title);
    info.append(header, route, preview);
    item.append(avatar, info);
    item.addEventListener('click', () => selectConversation(conversation));
    conversationList.append(item);
  });
}

function filterConversations() {
  const query = searchInput.value.trim().toLowerCase();
  conversationList.querySelectorAll('.conversation-item').forEach((item) => {
    item.hidden = !item.textContent.toLowerCase().includes(query);
  });
}

async function saveMessage(text, messageType, conversation = activeConversation, clientMessageId = createMessageId()) {
  const response = await fetch(`${API_BASE_URL}/api/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      conversationId: conversation.code,
      clientMessageId,
      text,
      sender: messageType === 'outgoing' ? 'Shipper' : getConversationName(conversation),
      recipient: messageType === 'outgoing' ? getConversationName(conversation) : 'Shipper',
    }),
  });
  if (!response.ok) {
    let serverMessage = '';
    try {
      ({ error: serverMessage = '' } = await response.json());
    } catch {
      serverMessage = '';
    }
    throw new Error(serverMessage || `Server returned status ${response.status}`);
  }
  return response.json();
}

function addMessage(messageData, messageType, conversation, pending = null) {
  const message = document.createElement('div');
  const content = document.createElement('div');
  const messageText = document.createElement('p');
  const time = document.createElement('span');
  message.className = `message ${messageType}${pending?.status === 'failed' ? ' failed' : ''}`;
  if (pending) message.dataset.pendingId = pending.id;
  content.className = 'message-content';
  messageText.textContent = messageData.text;
  time.className = 'time';
  const date = new Date(messageData.timestamp);
  time.textContent = Number.isNaN(date.getTime())
    ? 'Time unavailable'
    : date.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
  content.append(messageText, time);

  if (messageType === 'incoming') {
    const avatar = document.createElement('span');
    avatar.className = 'avatar bg-navy message-avatar';
    avatar.textContent = getConversationName(conversation)[0].toUpperCase();
    message.append(avatar);
  }
  message.append(content);

  if (pending) {
    const state = document.createElement('span');
    state.className = 'message-state';
    state.textContent = pending.status === 'failed'
      ? pending.lastError || "Couldn't send this message."
      : pending.status === 'sending'
        ? 'Sending…'
        : pending.volatileOnly
          ? 'Queued in this tab only · will send when the connection returns.'
          : 'Queued · will send when the connection returns.';
    content.append(state);
    if (pending.status === 'failed') {
      const retryButton = document.createElement('button');
      retryButton.type = 'button';
      retryButton.className = 'message-retry-btn';
      retryButton.textContent = 'Retry';
      retryButton.setAttribute('aria-label', `Retry sending message: ${messageData.text}`);
      retryButton.addEventListener('click', () => retryPendingMessage(pending.id));
      content.append(retryButton);
    }
  }
  messagesContainer.append(message);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function renderMessages(serverMessages, conversation) {
  const conversationPending = pendingMessages
    .filter((message) => message.conversationId === conversation.code);
  const savedClientIds = new Set(serverMessages.map((message) => message.clientMessageId).filter(Boolean));
  for (const pending of conversationPending) {
    if (savedClientIds.has(pending.id)) discardPendingMessage(pending.id);
  }
  const unresolved = pendingMessages
    .filter((message) => message.conversationId === conversation.code && !savedClientIds.has(message.id));

  messagesContainer.replaceChildren();
  serverMessages.forEach((message) => {
    addMessage(message, message.sender === 'Shipper' ? 'outgoing' : 'incoming', conversation);
  });
  unresolved.forEach((pending) => {
    addMessage(pending, 'outgoing', conversation, pending);
  });
  emptyConversation.hidden = serverMessages.length + unresolved.length > 0;
}

async function loadMessages(conversation = activeConversation) {
  if (!conversation) return;
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/messages?conversationId=${encodeURIComponent(conversation.code)}`,
    );
    if (!response.ok) throw new Error(`Server returned status ${response.status}`);
    const messages = await response.json();
    setServerAvailability(true);
    if (activeConversation === conversation) {
      renderMessages(messages, conversation);
      updateComposer();
    }
    updateSidebarPreview(
      messages.length ? messages[messages.length - 1].text : 'No messages yet.',
      conversation.code,
    );
  } catch (error) {
    console.error('Unable to load booking messages:', error);
    setServerAvailability(false);
    if (activeConversation === conversation) {
      renderMessages([], conversation);
      setSendStatus("Couldn't reach the server. Your saved messages will appear when it reconnects.", true);
    }
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

async function sendPendingMessage(messageId) {
  const pending = pendingMessages.find((message) => message.id === messageId);
  if (!pending || sendingMessageIds.has(messageId)) return;
  if (!navigator.onLine || !isServerAvailable) {
    updatePendingMessage(messageId, { status: 'queued', lastError: '' });
    setServerAvailability(false);
    if (activeConversation?.code === pending.conversationId) {
      setSendStatus("Couldn't reach the server. Your message is saved and will send when it reconnects.", true);
      renderMessages([], activeConversation);
    }
    return;
  }

  const conversation = conversations.find((item) => item.code === pending.conversationId);
  if (!conversation) {
    updatePendingMessage(messageId, {
      status: 'failed',
      lastError: 'This booking conversation is no longer available.',
    });
    return;
  }

  if (pending.demoFirstAttempt && !pending.demoFailureShown) {
    const error = RETRY_AFTER_RECONNECT_MESSAGE;
    updatePendingMessage(messageId, {
      status: 'failed',
      lastError: error,
      demoFailureShown: true,
    });
    if (activeConversation?.code === pending.conversationId) {
      setSendStatus(error, true);
      renderMessages([], activeConversation);
    }
    return;
  }

  sendingMessageIds.add(messageId);
  isSending = true;
  updatePendingMessage(messageId, { status: 'sending', lastError: '' });
  if (activeConversation?.code === pending.conversationId) {
    setSendStatus('Sending…');
    renderMessages([], activeConversation);
    updateComposer();
  }

  try {
    const result = await saveMessage(pending.text, 'outgoing', conversation, pending.id);
    discardPendingMessage(messageId);
    updateSidebarPreview(pending.text, conversation.code);
    await loadMessages(conversation);
    if (activeConversation?.code === conversation.code) setSendStatus('Sent');
    if (!result.duplicate) replyFromCarrier(conversation);
  } catch (error) {
    console.error('Unable to save outgoing message:', error);
    const lostConnection = error instanceof TypeError || !navigator.onLine;
    updatePendingMessage(messageId, {
      status: lostConnection ? 'queued' : 'failed',
      lastError: lostConnection ? '' : `Couldn't send this message. ${error.message}`,
    });
    if (lostConnection) setServerAvailability(false);
    if (activeConversation?.code === pending.conversationId) {
      setSendStatus(
        lostConnection
          ? "Couldn't reach the server. Your message is saved and will send when it reconnects."
          : `Couldn't send your message. ${error.message} Use Retry to try again.`,
        true,
      );
      renderMessages([], activeConversation);
    }
  } finally {
    sendingMessageIds.delete(messageId);
    isSending = sendingMessageIds.size > 0;
    updateComposer();
  }
}

async function retryPendingMessage(messageId) {
  const pending = updatePendingMessage(messageId, {
    status: 'queued',
    lastError: '',
    demoFirstAttempt: false,
  });
  if (!pending) return;
  if (!navigator.onLine) {
    setServerAvailability(false);
    setSendStatus('You are offline. This message remains queued for automatic sending.', true);
    renderMessages([], activeConversation);
    return;
  }
  setServerAvailability(true);
  await sendPendingMessage(messageId);
}

async function flushPendingMessages() {
  if (!navigator.onLine || !isServerAvailable) return;
  const queued = pendingMessages
    .filter((message) => message.status === 'queued')
    .map((message) => message.id);
  for (const messageId of queued) {
    if (!navigator.onLine || !isServerAvailable) break;
    await sendPendingMessage(messageId);
  }
}

async function checkServerAvailability() {
  if (isCheckingServer) return;
  if (!navigator.onLine) {
    setServerAvailability(false);
    return;
  }

  isCheckingServer = true;
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 3000);
  try {
    const response = await fetch(`${API_BASE_URL}/api/health`, { signal: controller.signal });
    if (!response.ok) throw new Error(`Health check returned status ${response.status}`);
    setServerAvailability(true);
    await flushPendingMessages();
  } catch (error) {
    console.warn('CargoFlow messaging server is unavailable:', error);
    setServerAvailability(false);
  } finally {
    window.clearTimeout(timeout);
    isCheckingServer = false;
  }
}

async function sendMessage() {
  const text = messageInput.value.trim();
  if (!text || isSending) return;
  if (text.length > MAX_MESSAGE_LENGTH) {
    setSendStatus(`Messages can be up to ${MAX_MESSAGE_LENGTH} characters.`, true);
    return;
  }

  const conversation = activeConversation;
  if (!conversation) return;
  const pending = {
    id: createMessageId(),
    conversationId: conversation.code,
    text,
    sender: 'Shipper',
    recipient: getConversationName(conversation),
    timestamp: new Date().toISOString(),
    status: 'queued',
    lastError: '',
    demoFirstAttempt: demoFirstSendAvailable,
  };
  demoFirstSendAvailable = false;
  const persisted = storePendingMessage(pending);
  messageInput.value = '';
  updateComposer();
  if (!navigator.onLine || !isServerAvailable) {
    setServerAvailability(false);
    setSendStatus(persisted
      ? 'Message saved. It will send automatically when the connection returns.'
      : "Couldn't save an offline copy. The message will stay in this tab and send when the connection returns.", !persisted);
    renderMessages([], conversation);
    updateSidebarPreview(text, conversation.code);
    return;
  }
  await sendPendingMessage(pending.id);
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
    if (!clearPendingMessages(conversation.code)) {
      setSendStatus("Couldn't clear saved pending messages from this device.", true);
      return;
    }
    pendingMessages = pendingMessages.filter((message) => message.conversationId !== conversation.code);
    updateSidebarPreview('No messages yet.', conversation.code);
    if (activeConversation === conversation) {
      messagesContainer.replaceChildren();
      emptyConversation.hidden = false;
      setSendStatus('Conversation cleared.');
    }
  } catch (error) {
    console.error('Unable to clear booking messages:', error);
    if (error instanceof TypeError || !navigator.onLine) setServerAvailability(false);
    setSendStatus(`Couldn't clear this conversation. ${error.message} Please try again.`, true);
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
searchInput.addEventListener('input', filterConversations);
// Bookings are saved on the server, so reload the conversation list when the
// page is shown again (e.g. after booking in another tab and coming back).
window.addEventListener('pageshow', async (event) => {
  if (!event.persisted) return; // the first load already built the list
  const activeCode = activeConversation?.code;
  conversations = await getConversations();
  renderConversations();
  filterConversations();
  const selection = conversations.find((conversation) => conversation.code === activeCode)
    || conversations[0];
  if (selection) selectConversation(selection, false);
});
window.addEventListener('storage', (event) => {
  if (event.key === 'cargoflow_message_outbox') {
    pendingMessages = getPendingMessages();
    if (activeConversation) loadMessages(activeConversation);
  }
});

window.addEventListener('offline', () => {
  setServerAvailability(false);
  setSendStatus('You are offline. New messages will send automatically when you reconnect.');
});
window.addEventListener('online', checkServerAvailability);

setServerAvailability(navigator.onLine);
checkServerAvailability();
window.setInterval(checkServerAvailability, 5000);
