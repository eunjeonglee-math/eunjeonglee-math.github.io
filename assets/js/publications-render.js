(() => {
  "use strict";

  const pageRoot = document.querySelector("[data-publications-list]");
  const cvRoot = document.querySelector("[data-cv-publications]");
  if (!pageRoot && !cvRoot) return;

  const data = window.PUBLICATION_DATA;

  function showError(error) {
    console.error("Could not render publication data.", error);
    document.querySelectorAll("[data-publications-status]").forEach((status) => {
      status.hidden = false;
      status.classList.add("is-error");
      status.textContent = "The publication list could not be loaded. Please check the publication data file.";
    });
  }

  function validateData() {
    if (!data || !Array.isArray(data.works) || !data.works.length || !data.coauthors) {
      throw new Error("PUBLICATION_DATA is missing or malformed.");
    }
    if (typeof data.lastUpdated !== "string" || !data.lastUpdated.trim()) {
      throw new Error("PUBLICATION_DATA.lastUpdated is required.");
    }

    const allowedCategories = new Set(["submitted", "published", "unpublished"]);

    data.works.forEach((work, index) => {
      if (!work.title || !work.url || !Array.isArray(work.authors) || !work.category) {
        throw new Error(`Publication ${index + 1} is missing a required field.`);
      }
      if (!allowedCategories.has(work.category)) {
        throw new Error(`Publication ${index + 1} has an unknown category: ${work.category}`);
      }
      if (work.titleHtml && typeof work.titleHtml !== "string") {
        throw new Error(`Publication ${index + 1} has an invalid titleHtml value.`);
      }
      work.authors.forEach((authorId) => {
        if (!data.coauthors[authorId]) {
          throw new Error(`Unknown coauthor key: ${authorId}`);
        }
      });
      if (work.category === "published" && (!Number.isInteger(work.year) || !work.venue || !work.citation)) {
        throw new Error(`Published work "${work.title}" is missing publication details.`);
      }
    });

    if (!data.works.some((work) => work.category === "published")) {
      throw new Error("At least one published work is required to calculate the publication-year range.");
    }
  }

  function externalLink(url, className) {
    const link = document.createElement("a");
    link.href = url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    if (className) link.className = className;
    return link;
  }

  function appendAuthors(parent, work) {
    if (!work.authors.length) return;

    const line = document.createElement("p");
    line.className = "pub-authors";

    const prefix = document.createElement("span");
    prefix.className = "pub-authors-prefix";
    prefix.textContent = "with";

    line.append(prefix, document.createTextNode(" "));

    work.authors.forEach((authorId, index) => {
      const author = data.coauthors[authorId];
      if (index > 0) {
        const separator = index === work.authors.length - 1
          ? (work.authors.length === 2 ? " and " : ", and ")
          : ", ";
        line.append(document.createTextNode(separator));
      }

      if (author.homepage) {
        const homepage = externalLink(author.homepage, "coauthor-name");
        homepage.setAttribute("aria-label", `${author.name}'s homepage (opens in a new tab)`);
        homepage.textContent = author.name;
        line.append(homepage);
      } else {
        const name = document.createElement("span");
        name.textContent = author.name;
        line.append(name);
      }
    });

    parent.append(line);
  }

  function createPublicationCard(work, number) {
    const article = document.createElement("article");
    article.className = `publication-card${number ? "" : " is-unnumbered"}`;

    if (number) {
      const numberBadge = document.createElement("span");
      numberBadge.className = "pub-number";
      numberBadge.textContent = String(number);
      article.append(numberBadge);
    }

    const content = document.createElement("div");
    const title = document.createElement("h3");
    title.className = "pub-title";
    const titleLink = externalLink(work.url);
    if (work.titleHtml) {
      titleLink.innerHTML = work.titleHtml;
    } else {
      titleLink.textContent = work.title;
    }
    title.append(titleLink);
    content.append(title);

    appendAuthors(content, work);

    if (work.venue) {
      const venue = document.createElement("p");
      venue.className = "pub-venue";
      const journal = document.createElement("em");
      journal.textContent = work.venue;
      venue.append(journal, work.citation.startsWith(",") ? work.citation : ` ${work.citation}`);
      content.append(venue);
    }

    if (work.arxiv) {
      const links = document.createElement("div");
      links.className = "pub-links";
      const arxiv = externalLink(`https://arxiv.org/abs/${work.arxiv}`);
      arxiv.textContent = `arXiv:${work.arxiv}`;
      links.append(arxiv);
      content.append(links);
    }

    article.append(content);
    return article;
  }

  function createPublicationGroup(id, titleText, works, numberByWork) {
    const section = document.createElement("section");
    section.className = "publication-group";
    section.id = id;
    section.setAttribute("aria-labelledby", `${id}-title`);

    const title = document.createElement("h2");
    title.className = "publication-year";
    title.id = `${id}-title`;
    title.textContent = titleText;
    section.append(title);

    works.forEach((work) => section.append(createPublicationCard(work, numberByWork.get(work))));
    return section;
  }

  function renderPublicationPage(numberByWork) {
    if (!pageRoot) return;

    const groups = [];
    const submitted = data.works.filter((work) => work.category === "submitted");
    if (submitted.length) {
      groups.push(createPublicationGroup("submitted", "Submitted or under revision", submitted, numberByWork));
    }

    const publishedByYear = new Map();
    data.works
      .filter((work) => work.category === "published")
      .forEach((work) => {
        if (!publishedByYear.has(work.year)) publishedByYear.set(work.year, []);
        publishedByYear.get(work.year).push(work);
      });
    publishedByYear.forEach((works, year) => {
      groups.push(createPublicationGroup(`year-${year}`, String(year), works, numberByWork));
    });

    const unpublished = data.works.filter((work) => work.category === "unpublished");
    if (unpublished.length) {
      groups.push(createPublicationGroup("unpublished", "Unpublished manuscripts", unpublished, numberByWork));
    }

    pageRoot.replaceChildren(...groups);
  }

  function formatNames(names) {
    if (names.length === 1) return names[0];
    if (names.length === 2) return `${names[0]} and ${names[1]}`;
    return `${names.slice(0, -1).join(", ")}, and ${names.at(-1)}`;
  }

  function createCvEntry(work) {
    const item = document.createElement("li");
    const titleLink = externalLink(work.url);
    const strong = document.createElement("strong");
    if (work.titleHtml) {
      strong.innerHTML = work.titleHtml;
    } else {
      strong.textContent = work.title;
    }
    titleLink.append(strong);
    item.append(titleLink, ". ");

    if (work.authors.length) {
      const names = work.authors.map((authorId) => data.coauthors[authorId].name);
      item.append(`With ${formatNames(names)}. `);
    }

    if (work.venue) {
      const venue = document.createElement("em");
      venue.textContent = work.venue;
      item.append(venue, work.citation.startsWith(",") ? work.citation : ` ${work.citation}`);
    }

    if (work.status && work.category !== "published") {
      const status = document.createElement("span");
      status.className = "cv-status";
      status.textContent = work.status;
      item.append(status);
    }

    return item;
  }

  function createCvSubsection(titleText, works, numberByWork, numbered = true) {
    const section = document.createElement("div");
    section.className = "cv-subsection";
    const title = document.createElement("h4");
    title.textContent = titleText;

    const list = document.createElement(numbered ? "ol" : "ul");
    list.className = `cv-publication-list${numbered ? "" : " cv-publication-list-unnumbered"}`;
    if (numbered && works.length) {
      list.reversed = true;
      list.start = numberByWork.get(works[0]);
    }
    works.forEach((work) => list.append(createCvEntry(work)));
    section.append(title, list);
    return section;
  }

  function renderCv(numberByWork) {
    if (!cvRoot) return;
    const submitted = data.works.filter((work) => work.category === "submitted");
    const published = data.works.filter((work) => work.category === "published");
    const unpublished = data.works.filter((work) => work.category === "unpublished");

    cvRoot.replaceChildren(
      createCvSubsection("Submitted or under revision", submitted, numberByWork),
      createCvSubsection("Published work", published, numberByWork),
      createCvSubsection("Unpublished manuscripts", unpublished, numberByWork, false),
    );
  }

  try {
    validateData();
    const numberedWorks = [
      ...data.works.filter((work) => work.category === "submitted"),
      ...data.works.filter((work) => work.category === "published"),
    ];
    const numberByWork = new Map(numberedWorks.map((work, index) => [work, numberedWorks.length - index]));
    const publicationYears = data.works
      .filter((work) => work.category === "published")
      .map((work) => work.year);
    const yearRange = `${Math.min(...publicationYears)}–${Math.max(...publicationYears)}`;

    renderPublicationPage(numberByWork);
    renderCv(numberByWork);

    document.querySelectorAll("[data-publication-total]").forEach((element) => {
      element.textContent = String(data.works.length);
    });
    document.querySelectorAll("[data-publication-years]").forEach((element) => {
      element.textContent = yearRange;
    });
    document.querySelectorAll("[data-publication-updated]").forEach((element) => {
      element.textContent = data.lastUpdated;
    });
    document.querySelectorAll("[data-publications-status]").forEach((status) => {
      status.hidden = true;
    });
    document.querySelector("[data-print-cv]")?.removeAttribute("disabled");
  } catch (error) {
    showError(error);
  }
})();
