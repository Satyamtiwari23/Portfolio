// Tilt Effect Initialization
function initTilt() {

  const tiltElements =
    document.querySelectorAll('.tilt-element');

  tiltElements.forEach(element => {

    // Prevent duplicate event listeners
    if (element.dataset.tiltInit) return;

    element.dataset.tiltInit = "true";

    const intensity =
      parseFloat(element.dataset.intensity) || 10;

    element.addEventListener('mousemove', (e) => {

      const rect = element.getBoundingClientRect();

      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const mouseX = e.clientX - centerX;
      const mouseY = e.clientY - centerY;

      const rotateX =
        (mouseY / (rect.height / 2)) * -intensity;

      const rotateY =
        (mouseX / (rect.width / 2)) * intensity;

      element.style.transform =
        `perspective(1000px)
       rotateX(${rotateX}deg)
       rotateY(${rotateY}deg)
       scale3d(1,1,1)`;

    });

    element.addEventListener('mouseleave', () => {

      element.style.transform =
        'perspective(1000px) rotateX(0deg) rotateY(0deg)';

    });

  });

}

console.log("SCRIPT IS LOADED");
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
initTilt();

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
if (form) {
  form.addEventListener("submit", function (e) {
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
}

function toggleMenu() {
  document.getElementById("resumeMenu").classList.toggle("show");
}

// Close dropdown when clicking outside
window.addEventListener("click", function (e) {
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


const reviewForm = document.getElementById("reviewForm");

if (reviewForm) {

  reviewForm.addEventListener("submit", async (e) => {

    e.preventDefault();

    const selectedRating =
      document.querySelector(
        'input[name="rating"]:checked'
      );

    if (!selectedRating) {

      const msg =
        document.getElementById("reviewMessage");
    
      msg.className = "error";
      msg.style.display = "block";
      msg.textContent =
        "✗ Please select a rating before submitting.";
    
      setTimeout(() => {
    
        msg.style.display = "none";
    
      }, 5000);
    
      return;
    }
    const data = {

      name: document.getElementById("reviewerName").value,

      email: document.getElementById("email").value.trim(),

      country: document.getElementById("country").value,

      service: document.getElementById("service").value,

      review: document.getElementById("reviewText").value,

      rating: selectedRating.value,

      recommend: document.getElementById("recommend").value,
    };
    console.log(data);
    try {

      const res = await fetch(
        "http://localhost:8000/api/reviews",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(data)
        }
      );

      const result = await res.json();

      console.log(result);

      const msg = document.getElementById("reviewMessage");

      msg.className = "success";
      msg.style.display = "block";
      msg.textContent = "✓ Review submitted successfully.";
      setTimeout(() => {
          msg.style.display = "none";
      }, 5000);
      
      reviewForm.reset();
      await loadReviews();

    } catch (err) {

      console.log(err);

      const msg = document.getElementById("reviewMessage");

      msg.className = "error";
      msg.style.display = "block";
      msg.textContent = "✗ Failed to submit review. Please try again.";
      setTimeout(() => {
          msg.style.display = "none";
      }, 5000);
    }

  });

}

async function loadReviews() {

  try {

    const res = await fetch(
      "http://localhost:8000/api/reviews"
    );

    const reviews = await res.json();

    const reviewsList =
      document.getElementById("reviewsList");

    if (!reviews.length) {
      reviewsList.innerHTML =
        "<h3>No Reviews Yet</h3>";
      return;
    }

    reviewsList.innerHTML = "";

    reviews.forEach(review => {

      reviewsList.innerHTML += `
    
            <div class="review-card tilt-element"
                 data-intensity="8">
    
                <h3 class="skill-category">
                    ${review.name}
                </h3>
    
                <div class="skill-list">
    
                    <span class="skill-tag">
                        ${review.country}
                    </span>
    
                    <span class="skill-tag">
                        ${review.service}
                    </span>
    
                    <span class="skill-tag">
                        ⭐ ${review.rating}/5
                    </span>
    
                </div>
    
                <p class="review-text">
                    "${review.review}"
                </p>
    
            </div>
    
          `;

    });

    initTilt();

  } catch (err) {

    console.log(err);

  }

}

loadReviews();
