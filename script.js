// Theme Toggle
const desktopThemeToggle = document.getElementById('themeToggle');
const mobileThemeToggle = document.getElementById('mobileThemeToggle');

const sunIcon = document.getElementById('sunIcon');
const moonIcon = document.getElementById('moonIcon');

const html = document.documentElement;

// Default Theme
const currentTheme = localStorage.getItem('theme') || 'dark';

html.classList.toggle('dark', currentTheme === 'dark');

updateThemeIcons();

// THEME FUNCTION
function toggleTheme() {

  html.classList.toggle('dark');

  const theme = html.classList.contains('dark')
    ? 'dark'
    : 'light';

  localStorage.setItem('theme', theme);

  updateThemeIcons();
}

// DESKTOP BUTTON
if (desktopThemeToggle) {
  desktopThemeToggle.addEventListener('click', toggleTheme);
}

// MOBILE BUTTON
if (mobileThemeToggle) {
  mobileThemeToggle.addEventListener('click', toggleTheme);
}

// UPDATE ICONS
function updateThemeIcons() {

  const isDark = html.classList.contains('dark');

  if (sunIcon) {
    sunIcon.style.display = isDark ? 'block' : 'none';
  }

  if (moonIcon) {
    moonIcon.style.display = isDark ? 'none' : 'block';
  }
}

// 3D Tilt Effect
const tiltElements = document.querySelectorAll('.tilt-element');

tiltElements.forEach(element => {
  const intensity = parseFloat(element.dataset.intensity) || 10;
  
  element.addEventListener('mousemove', (e) => {
    const rect = element.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const mouseX = e.clientX - centerX;
    const mouseY = e.clientY - centerY;
    
    const rotateX = (mouseY / (rect.height / 2)) * -intensity;
    const rotateY = (mouseX / (rect.width / 2)) * intensity;
    
    element.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1, 1, 1)`;
  });
  
  element.addEventListener('mouseleave', () => {
    element.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
  });
});

// Smooth Scrolling
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      target.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  });
});

const form = document.getElementById("contact-form");
const status = document.getElementById("form-status");

form.addEventListener("submit", function(e) {
  e.preventDefault();

  emailjs.sendForm("service_lgozq4v", "template_8sjln8m", this)
    .then(() => {
      status.className = "form-status success";
      status.innerHTML = "✅ Your message has been sent successfully. I will get back to you soon.";
      setTimeout(() => {
        status.style.display = "none";
      }, 4000);
      form.reset();
    })
    .catch((error) => {
      status.className = "form-status error";
      status.innerHTML = "❌ Something went wrong. Please try again later.";
      console.log(error);
    });
});

function toggleMenu() {
  document.getElementById("resumeMenu").classList.toggle("show");
}

// Close dropdown when clicking outside
window.addEventListener("click", function(e) {
  if (!e.target.closest(".resume-dropdown")) {
    document.getElementById("resumeMenu").classList.remove("show");
  }
});

function toggleMobileMenu() {
  document.getElementById("mobileNav").classList.toggle("active");
}

// AUTO CLOSE MOBILE MENU
document.querySelectorAll('.mobile-nav a').forEach(link => {

  link.addEventListener('click', () => {

    document
      .getElementById('mobileNav')
      .classList.remove('active');

  });

});
