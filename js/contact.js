// Contact page — Bootstrap validation styling plus a success message on
// submit (no backend yet, so nothing is actually sent).

const contactForm = document.getElementById('contactForm');
const successMessage = document.getElementById('successMessage');

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
