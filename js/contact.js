/**
 * Contact page form handling.
 *
 * There is no backend, so "submitting" this form does not send anything
 * anywhere - it only runs Bootstrap's client-side validation and, if every
 * field is valid, shows a success message and resets the form so it can
 * be filled out again.
 */

/** @type {HTMLFormElement} The "Send us a message" form. */
const contactForm = document.getElementById('contactForm');

/** @type {HTMLElement} Success alert shown after a valid submission. */
const successMessage = document.getElementById('successMessage');

/**
 * Handles the contact form's submit event.
 *
 * Always prevents the real (nonexistent) network submission. If any field
 * fails HTML5 validation, adds `.was-validated` so Bootstrap shows the red
 * borders/feedback text and stops here. Otherwise, reveals the success
 * message and resets the form (including the validation styling) so a
 * second message can be composed without stale red borders.
 *
 * @param {SubmitEvent} event
 */
contactForm.addEventListener('submit', function (event) {
  event.preventDefault();
  if (!contactForm.checkValidity()) {
    contactForm.classList.add('was-validated');
    return;
  }
  successMessage.hidden = false;
  contactForm.reset();
  contactForm.classList.remove('was-validated');
});
