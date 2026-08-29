const chapters = [
  { title: "Start Here", description: "Routing guide and recommended study paths.", pages: 7, pdfPath: "DBMS/SQL/00-start-here.pdf" },
  { title: "Top 50 SQL Questions", description: "Highest-priority questions for fast revision.", pages: 48, pdfPath: "DBMS/SQL/01-top-50.pdf" },
  { title: "Top 200 SQL Questions", description: "Broader coverage for interview depth.", pages: 196, pdfPath: "DBMS/SQL/02-top-200.pdf" },
  { title: "What Changed 2026", description: "Modern SQL changes and current interview trends.", pages: 22, pdfPath: "DBMS/SQL/03-what-changed-2026.pdf" },
  { title: "Core SQL Library", description: "The complete fundamentals-to-advanced question bank.", pages: 521, pdfPath: "DBMS/SQL/04-core-library.pdf" },
  { title: "Scenario Library", description: "Debugging, optimization, design, and data-quality scenarios.", pages: 586, pdfPath: "DBMS/SQL/05-scenario-library.pdf" },
  { title: "Modern DB", description: "Modern database systems and SQL-adjacent concepts.", pages: 134, pdfPath: "DBMS/SQL/06-modern-db.pdf" },
  { title: "Cheatsheet", description: "Compact revision mode for quick interview warmups.", pages: 2, pdfPath: "DBMS/SQL/07-cheatsheet.pdf" },
  { title: "Salary Map", description: "Market context and role-level preparation guidance.", pages: 10, pdfPath: "DBMS/SQL/08-salary-map.pdf" }
];

const storageKey = "sql-pdf-reader-progress-v1";
const themeKey = "sql-reader-theme-v4";
const zoomKey = "sql-pdf-reader-zoom-v1";
const state = readJson(storageKey, {});
let activeIndex = 0;
let zoomLevel = Number(localStorage.getItem(zoomKey) || 100);

const $ = (selector) => document.querySelector(selector);
const root = document.documentElement;
const chapterList = $("#chapterList");
const tocList = $("#tocList");
const chapterMeta = $("#chapterMeta");
const chapterPercent = $("#chapterPercent");
const chapterPosition = $("#chapterPosition");
const chapterProgressBar = $("#chapterProgressBar");
const overallPercent = $("#overallPercent");
const overallBar = $("#overallBar");
const completedCount = $("#completedCount");
const totalPages = $("#totalPages");
const sourcePdf = $("#sourcePdf");
const markComplete = $("#markComplete");
const previousChapter = $("#previousChapter");
const nextChapterButton = $("#nextChapter");
const headerPrevious = $("#headerPrevious");
const headerNext = $("#headerNext");
const themeToggle = $("#themeToggle");
const zoomOut = $("#fontMinus");
const zoomIn = $("#fontPlus");
const chapterFilter = $("#chapterFilter");
const searchDialog = $("#searchDialog");
const searchTrigger = $("#searchTrigger");
const closeSearch = $("#closeSearch");
const globalSearchInput = $("#globalSearchInput");
const searchResults = $("#searchResults");
const navToggle = $("#navToggle");
const closeNav = $("#closeNav");
const mobileBackdrop = $("#mobileBackdrop");
const readerContent = $("#readerContent");

function readJson(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) || fallback;
  } catch {
    return fallback;
  }
}

function saveState() {
  localStorage.setItem(storageKey, JSON.stringify(state));
}

function chapterKey(index) {
  return chapters[index].pdfPath;
}

function chapterState(index) {
  const key = chapterKey(index);
  if (!state[key]) {
    state[key] = { progress: 0, complete: false };
  }
  return state[key];
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(value, max));
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function slugFromPath(path) {
  return path.split("/").pop().replace(/\.pdf$/i, "");
}

function pdfUrl(path) {
  const zoom = clamp(zoomLevel, 75, 150);
  return `${encodeURI(path)}#toolbar=1&navpanes=0&view=FitH&zoom=${zoom}`;
}

function setTheme(theme) {
  root.dataset.theme = theme;
  themeToggle.textContent = theme === "dark" ? "Light" : "Dark";
  localStorage.setItem(themeKey, theme);
}

function setZoom(nextZoom) {
  zoomLevel = clamp(nextZoom, 75, 150);
  localStorage.setItem(zoomKey, String(zoomLevel));
  const frame = $("#pdfFrame");
  if (frame) {
    frame.src = pdfUrl(chapters[activeIndex].pdfPath);
  }
}

