document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("photo-tag-filters");
  const cards = Array.from(document.querySelectorAll(".news-card[data-tags]"));
  if (!container || !cards.length) return;

  const normalize = (value) => value.trim().toLowerCase();
  const yearSections = Array.from(document.querySelectorAll(".main-content details"));

  const tags = Array.from(
    new Set(
      cards.flatMap((card) =>
        (card.dataset.tags || "")
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean)
      )
    )
  ).sort((a, b) => a.localeCompare(b));

  const buttons = [];

  const makeButton = (label, tagValue) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "tag-filter-button";
    button.textContent = label;
    button.dataset.filter = tagValue;
    container.appendChild(button);
    buttons.push(button);
    return button;
  };

  makeButton("All", "all");
  tags.forEach((tag) => makeButton(tag, tag));

  const applyFilter = (tag) => {
    const target = normalize(tag);

    buttons.forEach((button) => {
      button.classList.toggle("is-active", normalize(button.dataset.filter) === target);
    });

    cards.forEach((card) => {
      const cardTags = (card.dataset.tags || "")
        .split(",")
        .map((value) => normalize(value))
        .filter(Boolean);
      const visible = target === "all" || cardTags.includes(target);
      card.hidden = !visible;
    });

    yearSections.forEach((section) => {
      const visibleCards = section.querySelectorAll('.news-card[data-tags]:not([hidden])');
      section.hidden = visibleCards.length === 0;
      if (visibleCards.length > 0 && target !== "all") {
        section.open = true;
      }
    });
  };

  container.addEventListener("click", (event) => {
    const button = event.target.closest(".tag-filter-button");
    if (!button) return;
    applyFilter(button.dataset.filter || "all");
  });

  applyFilter("all");
});
