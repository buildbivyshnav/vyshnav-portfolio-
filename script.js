
/* =========================================================
   Vyshnav Portfolio — script.js
   ========================================================= */

const CONTACT_EMAIL = "vyshnavas716@gmail.com";
const FORM_ENDPOINT = "";

const $ = (selector, context = document) => context.querySelector(selector);
const $$ = (selector, context = document) => [...context.querySelectorAll(selector)];

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const scrollBehavior = reduceMotion ? "auto" : "smooth";

/* Year and email links */
const year = $("#year");
if (year) year.textContent = new Date().getFullYear();

$$("[data-email]").forEach((element) => {
  element.href = "mailto:" + CONTACT_EMAIL;
  const emailText = $("strong", element);
  if (emailText) emailText.textContent = CONTACT_EMAIL;
});

/* Header, scroll progress, back-to-top */
const header = $("#header");
const progress = $("#progress");
const toTop = $("#toTop");

function updateScroll() {
  const y = window.scrollY;
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;

  if (header) header.classList.toggle("scrolled", y > 40);
  if (progress) progress.style.width = (maxScroll > 0 ? (y / maxScroll) * 100 : 0) + "%";
  if (toTop) toTop.classList.toggle("show", y > 600);
}

window.addEventListener("scroll", updateScroll, { passive: true });
window.addEventListener("resize", updateScroll);
updateScroll();

if (toTop) {
  toTop.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: scrollBehavior });
  });
}

/* Mobile menu */
const burger = $("#burger");
const menu = $("#menu");

function setMenu(open) {
  if (!burger || !menu) return;
  menu.classList.toggle("open", open);
  burger.setAttribute("aria-expanded", String(open));
  burger.setAttribute("aria-label", open ? "Close navigation menu" : "Open navigation menu");
}

if (burger && menu) {
  burger.addEventListener("click", () => setMenu(!menu.classList.contains("open")));
  $$("a", menu).forEach((link) => link.addEventListener("click", () => setMenu(false)));

  document.addEventListener("click", (event) => {
    if (menu.classList.contains("open") &&
        !menu.contains(event.target) && !burger.contains(event.target)) {
      setMenu(false);
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") setMenu(false);
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 860) setMenu(false);
  });
}

/* Reveal on scroll */
const revealItems = $$(".reveal");

if ("IntersectionObserver" in window && !reduceMotion) {
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("in");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08 });

  revealItems.forEach((element) => revealObserver.observe(element));
} else {
  revealItems.forEach((element) => element.classList.add("in"));
}

/* Active navigation link */
if ("IntersectionObserver" in window && menu) {
  const navLinks = $$("a[href^='#']", menu);
  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;

      navLinks.forEach((link) => {
        const active = link.getAttribute("href") === "#" + entry.target.id;
        link.classList.toggle("active", active);
        if (active) link.setAttribute("aria-current", "location");
        else link.removeAttribute("aria-current");
      });
    });
  }, { rootMargin: "-35% 0px -55% 0px" });

  navLinks.forEach((link) => {
    const target = $(link.getAttribute("href"));
    if (target) sectionObserver.observe(target);
  });
}

/* Skills marquee */
const track = $(".track");
if (track && track.dataset.duplicated !== "true") {
  track.insertAdjacentHTML("beforeend", track.innerHTML);
  track.dataset.duplicated = "true";
}

/* Work carousel — continuous loop */
const carousel = $("#carousel");

