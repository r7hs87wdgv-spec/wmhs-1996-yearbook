const state = {
  pages: [],
  index: 0,
  spread: window.innerWidth > 760,
  fit: true,
};

const els = {
  reader: document.querySelector(".reader"),
  stage: document.getElementById("stage"),
  left: document.getElementById("leftPage"),
  right: document.getElementById("rightPage"),
  prev: document.getElementById("prevBtn"),
  next: document.getElementById("nextBtn"),
  spread: document.getElementById("spreadBtn"),
  fit: document.getElementById("fitBtn"),
  slider: document.getElementById("pageSlider"),
  input: document.getElementById("pageInput"),
  count: document.getElementById("pageCount"),
};

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function pageLabel(page) {
  return `Page ${Number(page.page)}`;
}

function pagePath(page) {
  const number = Number(page.page);
  if (number <= 98) return `batch-1/all-hq-pages/${page.file}`;
  return page.file;
}

function setSlot(slot, page) {
  const image = slot.querySelector("img");
  const caption = slot.querySelector("figcaption");

  if (!page) {
    image.removeAttribute("src");
    image.alt = "";
    caption.textContent = "";
    slot.hidden = true;
    return;
  }

  slot.hidden = false;
  image.src = pagePath(page);
  image.alt = pageLabel(page);
  caption.textContent = `${pageLabel(page)} · ${page.width}×${page.height}`;
}

function render() {
  const max = state.pages.length - 1;
  state.index = clamp(state.index, 0, max);
  const coverOnly = state.spread && state.index === 0;

  els.stage.classList.toggle("single", !state.spread || coverOnly);
  els.reader.classList.toggle("zoomed", !state.fit);
  els.spread.setAttribute("aria-pressed", String(state.spread));
  els.fit.setAttribute("aria-pressed", String(state.fit));

  setSlot(els.left, state.pages[state.index]);
  setSlot(els.right, state.spread && !coverOnly ? state.pages[state.index + 1] : null);

  els.prev.disabled = state.index === 0;
  els.next.disabled = state.index >= max;
  els.slider.value = String(state.index);
  els.input.value = String(Number(state.pages[state.index]?.page || 1));
  els.count.textContent = `/ ${Number(state.pages[max]?.page || state.pages.length)}`;

  document.title = `WMHS 1996 · ${pageLabel(state.pages[state.index])}`;
}

function step(delta) {
  if (state.spread && state.index === 0 && delta > 0) {
    state.index = 1;
  } else if (state.spread && state.index === 1 && delta < 0) {
    state.index = 0;
  } else {
    state.index += state.spread ? delta * 2 : delta;
  }
  render();
}

async function loadPages() {
  const response = await fetch("batch-1/all-hq-pages/manifest.json");
  const manifest = await response.json();
  state.pages = manifest.pages.filter((page) => page.page !== "0002");
  els.slider.max = String(state.pages.length - 1);
  els.input.min = String(Number(state.pages[0].page));
  els.input.max = String(Number(state.pages.at(-1).page));
  render();
}

els.prev.addEventListener("click", () => step(-1));
els.next.addEventListener("click", () => step(1));

els.spread.addEventListener("click", () => {
  state.spread = !state.spread;
  render();
});

els.fit.addEventListener("click", () => {
  state.fit = !state.fit;
  render();
});

els.slider.addEventListener("input", (event) => {
  state.index = Number(event.target.value);
  render();
});

els.input.addEventListener("change", (event) => {
  const wanted = String(Number(event.target.value)).padStart(4, "0");
  const exact = state.pages.findIndex((page) => page.page === wanted);
  state.index = exact >= 0 ? exact : clamp(Number(event.target.value) - 1, 0, state.pages.length - 1);
  render();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "ArrowLeft") step(-1);
  if (event.key === "ArrowRight") step(1);
  if (event.key === "f") {
    state.fit = !state.fit;
    render();
  }
});

loadPages().catch((error) => {
  els.stage.classList.add("single");
  els.left.hidden = false;
  els.left.querySelector("figcaption").textContent = "Start a local web server from this folder to load the flipbook.";
  console.error(error);
});
