document.addEventListener("DOMContentLoaded", () => {
  // ============================================================
  // INTERSECTION OBSERVER FOR REVEAL ANIMATIONS
  // ============================================================
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          revealObserver.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.2,
      rootMargin: "0px 0px -50px 0px"
    }
  );

  document.querySelectorAll(".reveal").forEach((section) => revealObserver.observe(section));

  // ============================================================
  // STAGGERED ANIMATIONS FOR GRID ITEMS
  // ============================================================
  const staggerObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const items = entry.target.querySelectorAll(".detail-card, .gallery-card, .photo-card, article");
          items.forEach((item, index) => {
            setTimeout(() => {
              item.classList.add("visible");
            }, index * 100); // Stagger by 100ms
          });
          staggerObserver.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.1
    }
  );

  document.querySelectorAll(".details-grid, .gallery-grid, .photos-grid, .rsvp-grid").forEach((grid) => {
    staggerObserver.observe(grid);
  });

  // ============================================================
  // SMOOTH SCROLL FOR NAVIGATION LINKS
  // ============================================================
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      const href = this.getAttribute("href");
      if (href !== "#" && document.querySelector(href)) {
        e.preventDefault();
        const target = document.querySelector(href);
        const headerOffset = 100;
        const elementPosition = target.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.scrollY - headerOffset;

        window.scrollTo({
          top: offsetPosition,
          behavior: "smooth"
        });
      }
    });
  });

  // ============================================================
  // ACTIVE NAVIGATION STATE
  // ============================================================
  const sections = document.querySelectorAll("section[id]");
  const navLinks = document.querySelectorAll(".main-nav a");

  function updateActiveNav() {
    let current = "";
    sections.forEach((section) => {
      const sectionTop = section.offsetTop - 150;
      if (window.scrollY >= sectionTop) {
        current = section.getAttribute("id");
      }
    });

    navLinks.forEach((link) => {
      link.classList.remove("active");
      if (link.getAttribute("href") === `#${current}`) {
        link.classList.add("active");
      }
    });
  }

  window.addEventListener("scroll", updateActiveNav);
  updateActiveNav();

  // ============================================================
  // SCROLL PROGRESS BAR
  // ============================================================
  const scrollProgressBar = document.querySelector('.scroll-progress-bar');

  function updateScrollProgress() {
    const windowHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrolled = (window.scrollY / windowHeight) * 100;
    if (scrollProgressBar) {
      scrollProgressBar.style.width = scrolled + '%';
    }
  }

  window.addEventListener('scroll', updateScrollProgress, { passive: true });
  updateScrollProgress();

  // ============================================================
  // SCROLL MOMENTUM DETECTION
  // Enhances reveal animations with natural momentum-based timing
  // ============================================================
  let scrollMomentum = 0;
  let lastScrollY = window.scrollY;

  window.addEventListener('scroll', () => {
    scrollMomentum = window.scrollY - lastScrollY;
    lastScrollY = window.scrollY;
    document.documentElement.style.setProperty('--scroll-momentum', scrollMomentum);
  }, { passive: true });

  // ============================================================
  // PARALLAX EFFECT ON HERO IMAGES
  // ============================================================
  const heroPhotos = document.querySelectorAll(".hero-photos .photo-card img, .story-photo-stack img");

  function parallaxEffect() {
    const scrolled = window.scrollY;
    heroPhotos.forEach((photo, index) => {
      const speed = 0.5 + index * 0.1;
      const yPos = -(scrolled * speed);
      photo.style.transform = `translateY(${yPos * 0.15}px) scale(1)`;
    });
  }

  window.addEventListener("scroll", () => {
    requestAnimationFrame(parallaxEffect);
  });

  // ============================================================
  // SCROLL TO TOP BUTTON
  // ============================================================
  const scrollToTopBtn = document.createElement("button");
  scrollToTopBtn.className = "scroll-to-top";
  scrollToTopBtn.innerHTML = "↑";
  scrollToTopBtn.setAttribute("aria-label", "Scroll to top");
  document.body.appendChild(scrollToTopBtn);

  window.addEventListener("scroll", () => {
    if (window.scrollY > 500) {
      scrollToTopBtn.classList.add("visible");
    } else {
      scrollToTopBtn.classList.remove("visible");
    }
  });

  scrollToTopBtn.addEventListener("click", () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  });

  // ============================================================
  // COUNTDOWN TIMER
  // ============================================================
  function initCountdown() {
    const weddingDate = new Date("2026-11-07T17:00:00").getTime();
    const heroContent = document.querySelector(".hero-content");

    // Create countdown HTML
    const countdownHTML = `
      <div class="countdown">
        <div class="countdown-item">
          <span class="countdown-number" id="days">0</span>
          <span class="countdown-label">Days</span>
        </div>
        <div class="countdown-item">
          <span class="countdown-number" id="hours">0</span>
          <span class="countdown-label">Hours</span>
        </div>
        <div class="countdown-item">
          <span class="countdown-number" id="minutes">0</span>
          <span class="countdown-label">Minutes</span>
        </div>
        <div class="countdown-item">
          <span class="countdown-number" id="seconds">0</span>
          <span class="countdown-label">Seconds</span>
        </div>
      </div>
    `;

    // Insert countdown before hero CTA
    const heroCta = heroContent.querySelector(".hero-cta");
    heroCta.insertAdjacentHTML("beforebegin", countdownHTML);

    // Update countdown
    function updateCountdown() {
      const now = new Date().getTime();
      const distance = weddingDate - now;

      if (distance > 0) {
        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        document.getElementById("days").textContent = days;
        document.getElementById("hours").textContent = hours;
        document.getElementById("minutes").textContent = minutes;
        document.getElementById("seconds").textContent = seconds;
      } else {
        document.querySelector(".countdown").innerHTML = `
          <div class="countdown-item">
            <span class="countdown-number">💒</span>
            <span class="countdown-label">Just Married!</span>
          </div>
        `;
      }
    }

    updateCountdown();
    setInterval(updateCountdown, 1000);
  }

  // Initialize countdown only if on main page
  if (document.querySelector('.hero-content')) {
    initCountdown();
  }

  // ============================================================
  // PHOTO LIGHTBOX
  // ============================================================
  const galleryImages = document.querySelectorAll(".gallery-card, .photo-card");
  let currentImageIndex = 0;
  let imageArray = [];

  // Check if lightbox already exists in HTML, if not create it
  let lightbox = document.getElementById("lightbox");
  if (!lightbox) {
    const lightboxHTML = `
      <div class="lightbox" id="lightbox">
        <div class="lightbox-content">
          <button class="lightbox-close" aria-label="Close lightbox">
            <span>×</span>
          </button>
          <img id="lightbox-image" src="" alt="">
          <div class="lightbox-navigation">
            <button class="lightbox-prev" aria-label="Previous image">
              <span>‹</span>
            </button>
            <button class="lightbox-next" aria-label="Next image">
              <span>›</span>
            </button>
          </div>
        </div>
        <div class="lightbox-overlay"></div>
      </div>
    `;
    document.body.insertAdjacentHTML("beforeend", lightboxHTML);
    lightbox = document.getElementById("lightbox");
  }

  const lightboxImg = lightbox.querySelector("#lightbox-image");
  const closeBtn = lightbox.querySelector(".lightbox-close");
  const prevBtn = lightbox.querySelector(".lightbox-prev");
  const nextBtn = lightbox.querySelector(".lightbox-next");

  // Build image array
  galleryImages.forEach((card, index) => {
    const img = card.querySelector("img");
    if (img) {
      // Use full-resolution image if available, otherwise use thumbnail
      const fullResUrl = img.dataset.full || img.src;
      imageArray.push(fullResUrl);
      card.addEventListener("click", () => {
        currentImageIndex = index;
        openLightbox(fullResUrl);
      });
      card.style.cursor = "pointer";
    }
  });

  function openLightbox(src) {
    lightboxImg.src = src;
    lightbox.classList.add("active");
    document.body.style.overflow = "hidden";
  }

  function closeLightbox() {
    lightbox.classList.remove("active");
    document.body.style.overflow = "";
  }

  function showNextImage() {
    currentImageIndex = (currentImageIndex + 1) % imageArray.length;
    loadImageWithFallback(imageArray[currentImageIndex]);
  }

  function showPrevImage() {
    currentImageIndex = (currentImageIndex - 1 + imageArray.length) % imageArray.length;
    loadImageWithFallback(imageArray[currentImageIndex]);
  }

  function loadImageWithFallback(src) {
    lightboxImg.src = src;

    // Add error handling for image loading
    lightboxImg.onerror = function() {
      console.warn('Failed to load image:', src);
      // Try to show a fallback or error message
      this.style.display = 'none';

      // Create error message
      const errorMsg = document.createElement('div');
      errorMsg.textContent = 'Unable to load image';
      errorMsg.style.cssText = `
        color: white;
        text-align: center;
        padding: 2rem;
        font-size: 1.2rem;
        background: rgba(255, 59, 48, 0.8);
        border-radius: 12px;
        margin: 2rem;
      `;

      this.parentNode.appendChild(errorMsg);
    };

    lightboxImg.onload = function() {
      // Clear any previous error messages
      const existingError = this.parentNode.querySelector('div[style*="Unable to load image"]');
      if (existingError) {
        existingError.remove();
      }
      this.style.display = 'block';
    };
  }

  closeBtn.addEventListener("click", closeLightbox);
  nextBtn.addEventListener("click", showNextImage);
  prevBtn.addEventListener("click", showPrevImage);

  lightbox.addEventListener("click", (e) => {
    if (e.target === lightbox) {
      closeLightbox();
    }
  });

  // Keyboard navigation
  document.addEventListener("keydown", (e) => {
    if (!lightbox.classList.contains("active")) return;

    if (e.key === "Escape") closeLightbox();
    if (e.key === "ArrowRight") showNextImage();
    if (e.key === "ArrowLeft") showPrevImage();
  });

  // Touch navigation for mobile
  let touchStartX = 0;
  let touchEndX = 0;

  lightbox.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
  }, { passive: true });

  lightbox.addEventListener('touchend', (e) => {
    touchEndX = e.changedTouches[0].screenX;
    handleSwipe();
  }, { passive: true });

  function handleSwipe() {
    const swipeThreshold = 50;
    const diff = touchStartX - touchEndX;

    if (Math.abs(diff) > swipeThreshold) {
      if (diff > 0) {
        // Swipe left - next image
        showNextImage();
      } else {
        // Swipe right - previous image
        showPrevImage();
      }
    }
  }

  // ============================================================
  // LAZY LOADING IMAGES
  // ============================================================
  const images = document.querySelectorAll("img");

  const imageObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.classList.add("loading");

          // Simulate loading state
          const tempSrc = img.src;
          img.src = "";

          const newImg = new Image();
          newImg.onload = () => {
            img.src = tempSrc;
            img.classList.remove("loading");
          };
          newImg.src = tempSrc;

          observer.unobserve(img);
        }
      });
    },
    {
      rootMargin: "50px"
    }
  );

  images.forEach((img) => imageObserver.observe(img));

  // ============================================================
  // TIMELINE ANIMATIONS
  // ============================================================
  const timelineObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const items = entry.target.querySelectorAll(".timeline-item");
          items.forEach((item, index) => {
            setTimeout(() => {
              item.classList.add("visible");
            }, index * 200); // Stagger by 200ms
          });
          timelineObserver.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.1
    }
  );

  const timelineContainer = document.querySelector(".timeline-container");
  if (timelineContainer) {
    timelineObserver.observe(timelineContainer);
  }

  // ============================================================
  // MOBILE MENU (if needed in future)
  // ============================================================
  // Reserved for future hamburger menu implementation

  // ============================================================
  // RSVP FORM - Dynamic guest forms and submission
  // ============================================================

  // RSVP Date Gate - Form disabled until July 1, 2026
  const RSVP_UNLOCK_DATE = new Date('2026-07-01T00:00:00Z').getTime();

  function checkRsvpAvailability() {
    const now = Date.now();
    const formContainer = document.querySelector('.rsvp-form-container');
    const overlay = document.getElementById('rsvpDisabledOverlay');

    if (!formContainer || !overlay) return;

    if (now < RSVP_UNLOCK_DATE) {
      formContainer.classList.add('disabled');
      overlay.classList.remove('hidden');
    } else {
      formContainer.classList.remove('disabled');
      overlay.classList.add('hidden');
    }
  }

  // Check RSVP availability on page load
  checkRsvpAvailability();

  const guestCountBtns = document.querySelectorAll(".guest-count-btn");
  const guestFormsContainer = document.getElementById("guestFormsContainer");
  const rsvpForm = document.getElementById("rsvpForm");
  const submitBtn = rsvpForm?.querySelector(".submit-btn");
  const formSuccess = document.getElementById("formSuccess");
  const formError = document.getElementById("formError");

  let currentGuestCount = 1;

  // Dinner options configuration
  const dinnerOptions = [
    {
      value: "vegetarian",
      name: "Wild Mushroom Risotto",
      description: "Pine nuts, mascarpone cheese, farm herbs"
    },
    {
      value: "fish",
      name: "Roasted Branzino",
      description: "Israeli couscous, tomato coulis"
    },
    {
      value: "meat",
      name: "Braised Short Rib",
      description: "Yukon purée, farm vegetables, chimichurri"
    }
  ];

  // Generate guest form HTML
  function createGuestForm(guestNumber) {
    const guestLabel = guestNumber === 1 ? "Guest 1" : "Guest 2";

    const dinnerCardsHTML = dinnerOptions.map(option => `
      <label class="dinner-card" data-value="${option.value}">
        <input type="radio" name="guest${guestNumber}_dinner" value="${option.value}" required>
        <div class="radio-custom"></div>
        <div class="dinner-info">
          <div class="dinner-name">${option.name}</div>
          <div class="dinner-description">${option.description}</div>
        </div>
      </label>
    `).join('');

    return `
      <div class="guest-form" data-guest="${guestNumber}">
        <div class="guest-form-header">${guestLabel}</div>

        <div class="form-field">
          <label for="guest${guestNumber}_name">Guest Name</label>
          <input type="text" id="guest${guestNumber}_name" name="guest${guestNumber}_name" required placeholder="Full name">
          <div class="error-message">Please enter a name</div>
        </div>

        <div class="form-field">
          <label>Meal Choice</label>
          <div class="dinner-selection">
            ${dinnerCardsHTML}
          </div>
          <div class="error-message">Please select a meal option</div>
        </div>
      </div>
    `;
  }

  // Render guest forms based on count
  function renderGuestForms(count) {
    currentGuestCount = count;
    guestFormsContainer.innerHTML = '';

    for (let i = 1; i <= count; i++) {
      guestFormsContainer.innerHTML += createGuestForm(i);
    }

    // Update container class for layout
    if (count === 2) {
      guestFormsContainer.classList.add('two-columns');
    } else {
      guestFormsContainer.classList.remove('two-columns');
    }

    // Attach dinner card click handlers
    attachDinnerCardHandlers();
  }

  // Handle dinner card interactions
  function attachDinnerCardHandlers() {
    const dinnerCards = document.querySelectorAll('.dinner-card');

    dinnerCards.forEach(card => {
      card.addEventListener('click', function() {
        const radio = this.querySelector('input[type="radio"]');
        const guestNumber = this.closest('.guest-form').dataset.guest;

        // Deselect all cards for this guest
        const allCardsForGuest = this.closest('.dinner-selection').querySelectorAll('.dinner-card');
        allCardsForGuest.forEach(c => c.classList.remove('selected'));

        // Select this card
        this.classList.add('selected');
        radio.checked = true;

        // Clear any validation errors
        const formField = this.closest('.form-field');
        formField.classList.remove('error');

        // Check if all errors are resolved and dismiss flash
        if (rsvpForm) {
          const remainingErrors = rsvpForm.querySelectorAll('.form-field.error').length;
          if (remainingErrors === 0) {
            dismissValidationFlash();
          }
        }
      });
    });
  }

  // Guest count selector functionality
  guestCountBtns?.forEach(btn => {
    btn.addEventListener('click', function() {
      const count = parseInt(this.dataset.count);

      // Update active state
      guestCountBtns.forEach(b => b.classList.remove('active'));
      this.classList.add('active');

      // Render forms
      renderGuestForms(count);
    });
  });

  // Initialize with 1 guest
  if (guestFormsContainer) {
    renderGuestForms(1);
  }

  // ============================================================
  // VALIDATION FLASH NOTIFICATION
  // ============================================================

  // Dismiss validation flash
  function dismissValidationFlash() {
    const existingFlash = document.querySelector('.validation-flash');
    if (existingFlash) {
      // Clear auto-dismiss timer
      if (existingFlash.dataset.timerId) {
        clearTimeout(parseInt(existingFlash.dataset.timerId));
      }

      // Add dismissing animation
      existingFlash.classList.add('dismissing');

      // Remove after animation
      setTimeout(() => {
        existingFlash.remove();
      }, 300);
    }
  }

  // Attach event listeners to flash
  function attachFlashEventListeners(flash) {
    // Close button
    const closeBtn = flash.querySelector('.validation-flash-close');
    closeBtn.addEventListener('click', dismissValidationFlash);

    // Click-to-focus on error items
    const errorItems = flash.querySelectorAll('.validation-flash-item');
    errorItems.forEach(item => {
      item.addEventListener('click', () => {
        const fieldId = item.dataset.field;
        const field = document.getElementById(fieldId) ||
                     document.querySelector(`[name="${fieldId}"]`);

        if (field) {
          field.scrollIntoView({ behavior: 'smooth', block: 'center' });

          // Focus text inputs
          if (field.tagName === 'INPUT' || field.tagName === 'TEXTAREA') {
            setTimeout(() => field.focus(), 500);
          }
        }

        dismissValidationFlash();
      });
    });

    // Keyboard accessibility - Escape to dismiss
    const escapeHandler = (e) => {
      if (e.key === 'Escape') {
        dismissValidationFlash();
        document.removeEventListener('keydown', escapeHandler);
      }
    };
    document.addEventListener('keydown', escapeHandler);
  }

  // Create and show validation flash
  function showValidationFlash(errors) {
    // Remove existing flash if present
    dismissValidationFlash();

    // Create flash element
    const flash = document.createElement('div');
    flash.className = 'validation-flash pulse';
    flash.setAttribute('role', 'alert');
    flash.setAttribute('aria-live', 'assertive');

    // Build header
    const count = errors.length;
    const headerText = count === 1
      ? 'Please complete this required field'
      : `Please complete these ${count} required fields`;

    // Build content
    flash.innerHTML = `
      <div class="validation-flash-header">
        <span class="validation-flash-icon">⚠️</span>
        <span>${headerText}</span>
      </div>
      <ul class="validation-flash-list">
        ${errors.map(error => `
          <li class="validation-flash-item ${error.isDinnerError ? 'dinner-error' : ''}" data-field="${error.fieldId}">
            ${error.isDinnerError ? '🍽️ ' : ''}${error.label}
          </li>
        `).join('')}
      </ul>
      <button class="validation-flash-close" aria-label="Dismiss notification">✕</button>
    `;

    // Append to body
    document.body.appendChild(flash);

    // Attach event listeners
    attachFlashEventListeners(flash);

    // Auto-dismiss after 8 seconds
    const autoDismissTimer = setTimeout(() => {
      dismissValidationFlash();
    }, 8000);

    // Store timer ID for cleanup
    flash.dataset.timerId = autoDismissTimer;
  }

  // Form validation
  function validateForm() {
    let isValid = true;
    const errors = [];
    const formFields = rsvpForm.querySelectorAll('.form-field');

    formFields.forEach(field => {
      const input = field.querySelector('input[type="text"], input[type="email"], textarea');
      const radioGroup = field.querySelector('.dinner-selection');
      const label = field.querySelector('label');

      // Validate text inputs
      if (input && input.hasAttribute('required')) {
        if (!input.value.trim()) {
          field.classList.add('error');
          isValid = false;

          // Collect error info
          errors.push({
            fieldId: input.id,
            label: label ? label.textContent.replace(/\s*\(optional\)\s*/, '').trim() : 'Field'
          });
        } else {
          field.classList.remove('error');
        }
      }

      // Validate radio groups
      if (radioGroup) {
        const radioInputs = radioGroup.querySelectorAll('input[type="radio"]');
        const isChecked = Array.from(radioInputs).some(radio => radio.checked);

        if (!isChecked) {
          field.classList.add('error');
          isValid = false;

          // Determine guest number and field name
          const guestForm = field.closest('.guest-form');
          const guestNumber = guestForm ? guestForm.dataset.guest : '1';
          const radioName = radioInputs[0]?.name || '';

          errors.push({
            fieldId: radioName,
            label: `Guest ${guestNumber} meal choice`,
            isDinnerError: true
          });
        } else {
          field.classList.remove('error');
        }
      }
    });

    // Show flash notification if errors exist
    if (!isValid && errors.length > 0) {
      showValidationFlash(errors);
    }

    return isValid;
  }

  // Clear input validation on input
  rsvpForm?.addEventListener('input', function(e) {
    const field = e.target.closest('.form-field');
    if (field && e.target.value.trim()) {
      field.classList.remove('error');

      // Check if all errors are resolved
      const remainingErrors = rsvpForm.querySelectorAll('.form-field.error').length;
      if (remainingErrors === 0) {
        dismissValidationFlash();
      }
    }
  });

  // Form submission
  rsvpForm?.addEventListener('submit', async function(e) {
    e.preventDefault();

    // Validate form
    if (!validateForm()) {
      // Scroll to first error
      const firstError = rsvpForm.querySelector('.form-field.error');
      if (firstError) {
        firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    // Show loading state
    submitBtn.classList.add('loading');
    submitBtn.disabled = true;
    formSuccess.style.display = 'none';
    formError.style.display = 'none';

    // Collect form data
    const formData = {
      guests: [],
      email: document.getElementById('email').value.trim(),
      comments: document.getElementById('comments').value.trim()
    };

    // Collect guest data
    for (let i = 1; i <= currentGuestCount; i++) {
      const guestName = document.getElementById(`guest${i}_name`).value.trim();
      const dinnerChoice = document.querySelector(`input[name="guest${i}_dinner"]:checked`)?.value;

      formData.guests.push({
        name: guestName,
        dinner: dinnerChoice
      });
    }

    try {
      // Submit to backend
      const response = await fetch('http://localhost:3000/api/rsvp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const result = await response.json();

      if (response.ok) {
        // Show success message
        formSuccess.style.display = 'block';
        formError.style.display = 'none';

        // Reset form
        rsvpForm.reset();
        renderGuestForms(1);

        // Reset guest count selector
        guestCountBtns.forEach(btn => {
          btn.classList.remove('active');
          if (btn.dataset.count === '1') {
            btn.classList.add('active');
          }
        });

        // Scroll to success message
        formSuccess.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        // Handle different error types based on status code
        let errorMessage;

        if (response.status === 403) {
          // Invitee validation failed
          errorMessage = result.error || "We couldn't find your name on the guest list. Please check your spelling or contact us at robbyclairegottesman@gmail.com";
        } else if (response.status === 429) {
          // Rate limit exceeded
          errorMessage = result.error || "Too many RSVP attempts. Please wait and try again later.";
        } else if (response.status === 400) {
          // Validation error
          errorMessage = result.error || "Please check your information and try again.";
        } else {
          // Generic server error
          errorMessage = result.error || "Something went wrong. Please try again or contact us at robbyclairegottesman@gmail.com";
        }

        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error('RSVP submission error:', error);

      // Show error message
      formSuccess.style.display = 'none';
      formError.style.display = 'block';

      const errorText = formError.querySelector('.error-text');
      if (errorText) {
        errorText.textContent = error.message || 'Please try again or contact us at robbyclairegottesman@gmail.com';
      }

      // Scroll to error message
      formError.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } finally {
      // Remove loading state
      submitBtn.classList.remove('loading');
      submitBtn.disabled = false;
    }
  });

  // ============================================================
  // GALLERY TAB FUNCTIONALITY
  // ============================================================
  const galleryTabs = document.querySelectorAll(".tab-btn");
  const galleryPanels = document.querySelectorAll(".tab-pane");

  // Image data for different tabs
  const galleryImageSets = {
    farm: [
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1519740502859-6e56d0e9f85?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1518676590629-2d62476820d17?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1600607216493-c6a14bfe19d2?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1605000757296-b7182a4b8cf5?auto=format&fit=crop&w=800&q=80"
    ],
    winery: [
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1519818360361-9c026ea3589a?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1536924944479-1ba750e911cc?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1566439493786-93726e4cfa9?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1589464124022-635c8c0c3e5?auto=format&fit=crop&w=800&q=80"
    ]
  };

  // Initialize gallery tabs
  function initGalleryTabs() {
    galleryTabs.forEach(tab => {
      tab.addEventListener('click', function() {
        const targetTab = this.dataset.tab;
        switchGalleryTab(targetTab);
      });
    });
  }

  // Switch gallery tab
  function switchGalleryTab(tabName) {
    // Update tab states
    galleryTabs.forEach(tab => {
      tab.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

    // Update panel visibility
    galleryPanels.forEach(panel => {
      panel.classList.remove('active');
    });

    const activePanel = document.getElementById(tabName);
    if (activePanel) {
      activePanel.classList.add('active');

      // Update lightbox with new image set
      updateLightboxForGallery(tabName);
    }
  }

  // Update lightbox for current gallery
  function updateLightboxForGallery(tabName) {
    // Re-attach click handlers to new gallery cards
    const galleryCards = document.querySelectorAll(`#${tabName} .gallery-card`);

    // Reset and rebuild image arrays
    imageArray = [];
    currentImageIndex = 0;

    galleryCards.forEach((card, index) => {
      const img = card.querySelector('img');
      if (img) {
        // Add full-resolution image to array if available, otherwise use thumbnail
        const fullResUrl = img.dataset.full || img.src;
        imageArray.push(fullResUrl);

        // Remove existing listeners to prevent duplicates
        card.replaceWith(card.cloneNode(true));
        const newCard = document.querySelectorAll(`#${tabName} .gallery-card`)[index];

        newCard.addEventListener('click', () => {
          currentImageIndex = index;
          openLightbox(fullResUrl);
        });
        newCard.style.cursor = 'pointer';
      }
    });
  }

  // Initialize gallery if on gallery page
  function initGalleryPage() {
    if (document.querySelector('.gallery-tabs')) {
      initGalleryTabs();
      updateLightboxForGallery('farm'); // Default to farm tab
    }
  }

  // Call gallery initialization
  initGalleryPage();

  console.log("🍷 Robby & Claire's wedding website loaded successfully!");
});
