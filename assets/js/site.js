document.documentElement.classList.add("js");

const navToggle = document.querySelector("[data-nav-toggle]");
const siteNav = document.querySelector("[data-site-nav]");

if (navToggle && siteNav) {
  navToggle.addEventListener("click", () => {
    const isOpen = siteNav.classList.toggle("is-open");
    navToggle.setAttribute("aria-expanded", String(isOpen));
    navToggle.setAttribute("aria-label", isOpen ? "Close navigation" : "Open navigation");
  });

  siteNav.addEventListener("click", (event) => {
    if (event.target.closest("a")) {
      siteNav.classList.remove("is-open");
      navToggle.setAttribute("aria-expanded", "false");
      navToggle.setAttribute("aria-label", "Open navigation");
    }
  });
}

const photoCards = [...document.querySelectorAll("[data-photo]")];
const photoTagButtons = [...document.querySelectorAll("[data-photo-tag]")];
const activePhotoTags = document.querySelector("[data-photo-active-tags]");
const photoResultCount = document.querySelector("[data-photo-result-count]");
const photoEmptyState = document.querySelector("[data-photo-empty]");
const photoClear = document.querySelector("[data-photo-clear]");
const photoFilterBar = document.querySelector("[data-photo-filter-bar]");
const selectedPhotoTags = new Map();

function getPhotoTagKey(type, value) {
  return `${type}:${value}`;
}

function cardHasPhotoTag(card, type, value) {
  if (type === "year") return card.dataset.year === value;
  if (type === "country") return card.dataset.country === value;
  if (type === "person") {
    return (card.dataset.people || "").split(/\s+/).filter(Boolean).includes(value);
  }
  return false;
}

function renderActivePhotoTags() {
  if (!activePhotoTags) return;

  activePhotoTags.replaceChildren();
  if (!selectedPhotoTags.size) {
    const placeholder = document.createElement("span");
    placeholder.className = "photo-filter-placeholder";
    placeholder.textContent = "Click a tag on any photo to filter.";
    activePhotoTags.append(placeholder);
    return;
  }

  [...selectedPhotoTags.entries()].forEach(([key, tag], index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `photo-tag active-photo-tag photo-tag-${tag.type}`;
    button.dataset.activePhotoTag = key;
    button.setAttribute("aria-label", `Remove ${tag.label} filter`);

    const label = document.createElement("span");
    label.textContent = tag.label;
    const remove = document.createElement("span");
    remove.className = "active-photo-tag-remove";
    remove.setAttribute("aria-hidden", "true");
    remove.textContent = "×";

    button.append(label, remove);
    button.addEventListener("click", () => {
      selectedPhotoTags.delete(key);
      updatePhotoGallery();

      const remainingButtons = [...activePhotoTags.querySelectorAll("[data-active-photo-tag]")];
      const nextButton = remainingButtons[Math.min(index, remainingButtons.length - 1)];
      (nextButton || photoFilterBar)?.focus({ preventScroll: true });
    });
    activePhotoTags.append(button);
  });
}

function filterPhotos() {
  if (!photoCards.length) return;

  const selectedTags = [...selectedPhotoTags.values()];
  let visibleEvents = 0;
  let visiblePhotos = 0;

  photoCards.forEach((card) => {
    const show = selectedTags.every((tag) => cardHasPhotoTag(card, tag.type, tag.value));

    card.hidden = !show;
    if (show) {
      visibleEvents += 1;
      visiblePhotos += Number(card.dataset.photoCount || 1);
    }
  });

  if (photoResultCount) {
    const photoLabel = visiblePhotos === 1 ? "photo" : "photos";
    const eventLabel = visibleEvents === 1 ? "event" : "events";
    photoResultCount.textContent = `${visiblePhotos} ${photoLabel} · ${visibleEvents} ${eventLabel}`;
  }

  photoEmptyState?.classList.toggle("is-visible", visibleEvents === 0);
}