if (carousel) {
  const originalSlides = $$(".slide", carousel);
  const pager = $("#pager");
  const prev = $("#prev");
  const next = $("#next");

  if (originalSlides.length && pager && prev && next) {
    const count = originalSlides.length;

    const cloneSlide = (slide) => {
      const clone = slide.cloneNode(true);
      clone.setAttribute("aria-hidden", "true");
      clone.querySelectorAll("a, button, input, select, textarea, [tabindex]")
        .forEach((el) => el.setAttribute("tabindex", "-1"));
      return clone;
    };

    const before = originalSlides.map(cloneSlide);
    const after = originalSlides.map(cloneSlide);

    before.slice().reverse().forEach((slide) => {
      carousel.insertBefore(slide, carousel.firstChild);
    });
    after.forEach((slide) => carousel.appendChild(slide));

    const allSlides = $$(".slide", carousel);
    const firstOriginalIndex = count;

    let activeIndex = 0;
    let scrollTimer = null;
    let autoplayTimer = null;
    let isRebasing = false;

    const autoplayDelay = 4000;

    pager.replaceChildren();

    originalSlides.forEach((slide, index) => {
      const dot = document.createElement("button");
      dot.type = "button";
      dot.setAttribute("aria-label", "Go to project " + (index + 1));
      dot.addEventListener("click", () => goTo(index, true));
      pager.appendChild(dot);
    });

    const dots = [...pager.children];

    function slideLeft(index) {
      return allSlides[index].offsetLeft - allSlides[0].offsetLeft;
    }

    function nearestSlideIndex() {
      let nearest = 0;
      let distance = Infinity;

      allSlides.forEach((slide, index) => {
        const d = Math.abs(slideLeft(index) - carousel.scrollLeft);
        if (d < distance) {
          distance = d;
          nearest = index;
        }
      });

      return nearest;
    }

    function renderDots(index) {
      activeIndex = ((index % count) + count) % count;

      dots.forEach((dot, i) => {
        const selected = i === activeIndex;
        dot.classList.toggle("active", selected);

        if (selected) dot.setAttribute("aria-current", "true");
        else dot.removeAttribute("aria-current");
      });
    }

    function jumpToPhysicalIndex(index) {
      isRebasing = true;

      const oldBehavior = carousel.style.scrollBehavior;
      carousel.style.scrollBehavior = "auto";
      carousel.scrollLeft = slideLeft(index);

      renderDots(index - firstOriginalIndex);

      requestAnimationFrame(() => {
        carousel.style.scrollBehavior = oldBehavior;
        isRebasing = false;
      });
    }

    function goTo(index, userInitiated = false) {
      const targetIndex = firstOriginalIndex +
        ((index % count) + count) % count;

      renderDots(index);

      carousel.scrollTo({
        left: slideLeft(targetIndex),
        behavior: reduceMotion ? "auto" : "smooth"
      });

      if (userInitiated) restartAutoplay();
    }

    function settleAndLoop() {
      if (isRebasing) return;

      const physicalIndex = nearestSlideIndex();

      if (physicalIndex < firstOriginalIndex) {
        jumpToPhysicalIndex(physicalIndex + count);
      } else if (physicalIndex >= firstOriginalIndex + count) {
        jumpToPhysicalIndex(physicalIndex - count);
      } else {
        renderDots(physicalIndex - firstOriginalIndex);
      }
    }

    function scheduleSettle() {
      if (isRebasing) return;

      if (scrollTimer !== null) {
        window.clearTimeout(scrollTimer);
      }

      scrollTimer = window.setTimeout(settleAndLoop, 140);
    }

    function move(direction) {
      const physicalIndex = nearestSlideIndex();
      const target = Math.max(
        0,
        Math.min(allSlides.length - 1, physicalIndex + direction)
      );

      renderDots(target - firstOriginalIndex);

      carousel.scrollTo({
        left: slideLeft(target),
        behavior: reduceMotion ? "auto" : "smooth"
      });

      restartAutoplay();
    }

    function stopAutoplay() {
      if (autoplayTimer !== null) {
        window.clearInterval(autoplayTimer);
        autoplayTimer = null;
      }
    }

    function startAutoplay() {
      stopAutoplay();

      if (reduceMotion || document.hidden || count < 2) return;

      autoplayTimer = window.setInterval(() => move(1), autoplayDelay);
    }

    function restartAutoplay() {
      stopAutoplay();

      if (!carousel.matches(":hover") &&
          !carousel.contains(document.activeElement)) {
        startAutoplay();
      }
    }

    prev.addEventListener("click", () => move(-1));
    next.addEventListener("click", () => move(1));

    carousel.addEventListener("scroll", scheduleSettle, { passive: true });
    carousel.addEventListener("mouseenter", stopAutoplay);
    carousel.addEventListener("mouseleave", startAutoplay);
    carousel.addEventListener("focusin", stopAutoplay);

    carousel.addEventListener("focusout", (event) => {
      if (!carousel.contains(event.relatedTarget)) startAutoplay();
    });

    carousel.addEventListener("touchstart", stopAutoplay, { passive: true });
    carousel.addEventListener("touchend", startAutoplay, { passive: true });

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) stopAutoplay();
      else startAutoplay();
    });

    carousel.addEventListener("keydown", (event) => {
      if (event.key === "ArrowRight") {
        event.preventDefault();
        move(1);
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        move(-1);
      }
    });

    window.addEventListener("resize", () => {
      goTo(activeIndex, false);
    });

    requestAnimationFrame(() => {
      jumpToPhysicalIndex(firstOriginalIndex);
      startAutoplay();
    });
  }
}

/* Contact form */
const form = $("#contactForm");
const formMessage = $("#formMsg");

function showFormMessage(message, success) {
  if (!formMessage) return;
  formMessage.textContent = message;
  formMessage.className = success ? "ok" : "err";
}

if (form) {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;

    const data = Object.fromEntries(new FormData(form));
    if (data.website) return;

    const button = $("button[type='submit']", form) || $("button", form);

    if (FORM_ENDPOINT) {
      if (button) button.disabled = true;
      showFormMessage("Sending your message…", true);

      try {
        const response = await fetch(FORM_ENDPOINT, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json"
          },
          body: JSON.stringify({
            name: data.name,
            email: data.email,
            message: data.message
          })
        });

        if (!response.ok) throw new Error("Request failed");

        form.reset();
        showFormMessage(
          "Thanks! Your message has been sent. I'll get back to you soon.",
          true
        );
      } catch {
        showFormMessage(
          "Sorry, something went wrong. Please email me directly.",
          false
        );
      } finally {
        if (button) button.disabled = false;
      }
    } else {
      const subject = encodeURIComponent("Portfolio enquiry from " + data.name);
      const body = encodeURIComponent(
        data.message + "\n\n— " + data.name + " (" + data.email + ")"
      );

      showFormMessage(
        "Opening your email app. Send the message there to finish.",
        true
      );

      window.location.href =
        "mailto:" + CONTACT_EMAIL +
        "?subject=" + subject +
        "&body=" + body;
    }
  });
}