function renderChapterList() {
  const filter = chapterFilter.value.trim().toLowerCase();
  chapterList.innerHTML = "";

  chapters.forEach((chapter, index) => {
    const current = chapterState(index);
    const progress = Math.round(current.complete ? 100 : current.progress || 0);
    const haystack = `${chapter.title} ${chapter.description}`.toLowerCase();
    if (filter && !haystack.includes(filter)) return;

    const button = document.createElement("button");
    button.className = "chapter-card";
    button.type = "button";
    button.innerHTML = `
      <span class="chapter-number">${String(index + 1).padStart(2, "0")}</span>
      <span>
        <span class="chapter-card-title">${escapeHtml(chapter.title)}</span>
        <span class="chapter-card-desc">${escapeHtml(chapter.description)}</span>
        <span class="chapter-card-meta"><span>${chapter.pages} pages</span><span>${progress}%</span></span>
        <span class="mini-meter" aria-hidden="true"><span style="width:${progress}%"></span></span>
      </span>
    `;
    button.addEventListener("click", () => {
      selectChapter(index, true);
      closeMobileNav();
    });
    chapterList.appendChild(button);
  });

  updateActiveChapterButton();
}

function updateActiveChapterButton() {
  document.querySelectorAll(".chapter-card").forEach((button) => {
    const title = button.querySelector(".chapter-card-title")?.textContent || "";
    const index = chapters.findIndex((chapter) => chapter.title === title);
    button.classList.toggle("is-active", index === activeIndex);
    button.classList.toggle("is-complete", chapterState(index).complete);
    button.setAttribute("aria-current", index === activeIndex ? "page" : "false");
  });
}

function updateProgress() {
  const percents = chapters.map((_, index) => chapterState(index).complete ? 100 : Number(chapterState(index).progress || 0));
  const overall = percents.reduce((sum, item) => sum + item, 0) / chapters.length;
  const activeProgress = chapterState(activeIndex).complete ? 100 : Number(chapterState(activeIndex).progress || 0);

  overallPercent.textContent = `${Math.round(overall)}%`;
  overallBar.style.width = `${overall}%`;
  completedCount.textContent = `${chapters.filter((_, index) => chapterState(index).complete).length} complete`;
  totalPages.textContent = `${chapters.reduce((sum, chapter) => sum + chapter.pages, 0)} pages`;
  chapterProgressBar.style.width = `${activeProgress}%`;
  chapterPercent.textContent = `${Math.round(activeProgress)}%`;
  markComplete.textContent = chapterState(activeIndex).complete ? "Completed" : "Mark Complete";
}

function renderPdfViewer() {
  const chapter = chapters[activeIndex];
  readerContent.innerHTML = `
    <section class="pdf-stage" aria-label="${escapeHtml(chapter.title)} PDF">
      <div class="pdf-stage-header">
        <div>
          <p class="chapter-kicker">Chapter ${activeIndex + 1} of ${chapters.length} / ${chapter.pages} pages</p>
          <h1 class="chapter-title">${escapeHtml(chapter.title)}</h1>
          <p class="chapter-description">${escapeHtml(chapter.description)}</p>
        </div>
        <a class="button primary" href="${encodeURI(chapter.pdfPath)}" target="_blank" rel="noopener">Open PDF</a>
      </div>
      <div class="pdf-frame-shell">
        <iframe id="pdfFrame" title="${escapeHtml(chapter.title)} original PDF" src="${pdfUrl(chapter.pdfPath)}"></iframe>
      </div>
    </section>
  `;

  tocList.innerHTML = `
    <a href="${encodeURI(chapter.pdfPath)}" target="_blank" rel="noopener" class="is-active">Original PDF</a>
    <a href="${encodeURI(chapter.pdfPath)}" download>Download PDF</a>
    <a href="#${slugFromPath(chapter.pdfPath)}">${chapter.pages} pages</a>
  `;
}

