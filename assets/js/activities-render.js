(() => {
  "use strict";

  const roots = {
    presentations: document.querySelector('[data-activity-groups="presentations"]'),
    invitedTalks: document.querySelector('[data-activity-groups="invitedTalks"]'),
    organization: document.querySelector('[data-activity-groups="organization"]'),
    cbnuSeminars: document.querySelector('[data-activity-groups="cbnuSeminars"]'),
    ibsSeminars: document.querySelector("[data-activity-ibs-seminars]"),
    service: document.querySelector("[data-activity-service]"),
  };

  if (!Object.values(roots).some(Boolean)) return;

  const data = window.ACTIVITY_DATA;

  function showError(error) {
    console.error("Could not render activity data.", error);
    document.querySelectorAll("[data-activities-status]").forEach((status) => {
      status.hidden = false;
      status.classList.add("is-error");
      status.textContent = "The activity list could not be loaded. Please check the activity data file.";
    });
  }

  function isNonEmptyString(value) {
    return typeof value === "string" && Boolean(value.trim());
  }

  function validateSegment(segment, context) {
    if (typeof segment === "string") return;
    if (!segment || !isNonEmptyString(segment.text)) {
      throw new Error(`${context} contains an invalid text segment.`);
    }
    if (segment.url !== undefined && !isNonEmptyString(segment.url)) {
      throw new Error(`${context} contains an invalid link.`);
    }
  }

  function validateItem(item, context) {
    if (!item || typeof item !== "object") {
      throw new Error(`${context} is not a valid activity item.`);
    }

    const hasText = isNonEmptyString(item.text);
    const hasTitle = isNonEmptyString(item.title);
    const hasParts = Array.isArray(item.parts) && item.parts.length > 0;
    if (!hasText && !hasTitle && !hasParts) {
      throw new Error(`${context} needs text, a title, or parts.`);
    }

    if (item.url !== undefined && !isNonEmptyString(item.url)) {
      throw new Error(`${context} has an invalid URL.`);
    }
    if (item.parts) item.parts.forEach((segment) => validateSegment(segment, context));
    if (Array.isArray(item.lead)) item.lead.forEach((segment) => validateSegment(segment, context));
    if (Array.isArray(item.details)) item.details.forEach((segment) => validateSegment(segment, context));
  }

  function validateGroups(groups, context) {
    if (!Array.isArray(groups) || !groups.length) {
      throw new Error(`${context} is missing year groups.`);
    }
    groups.forEach((group, groupIndex) => {
      if (!group || !isNonEmptyString(group.label) || !Array.isArray(group.items) || !group.items.length) {
        throw new Error(`${context} group ${groupIndex + 1} is incomplete.`);
      }
      group.items.forEach((item, itemIndex) => {
        validateItem(item, `${context} group ${group.label}, item ${itemIndex + 1}`);
      });
    });
  }

  function validateData() {
    if (!data || !isNonEmptyString(data.lastUpdated)) {
      throw new Error("ACTIVITY_DATA is missing or malformed.");
    }

    validateGroups(data.presentations, "Presentations");
    validateGroups(data.invitedTalks, "Invited talks");
    validateGroups(data.organization, "Organization");

    if (!data.seminars || !Array.isArray(data.seminars.ibs) || !data.seminars.ibs.length) {
      throw new Error("Seminar data is missing or malformed.");
    }
    validateGroups(data.seminars.cbnu, "CBNU seminars");
    data.seminars.ibs.forEach((item, index) => validateItem(item, `IBS seminar ${index + 1}`));

    if (!Array.isArray(data.service) || !data.service.length) {
      throw new Error("Professional service data is missing or malformed.");
    }
    data.service.forEach((item, index) => validateItem(item, `Professional service item ${index + 1}`));
  }

  function externalLink(url) {
    const link = document.createElement("a");
    link.href = url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    return link;
  }

  function appendSegment(parent, segment) {
    if (typeof segment === "string") {
      parent.append(document.createTextNode(segment));
      return;
    }

    let element;
    if (segment.url) {
      element = externalLink(segment.url);
    } else if (segment.strong) {
      element = document.createElement("strong");
    } else if (segment.emphasis) {
      element = document.createElement("em");
    } else if (segment.lang) {
      element = document.createElement("span");
    }

    if (!element) {
      parent.append(document.createTextNode(segment.text));
      return;
    }

    if (segment.lang) element.lang = segment.lang;
    element.textContent = segment.text;
    parent.append(element);
  }

  function appendValue(parent, value) {
    if (value === undefined || value === null || value === "") return;
    if (Array.isArray(value)) {
      value.forEach((segment) => appendSegment(parent, segment));
      return;
    }
    if (typeof value === "object") {
      appendSegment(parent, value);
      return;
    }
    parent.append(document.createTextNode(String(value)));
  }

  function createItem(item) {
    const listItem = document.createElement("li");

    if (item.parts) {
      appendValue(listItem, item.parts);
      return listItem;
    }
    if (item.text) {
      listItem.textContent = item.text;
      return listItem;
    }

    appendValue(listItem, item.lead);
    if (item.url) {
      const link = externalLink(item.url);
      link.textContent = item.title;
      listItem.append(link);
    } else {
      listItem.append(document.createTextNode(item.title));
    }
    appendValue(listItem, item.details);
    return listItem;
  }

  function createList(items, className) {
    const list = document.createElement("ul");
    list.className = className;
    items.forEach((item) => list.append(createItem(item)));
    return list;
  }

  function renderGroups(root, groups) {
    if (!root) return;
    const fragment = document.createDocumentFragment();

    groups.forEach((group) => {
      const details = document.createElement("details");
      details.className = "year-group";
      details.open = Boolean(group.open);

      const summary = document.createElement("summary");
      summary.textContent = group.label;
      details.append(summary, createList(group.items, "record-list"));
      fragment.append(details);
    });

    root.replaceChildren(fragment);
  }

  function renderList(root, items, className) {
    if (!root) return;
    root.replaceChildren(...items.map((item) => createItem(item)));
    root.className = className;
  }

  try {
    validateData();
    renderGroups(roots.presentations, data.presentations);
    renderGroups(roots.invitedTalks, data.invitedTalks);
    renderGroups(roots.organization, data.organization);
    renderGroups(roots.cbnuSeminars, data.seminars.cbnu);
    renderList(roots.ibsSeminars, data.seminars.ibs, "record-list");
    renderList(roots.service, data.service, "clean-list");

    document.querySelectorAll("[data-activity-updated]").forEach((element) => {
      element.textContent = data.lastUpdated;
    });
    document.querySelectorAll("[data-activities-status]").forEach((status) => {
      status.hidden = true;
    });
  } catch (error) {
    showError(error);
  }
})();
