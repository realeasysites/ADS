// public/js/main.js
document.addEventListener('DOMContentLoaded', () => {
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  const navToggle = document.getElementById('nav-toggle');
  const mobileNav = document.getElementById('mobile-nav');
  if (navToggle && mobileNav) {
    navToggle.addEventListener('click', () => mobileNav.classList.toggle('open'));
    mobileNav.querySelectorAll('a').forEach((a) =>
      a.addEventListener('click', () => mobileNav.classList.remove('open'))
    );
  }

  const form = document.getElementById('assessment-form');
  const status = document.getElementById('form-status');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      status.className = '';
      status.textContent = '';

      const submitBtn = form.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      submitBtn.textContent = 'Sending...';

      const data = Object.fromEntries(new FormData(form).entries());

      try {
        const res = await fetch('/api/assessment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        const result = await res.json();

        if (res.ok && result.ok) {
          status.textContent = result.message || "Thanks — we'll be in touch shortly.";
          status.className = 'success';
          form.reset();
        } else {
          status.textContent = result.error || 'Something went wrong. Please call us at (207) 838-6848.';
          status.className = 'error';
        }
      } catch (err) {
        status.textContent = 'Something went wrong. Please call or text us at (207) 838-6848.';
        status.className = 'error';
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Send Message';
      }
    });
  }
});
