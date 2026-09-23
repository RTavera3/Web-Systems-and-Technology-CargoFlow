// Wires up Bootstrap's client-side validation styling for every
// <form class="needs-validation"> on the page: on submit, invalid required
// fields get the red border + .invalid-feedback message instead of the
// browser's default tooltip. Forms with their own submit handler (contact,
// payment) call form.checkValidity() themselves and don't rely on this.
document.querySelectorAll('form.needs-validation').forEach((form) => {
  form.addEventListener('submit', (event) => {
    if (!form.checkValidity()) {
      event.preventDefault();
      event.stopPropagation();
    }
    form.classList.add('was-validated');
  });
});