function updatePhotoGallery() {
  photoTagButtons.forEach((button) => {
    const { tagType: type, tagValue: value } = button.dataset;
    const isSelected = selectedPhotoTags.has(getPhotoTagKey(type, value));
    const typeLabel = type.charAt(0).toUpperCase() + type.slice(1);
    const label = button.textContent.trim();

    button.setAttribute("aria-pressed", String(isSelected));
    button.setAttribute(
      "aria-label",
      `${isSelected ? "Remove" : "Filter photos by"} ${typeLabel}: ${label}`,
    );
  });

  if (photoClear) photoClear.hidden = selectedPhotoTags.size === 0;
  renderActivePhotoTags();
  filterPhotos();
}

photoTagButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const { tagType: type, tagValue: value } = button.dataset;
    const key = getPhotoTagKey(type, value);

    if (selectedPhotoTags.has(key)) {
      selectedPhotoTags.delete(key);
    } else {
      selectedPhotoTags.set(key, { type, value, label: button.textContent.trim() });
    }
    updatePhotoGallery();
  });
});

photoClear?.addEventListener("click", () => {
  selectedPhotoTags.clear();
  updatePhotoGallery();
  photoFilterBar?.focus({ preventScroll: true });
});

updatePhotoGallery();

document.querySelectorAll("[data-photo-carousel]").forEach((carousel) => {
  const slides = [...carousel.querySelectorAll("[data-carousel-slide]")];
  if (!slides.length) return;

  const previousButton = carousel.querySelector("[data-carousel-prev]");
  const nextButton = carousel.querySelector("[data-carousel-next]");
  const status = carousel.querySelector("[data-carousel-status]");
  let currentIndex = 0;

  slides.forEach((slide, slideIndex) => {
    const description = slide.querySelector("img")?.alt || "Event photo";
    slide.setAttribute("aria-label", `Photo ${slideIndex + 1} of ${slides.length}: ${description}`);
  });

  function showSlide(index, moveFocus = false) {
    currentIndex = (index + slides.length) % slides.length;
    slides.forEach((slide, slideIndex) => {
      const isCurrent = slideIndex === currentIndex;
      slide.hidden = !isCurrent;
      slide.setAttribute("aria-hidden", String(!isCurrent));
      slide.tabIndex = isCurrent ? 0 : -1;
    });

    if (status) {
      const description = slides[currentIndex].querySelector("img")?.alt || "Event photo";
      status.textContent = `${currentIndex + 1} / ${slides.length}`;
      status.setAttribute(
        "aria-label",
        `Photo ${currentIndex + 1} of ${slides.length}: ${description}`,
      );
    }
    if (moveFocus) slides[currentIndex].focus({ preventScroll: true });
  }

  previousButton?.addEventListener("click", () => showSlide(currentIndex - 1));
  nextButton?.addEventListener("click", () => showSlide(currentIndex + 1));
  carousel.addEventListener("keydown", (event) => {
    const moveFocus = slides.includes(event.target);
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      showSlide(currentIndex - 1, moveFocus);
    }
    if (event.key === "ArrowRight") {
      event.preventDefault();
      showSlide(currentIndex + 1, moveFocus);
    }
  });

  showSlide(0);
});

document.querySelector("[data-print-cv]")?.addEventListener("click", () => {
  window.print();
});

const tocLinks = [...document.querySelectorAll("[data-toc] a[href^='#']")];
const observedSections = tocLinks
  .map((link) => document.querySelector(link.getAttribute("href")))
  .filter(Boolean);

if (tocLinks.length && observedSections.length && "IntersectionObserver" in window) {
  const sectionObserver = new IntersectionObserver(
    (entries) => {
      const visibleEntries = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

      if (!visibleEntries.length) return;
      const activeId = `#${visibleEntries[0].target.id}`;
      tocLinks.forEach((link) => {
        link.classList.toggle("is-active", link.getAttribute("href") === activeId);
      });
    },
    { rootMargin: "-18% 0px -68% 0px", threshold: 0.01 },
  );

  observedSections.forEach((section) => sectionObserver.observe(section));
}
