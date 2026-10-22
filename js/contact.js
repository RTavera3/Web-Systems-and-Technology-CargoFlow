/**
 * Contact page form handling.
 *
 * Runs Bootstrap's client-side validation, then sends the message to the
 * Express server (POST /api/contact through js/api.js), which checks it
 * again and saves it in data/contact-messages.json. On success it shows the
 * thank-you message and resets the form so another can be written.
 */

import { sendContactMessage } from './api.js';

/** @type {HTMLFormElement} The "Send us a message" form. */
const contactForm = document.getElementById('contactForm');

/** @type {HTMLElement} Success alert shown after the server saves the message. */
const successMessage = document.getElementById('successMessage');

/** @type {HTMLButtonElement} The form's submit button, disabled while sending. */
const sendButton = contactForm.querySelector('button[type="submit"]');

/** Shows an error under the form, or hides it when `text` is empty. */
const errorMessage = document.createElement('p');
errorMessage.className = 'alert alert-danger mt-3 mb-0';
errorMessage.setAttribute('role', 'alert');
errorMessage.hidden = true;
contactForm.append(errorMessage);
const showError = (text) => {
  errorMessage.textContent = text;
  errorMessage.hidden = !text;
};

/**
 * Handles the contact form's submit event. Invalid fields get Bootstrap's
 * red borders and nothing is sent. Otherwise the message goes to the
 * server; the form is only reset once the server has saved it.
 *
 * @param {SubmitEvent} event
 */
contactForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  successMessage.hidden = true;
  showError('');
  if (!contactForm.checkValidity()) {
    contactForm.classList.add('was-validated');
    return;
  }

  sendButton.disabled = true;
  try {
    await sendContactMessage({
      name: contactForm.elements.name.value,
      email: contactForm.elements.email.value,
      message: contactForm.elements.message.value,
    });
    successMessage.hidden = false;
    contactForm.reset();
    contactForm.classList.remove('was-validated');
  } catch (error) {
    showError(error.status
      ? error.message
      : 'Your message could not be sent. Check your connection and try again.');
  } finally {
    sendButton.disabled = false;
  }
});
