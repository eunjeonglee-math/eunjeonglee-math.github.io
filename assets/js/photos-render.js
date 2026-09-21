(() => {
  "use strict";

  const grid = document.querySelector("[data-photo-grid]");
  if (!grid) return;

  const data = window.PHOTO_DATA;

  function showError(error) {
    console.error("Could not render photo data.", error);
    const status = document.querySelector("[data-photos-status]");
    if (status) {
      status.hidden = false;
      status.classList.add("is-error");
      status.textContent = "The photo gallery could not be loaded. Please check the photo data file.";
    }
  }

  function validateData() {
    if (!data || !Array.isArray(data.events) || !data.events.length || !data.countries || !data.people) {
      throw new Error("PHOTO_DATA is missing or malformed.");
    }
    if (typeof data.lastUpdated !== "string" || !data.lastUpdated.trim()) {
      throw new Error("PHOTO_DATA.lastUpdated is required.");
    }

    data.events.forEach((event, eventIndex) => {
      if (!Number.isInteger(event.year) || !event.country || !data.countries[event.country]) {
        throw new Error(`Photo event ${eventIndex + 1} has an invalid year or country.`);
      }
      if (!event.title || !event.details || !Array.isArray(event.people) || !Array.isArray(event.images) || !event.images.length) {
        throw new Error(`Photo event ${eventIndex + 1} is missing a required field.`);
      }
      if (event.carouselLabel && typeof event.carouselLabel !== "string") {
        throw new Error(`Photo event ${eventIndex + 1} has an invalid carouselLabel value.`);
      }
      event.people.forEach((personId) => {
        if (!data.people[personId]) throw new Error(`Unknown person key: ${personId}`);
      });
      event.images.forEach((image, imageIndex) => {
        if (!image.src || !image.alt || !Number.isInteger(image.width) || image.width <= 0 || !Number.isInteger(image.height) || image.height <= 0) {
          throw new Error(`Image ${imageIndex + 1} in "${event.title}" is incomplete.`);
        }
      });
    });
  }

  function externalLink(url) {
    const link = document.createElement("a");
    link.href = url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    return link;
  }

  function createImageLink(image, { carousel = false, hidden = false, lazy = true } = {}) {
    const link = externalLink(image.src);
    link.rel = "noopener";
    if (carousel) {
      link.className = `photo-carousel-slide${image.height > image.width ? " is-portrait" : ""}`;
      link.dataset.carouselSlide = "";
    }
    if (hidden) link.hidden = true;

    const element = document.createElement("img");
    element.src = image.src;
    element.alt = image.alt;
    element.width = image.width;
    element.height = image.height;
    if (lazy) element.loading = "lazy";
    link.append(element);
    return link;
  }

  function countWord(count) {
    const words = ["Zero", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten"];
    return words[count] || String(count);
  }

  function createCarousel(event, eventIndex) {
    const carousel = document.createElement("div");
    carousel.className = "photo-carousel";
    carousel.dataset.photoCarousel = "";
    carousel.setAttribute("role", "group");
    carousel.setAttribute("aria-roledescription", "carousel");
    carousel.setAttribute("aria-label", event.carouselLabel || `${countWord(event.images.length)} photos from ${event.title}`);

    event.images.forEach((image, imageIndex) => {
      carousel.append(
        createImageLink(image, {
          carousel: true,
          hidden: imageIndex !== 0,
          lazy: eventIndex !== 0 || imageIndex !== 0,
        }),
      );
    });

    const previous = document.createElement("button");
    previous.className = "photo-carousel-arrow photo-carousel-prev";
    previous.type = "button";
    previous.dataset.carouselPrev = "";
    previous.setAttribute("aria-label", "Previous photo");
    const previousIcon = document.createElement("span");
    previousIcon.setAttribute("aria-hidden", "true");
    previousIcon.textContent = "‹";
    previous.append(previousIcon);

    const next = document.createElement("button");
    next.className = "photo-carousel-arrow photo-carousel-next";
    next.type = "button";
    next.dataset.carouselNext = "";
    next.setAttribute("aria-label", "Next photo");
    const nextIcon = document.createElement("span");
    nextIcon.setAttribute("aria-hidden", "true");
    nextIcon.textContent = "›";
    next.append(nextIcon);

    const status = document.createElement("span");
    status.className = "photo-carousel-status";
    status.dataset.carouselStatus = "";
    status.setAttribute("aria-live", "polite");
    status.textContent = `1 / ${event.images.length}`;
    carousel.append(previous, next, status);
    return carousel;
  }

  function createTitle(event) {
    const title = document.createElement("h2");
    if (event.url) {
      const link = externalLink(event.url);
      link.textContent = event.title;
      title.append(link);
    } else {
      title.textContent = event.title;
    }
    return title;
  }

  function createTag(type, value, label) {
    const button = document.createElement("button");
    button.className = `photo-tag photo-tag-${type}`;
    button.type = "button";
    button.dataset.photoTag = "";
    button.dataset.tagType = type;
    button.dataset.tagValue = String(value);
    button.setAttribute("aria-pressed", "false");
    button.textContent = label;
    return button;
  }

  function createCaption(event) {
    const caption = document.createElement("div");
    caption.className = "photo-caption";

    if (event.images.length > 1) {
      const headingRow = document.createElement("div");
      headingRow.className = "photo-heading-row";
      const count = document.createElement("span");
      count.className = "photo-count";
      count.textContent = `${event.images.length} photos`;
      headingRow.append(createTitle(event), count);
      caption.append(headingRow);
    } else {
      caption.append(createTitle(event));
    }

    const details = document.createElement("p");
    details.textContent = event.details;

    const tags = document.createElement("div");
    tags.className = "photo-tags";
    tags.setAttribute("aria-label", "Photo tags");
    tags.append(
      createTag("year", event.year, String(event.year)),
      createTag("country", event.country, data.countries[event.country]),
      ...event.people.map((personId) => createTag("person", personId, data.people[personId])),
    );

    caption.append(details, tags);
    return caption;
  }

  function createPhotoCard(event, eventIndex) {
    const isCarousel = event.images.length > 1;
    const isPortrait = !isCarousel && event.images[0].height > event.images[0].width;
    const article = document.createElement("article");
    article.className = `photo-card${isCarousel ? " has-carousel" : ""}${isPortrait ? " is-portrait" : ""}`;
    article.dataset.photo = "";
    article.dataset.photoCount = String(event.images.length);
    article.dataset.year = String(event.year);
    article.dataset.country = event.country;
    article.dataset.people = event.people.join(" ");

    if (isCarousel) {
      article.append(createCarousel(event, eventIndex));
    } else {
      article.append(createImageLink(event.images[0], { lazy: eventIndex !== 0 }));
    }
    article.append(createCaption(event));
    return article;
  }

  try {
    validateData();
    grid.replaceChildren(...data.events.map(createPhotoCard));

    const totalPhotos = data.events.reduce((sum, event) => sum + event.images.length, 0);
    const years = data.events.map((event) => event.year);
    const yearRange = `${Math.min(...years)}–${Math.max(...years)}`;
    document.querySelectorAll("[data-photo-result-count]").forEach((element) => {
      element.textContent = `${totalPhotos} photos · ${data.events.length} events`;
    });
    document.querySelectorAll("[data-photo-year-range]").forEach((element) => {
      element.textContent = yearRange;
    });
    document.querySelectorAll("[data-photo-updated]").forEach((element) => {
      element.textContent = data.lastUpdated;
    });
    const status = document.querySelector("[data-photos-status]");
    if (status) status.hidden = true;
  } catch (error) {
    showError(error);
  }
})();