function selectChapter(index, updateHash = false) {
  activeIndex = clamp(index, 0, chapters.length - 1);
  const chapter = chapters[activeIndex];
  chapterMeta.textContent = `Chapter ${activeIndex + 1} of ${chapters.length} / ${chapter.pages} pages`;
  chapterPosition.textContent = `${activeIndex + 1} / ${chapters.length}`;
  sourcePdf.href = encodeURI(chapter.pdfPath);
  previousChapter.disabled = activeIndex === 0;
  nextChapterButton.disabled = activeIndex === chapters.length - 1;
  headerPrevious.disabled = activeIndex === 0;
  headerNext.disabled = activeIndex === chapters.length - 1;

  renderPdfViewer();
  renderChapterList();
  updateProgress();

  if (updateHash) {
    history.replaceState(null, "", `#${slugFromPath(chapter.pdfPath)}`);
  }
}

function chapterIndexFromHash() {
  const hash = decodeURIComponent(location.hash.replace("#", ""));
  const index = chapters.findIndex((chapter) => slugFromPath(chapter.pdfPath) === hash);
  return index >= 0 ? index : 0;
}

function renderSearchResults(query) {
  const term = query.trim().toLowerCase();
  if (!term) {
    searchResults.innerHTML = '<p class="empty-state">Search by document title, topic, or description. Use the PDF viewer search for exact text inside a PDF.</p>';
    return;
  }

  const results = chapters
    .map((chapter, index) => ({ chapter, index }))
    .filter(({ chapter }) => `${chapter.title} ${chapter.description}`.toLowerCase().includes(term));

  searchResults.innerHTML = results.length ? results.map(({ chapter, index }) => `
    <button class="search-result" type="button" data-index="${index}">
      <span>Chapter ${index + 1} / ${chapter.pages} pages</span>
      <strong>${escapeHtml(chapter.title)}</strong>
      <p>${escapeHtml(chapter.description)}</p>
    </button>
  `).join("") : '<p class="empty-state">No matching PDF found.</p>';

  document.querySelectorAll(".search-result").forEach((button) => {
    button.addEventListener("click", () => {
      closeSearchDialog();
      selectChapter(Number(button.dataset.index), true);
    });
  });
}

function openSearch() {
  if (!searchDialog.open) searchDialog.showModal();
  globalSearchInput.focus();
  renderSearchResults(globalSearchInput.value);
}

function closeSearchDialog() {
  if (searchDialog.open) searchDialog.close();
}

function openMobileNav() {
  document.body.classList.add("nav-open");
  mobileBackdrop.hidden = false;
}

function closeMobileNav() {
  document.body.classList.remove("nav-open");
  mobileBackdrop.hidden = true;
}

function goNext() {
  selectChapter(activeIndex + 1, true);
}

function goPrevious() {
  selectChapter(activeIndex - 1, true);
}

previousChapter.addEventListener("click", goPrevious);
nextChapterButton.addEventListener("click", goNext);
headerPrevious.addEventListener("click", goPrevious);
headerNext.addEventListener("click", goNext);
markComplete.addEventListener("click", () => {
  const current = chapterState(activeIndex);
  current.complete = !current.complete;
  current.progress = current.complete ? 100 : 0;
  saveState();
  renderChapterList();
  updateProgress();
});
$("#resetProgress").addEventListener("click", () => {
  chapters.forEach((chapter) => {
    state[chapter.pdfPath] = { progress: 0, complete: false };
  });
  saveState();
  renderChapterList();
  updateProgress();
});
themeToggle.addEventListener("click", () => setTheme(root.dataset.theme === "dark" ? "light" : "dark"));
zoomOut.addEventListener("click", () => setZoom(zoomLevel - 10));
zoomIn.addEventListener("click", () => setZoom(zoomLevel + 10));
chapterFilter.addEventListener("input", renderChapterList);
searchTrigger.addEventListener("click", openSearch);
closeSearch.addEventListener("click", closeSearchDialog);
globalSearchInput.addEventListener("input", () => renderSearchResults(globalSearchInput.value));
navToggle.addEventListener("click", openMobileNav);
closeNav.addEventListener("click", closeMobileNav);
mobileBackdrop.addEventListener("click", closeMobileNav);
window.addEventListener("hashchange", () => selectChapter(chapterIndexFromHash()));
document.addEventListener("keydown", (event) => {
  const typing = /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName);
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
    event.preventDefault();
    openSearch();
  } else if (event.key === "Escape") {
    closeSearchDialog();
    closeMobileNav();
  } else if (!typing && event.key === "ArrowLeft") {
    goPrevious();
  } else if (!typing && event.key === "ArrowRight") {
    goNext();
  }
});

setTheme(localStorage.getItem(themeKey) || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"));
renderChapterList();
selectChapter(chapterIndexFromHash());
