/**
 * Site-wide Bootstrap validation wiring.
 *
 * Bootstrap's `.needs-validation` / `.was-validated` styling (red borders
 * and `.invalid-feedback` messages) only activates once a form has been
 * submitted at least once - this script is what flips that switch.
 *
 * For every <form class="needs-validation"> on the page, on submit:
 *   1. If the form has any invalid field, stop the browser's default
 *      submit/tooltip behaviour (`preventDefault` + `stopPropagation`).
 *   2. Add `.was-validated`, which turns on Bootstrap's CSS so invalid
 *      fields show red and their `.invalid-feedback` text becomes visible.
 *
 * Pages whose form needs extra logic on submit (contact.html, payment.html,
 * booking-details.html) still include this script for the free styling,
 * but layer their own `submit` listener with `event.preventDefault()` and
 * a `form.checkValidity()` check on top - see js/contact.js, js/payment.js,
 * and js/booking-details.js.
 */
document.querySelectorAll('form.needs-validation').forEach((form) => {
  form.addEventListener('submit', (event) => {
    if (!form.checkValidity()) {
      event.preventDefault();
      event.stopPropagation();
    }
    form.classList.add('was-validated');
  });
});
