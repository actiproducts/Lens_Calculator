const METERS_TO_FEET = 3.280839895;

const state = {
  db: null,
  objective: "Recognition",
  distance: 25,
  unit: readSavedUnit(),
  language: readSavedLanguage(),
  lensType: "all",
  modelSearch: "",
  sortMode: "fit",
};

const elements = {
  language: document.querySelector("#language"),
  form: document.querySelector("#calculator-form"),
  objective: document.querySelector("#objective"),
  distance: document.querySelector("#distance"),
  lensType: document.querySelector("#lens-type"),
  modelSearch: document.querySelector("#model-search"),
  sortMode: document.querySelector("#sort-mode"),
  selectedPpm: document.querySelector("#selected-ppm"),
  doriList: document.querySelector("#dori-list"),
  openDoriHelp: document.querySelector("#open-dori-help"),
  resultCount: document.querySelector("#result-count"),
  summaryStrip: document.querySelector("#summary-strip"),
  resultsBody: document.querySelector("#results-body"),
  dialog: document.querySelector("#model-dialog"),
  dialogTitle: document.querySelector("#dialog-title"),
  dialogContent: document.querySelector("#dialog-content"),
  closeDialog: document.querySelector("#close-dialog"),
  doriDialog: document.querySelector("#dori-dialog"),
  doriDialogContent: document.querySelector("#dori-dialog-content"),
  closeDoriDialog: document.querySelector("#close-dori-dialog"),
};

const doriContent = {
  Detection: {
    image: "assets/dori/detection.png",
  },
  Observation: {
    image: "assets/dori/observation.png",
  },
  Recognition: {
    image: "assets/dori/recognition.png",
  },
  Identification: {
    image: "assets/dori/identification.png",
  },
};

function readCookie(name) {
  return document.cookie
    .split(";")
    .map((item) => item.trim())
    .find((item) => item.startsWith(`${name}=`))
    ?.split("=")[1];
}

function readSavedUnit() {
  const cookieUnit = readCookie("lens_calculator_unit");
  let storedUnit = null;
  try {
    storedUnit = localStorage.getItem("lens_calculator_unit");
  } catch {
    storedUnit = null;
  }
  return cookieUnit === "feet" || storedUnit === "feet" ? "feet" : "meters";
}

function readSavedLanguage() {
  const cookieLanguage = readCookie("lens_calculator_language");
  let storedLanguage = null;
  try {
    storedLanguage = localStorage.getItem("lens_calculator_language");
  } catch {
    storedLanguage = null;
  }

  const language = cookieLanguage || storedLanguage || "en";
  return ["en", "es", "zh_tw"].includes(language) ? language : "en";
}

function saveUnit(unit) {
  document.cookie = `lens_calculator_unit=${unit}; max-age=31536000; path=/; SameSite=Lax`;
  try {
    localStorage.setItem("lens_calculator_unit", unit);
  } catch {
    // The cookie is enough on hosted pages; this fallback only helps local file previews.
  }
}

function saveLanguage(language) {
  document.cookie = `lens_calculator_language=${language}; max-age=31536000; path=/; SameSite=Lax`;
  try {
    localStorage.setItem("lens_calculator_language", language);
  } catch {
    // The cookie is enough on hosted pages; this fallback only helps local file previews.
  }
}

function t(key, replacements = {}) {
  const row = state.db?.dictionary?.find((item) => item.key === key);
  const template = row?.[state.language] || row?.en || key;
  return Object.entries(replacements).reduce(
    (text, [name, value]) => text.replaceAll(`{${name}}`, value),
    template,
  );
}

function doriKey(name) {
  return name.toLowerCase().replace(/\s+/g, "_");
}

function doriName(name) {
  return t(`dori_${doriKey(name)}_name`);
}

function applyStaticTranslations() {
  document.documentElement.lang = state.language === "zh_tw" ? "zh-Hant" : state.language;
  document.title = `ACTi ${t("app_title")}`;
  document.querySelectorAll("[data-i18n]").forEach((node) => {
    node.textContent = t(node.dataset.i18n);
  });
  document.querySelectorAll("[data-i18n-aria-label]").forEach((node) => {
    node.setAttribute("aria-label", t(node.dataset.i18nAriaLabel));
  });
}

function unitFactor() {
  return state.unit === "feet" ? METERS_TO_FEET : 1;
}

function unitLabel() {
  return state.unit === "feet" ? "ft" : "m";
}

function densityLabel() {
  return state.unit === "feet" ? "ppf" : "ppm";
}

function doriDensityValue(dori) {
  return state.unit === "feet" ? dori.ppf : dori.ppm;
}

function secondaryDoriDensity(dori) {
  return state.unit === "feet" ? `${dori.ppm} ppm` : `${dori.ppf} ppf`;
}

function formatNumber(value, digits = 1) {
  if (!Number.isFinite(value)) return "-";
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: digits,
    minimumFractionDigits: value < 10 && value !== 0 ? 1 : 0,
  }).format(value);
}

function getSensor(camera) {
  const relation = state.db.camera_vs_sensor.find((item) => item.camera_id === camera.id);
  return state.db.sensor.find((sensor) => sensor.id === relation?.sensor_id);
}

function getDori(name = state.objective) {
  return state.db.dori.find((item) => item.name === name);
}

function maxDistance(camera, sensor, dori) {
  return (
    unitFactor() *
    camera.max_focal_length_mm *
    camera.max_horizontal_resolution /
    dori.ppm /
    sensor.sensor_width_mm
  );
}

function focalNeeded(camera, sensor, dori) {
  return (
    state.distance *
    dori.ppm *
    sensor.sensor_width_mm /
    unitFactor() /
    camera.max_horizontal_resolution
  );
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function sceneWidthAtDistance(distance, sensor, focalMm) {
  return distance * sensor.sensor_width_mm / focalMm;
}

function deriveCamera(camera) {
  const sensor = getSensor(camera);
  const dori = getDori();
  const maxDistanceValue = maxDistance(camera, sensor, dori);
  const neededFocal = focalNeeded(camera, sensor, dori);
  const canTune = neededFocal >= camera.min_focal_length_mm && neededFocal <= camera.max_focal_length_mm;
  const recommendedFocal = canTune
    ? neededFocal
    : clamp(neededFocal, camera.min_focal_length_mm, camera.max_focal_length_mm);
  const sceneWidth = sceneWidthAtDistance(state.distance, sensor, recommendedFocal);
  const actualDensity = camera.max_horizontal_resolution / sceneWidth;
  const ratio = maxDistanceValue / state.distance;
  const status = ratio >= 1 ? "Suitable" : ratio >= 0.85 ? "Borderline" : "Not suitable";

  return {
    camera,
    sensor,
    dori,
    maxDistance: maxDistanceValue,
    neededFocal,
    recommendedFocal,
    sceneWidth,
    actualDensity,
    status,
    fitScore: ratio,
  };
}

function lensText(camera) {
  if (camera.focal_length_type === "fixed") {
    return `${formatNumber(camera.fixed_focal_length_mm)} mm ${t("lens_fixed_suffix")}`;
  }

  return `${formatNumber(camera.min_focal_length_mm)}-${formatNumber(camera.max_focal_length_mm)} mm ${t("lens_zoom_suffix")}`;
}

function statusClass(status) {
  return status.toLowerCase().replace(" ", "-");
}

function populateControls() {
  elements.language.value = state.language;
  elements.objective.innerHTML = state.db.dori
    .map((item) => `<option value="${item.name}">${doriName(item.name)}</option>`)
    .join("");
  elements.objective.value = state.objective;
  elements.form.querySelector(`input[name="unit"][value="${state.unit}"]`).checked = true;
}

function renderDoriList() {
  elements.selectedPpm.textContent = `${doriDensityValue(getDori())} ${densityLabel()}`;
  elements.doriList.innerHTML = state.db.dori
    .map((item) => {
      const content = doriContent[item.name];
      const active = item.name === state.objective ? " active" : "";
      return `
        <button class="dori-item${active}" type="button" data-dori="${item.name}">
          <img class="dori-thumb" src="${content.image}" alt="${item.name} visual reference" />
          <div>
            <strong>${doriName(item.name)}</strong>
            <span>${secondaryDoriDensity(item)}</span>
          </div>
          <span class="dori-metric">${doriDensityValue(item)} ${densityLabel()}</span>
        </button>
      `;
    })
    .join("");
}

function filterRows(rows) {
  const search = state.modelSearch.trim().toLowerCase();

  return rows.filter(({ camera }) => {
    if (state.lensType !== "all" && camera.focal_length_type !== state.lensType) return false;
    if (search && !camera.model.toLowerCase().includes(search)) return false;
    return true;
  });
}

function sortRows(rows) {
  return [...rows].sort((a, b) => {
    if (state.sortMode === "distance") return b.maxDistance - a.maxDistance;
    if (state.sortMode === "scene") return b.sceneWidth - a.sceneWidth;

    const statusRank = { Suitable: 0, Borderline: 1, "Not suitable": 2 };
    const statusDelta = statusRank[a.status] - statusRank[b.status];
    if (statusDelta !== 0) return statusDelta;
    return Math.abs(a.fitScore - 1.4) - Math.abs(b.fitScore - 1.4);
  });
}

function renderSummary(rows) {
  const suitable = rows.filter((row) => row.status === "Suitable").length;
  const borderline = rows.filter((row) => row.status === "Borderline").length;
  const bestDistance = rows.reduce((max, row) => Math.max(max, row.maxDistance), 0);
  const dori = getDori();

  const metrics = [
    [t("metric_objective"), `${doriName(dori.name)} (${doriDensityValue(dori)} ${densityLabel()})`],
    [t("metric_target_distance"), `${formatNumber(state.distance)} ${unitLabel()}`],
    [t("metric_suitable_models"), suitable],
    [t("metric_longest_reach"), `${formatNumber(bestDistance)} ${unitLabel()}`],
  ];

  elements.summaryStrip.innerHTML = metrics
    .map(([label, value]) => `<div class="metric"><span>${label}</span><strong>${value}</strong></div>`)
    .join("");

  elements.resultCount.textContent = t("result_count", {
    shown: rows.length,
    suitable,
    borderline,
  });
}

function renderTable(rows) {
  if (rows.length === 0) {
    elements.resultsBody.innerHTML = `
      <tr>
        <td colspan="7">${t("no_models")}</td>
      </tr>
    `;
    return;
  }

  elements.resultsBody.innerHTML = rows
    .map(({ camera, sensor, status, maxDistance, sceneWidth, recommendedFocal, actualDensity }) => `
      <tr>
        <td class="model-cell">
          <strong><a class="model-link" href="http://www.acti.com/product/${encodeURIComponent(camera.model)}" target="_blank" rel="noopener">${camera.model}</a></strong>
          <span>${sensor.sensor_size || t("unknown_sensor")}</span>
        </td>
        <td><span class="status ${statusClass(status)}">${t(`status_${statusClass(status).replace("-", "_")}`)}</span></td>
        <td>
          ${lensText(camera)}
          <span class="muted">${t("use_about", { value: formatNumber(recommendedFocal, 2) })}</span>
        </td>
        <td>${camera.max_horizontal_resolution} x ${camera.max_vertical_resolution}</td>
        <td>${formatNumber(maxDistance)} ${unitLabel()}</td>
        <td>
          ${formatNumber(sceneWidth)} ${unitLabel()}
          <span class="muted">${t("density_at_target", { value: formatNumber(actualDensity, 0), unit: densityLabel() })}</span>
        </td>
        <td><button class="text-button" type="button" data-camera-id="${camera.id}">${t("details")}</button></td>
      </tr>
    `)
    .join("");
}

function render() {
  renderDoriList();
  const rows = sortRows(filterRows(state.db.camera.map(deriveCamera)));
  renderSummary(rows);
  renderTable(rows);
}

function detailRow(label, value) {
  return `<div class="detail"><span>${label}</span><strong>${value}</strong></div>`;
}

function showDetails(cameraId) {
  const row = deriveCamera(state.db.camera.find((camera) => camera.id === cameraId));
  const { camera, sensor } = row;
  const allRanges = state.db.dori.map((dori) => ({
    name: dori.name,
    distance: maxDistance(camera, sensor, dori),
    density: doriDensityValue(dori),
  }));

  elements.dialogTitle.textContent = camera.model;
  elements.dialogContent.innerHTML = `
    <div class="detail-grid">
      ${detailRow(t("detail_lens"), lensText(camera))}
      ${detailRow(t("table_resolution"), `${camera.max_horizontal_resolution} x ${camera.max_vertical_resolution}`)}
      ${detailRow(t("detail_sensor"), sensor.sensor_name)}
      ${detailRow(t("detail_pixel_size"), `${formatNumber(sensor.pixel_size_um, 3)} um`)}
      ${detailRow(t("detail_recommended_focal"), `${formatNumber(row.recommendedFocal, 2)} mm`)}
      ${detailRow(t("detail_current_objective"), `${doriName(row.dori.name)}, ${doriDensityValue(row.dori)} ${densityLabel()}`)}
    </div>
    <section>
      <p class="eyebrow">${t("dori_range_longest_focal")}</p>
      <div class="range-list">
        ${allRanges
          .map((item) => `
            <div class="range-row">
              <span>${doriName(item.name)} (${item.density} ${densityLabel()})</span>
              <strong>${formatNumber(item.distance)} ${unitLabel()}</strong>
            </div>
          `)
          .join("")}
      </div>
    </section>
    <section>
      <p class="eyebrow">${t("source_specs")}</p>
      <p class="muted">${camera.focal_length_raw}</p>
      <p class="muted">${camera.max_frame_rate_vs_resolution.replace(/\n/g, "<br />")}</p>
    </section>
  `;

  elements.dialog.showModal();
}

function showDoriHelp() {
  elements.doriDialogContent.innerHTML = state.db.dori
    .map((item) => {
      const content = doriContent[item.name];
      return `
        <article class="explain-card">
          <img src="${content.image}" alt="${item.name} visual reference" />
          <div>
            <h3>${doriName(item.name)}</h3>
            <p>${t(`dori_${doriKey(item.name)}_definition`)}</p>
            <p class="explain-meta">${item.ppm} ppm / ${item.ppf} ppf</p>
            <p class="muted">${t(`dori_${doriKey(item.name)}_example`)}</p>
          </div>
        </article>
      `;
    })
    .join("");

  elements.doriDialog.showModal();
}

function bindEvents() {
  elements.language.addEventListener("change", () => {
    state.language = elements.language.value;
    saveLanguage(state.language);
    applyStaticTranslations();
    populateControls();
    render();
  });

  elements.form.addEventListener("input", () => {
    state.objective = elements.objective.value;
    state.distance = Math.max(Number(elements.distance.value) || 0, 0.1);
    state.unit = new FormData(elements.form).get("unit");
    saveUnit(state.unit);
    state.lensType = elements.lensType.value;
    state.modelSearch = elements.modelSearch.value;
    render();
  });

  elements.sortMode.addEventListener("change", () => {
    state.sortMode = elements.sortMode.value;
    render();
  });

  elements.resultsBody.addEventListener("click", (event) => {
    const button = event.target.closest("[data-camera-id]");
    if (!button) return;
    showDetails(Number(button.dataset.cameraId));
  });

  elements.doriList.addEventListener("click", (event) => {
    const button = event.target.closest("[data-dori]");
    if (!button) return;
    state.objective = button.dataset.dori;
    elements.objective.value = state.objective;
    render();
  });

  elements.openDoriHelp.addEventListener("click", showDoriHelp);
  elements.closeDialog.addEventListener("click", () => elements.dialog.close());
  elements.closeDoriDialog.addEventListener("click", () => elements.doriDialog.close());
}

async function init() {
  if (window.LENS_CALCULATOR_TEMP_DB) {
    state.db = window.LENS_CALCULATOR_TEMP_DB;
  } else {
    const response = await fetch("data/temp-db.json");
    state.db = await response.json();
  }

  applyStaticTranslations();
  populateControls();
  bindEvents();
  render();
}

init().catch((error) => {
  elements.resultCount.textContent = state.db ? t("db_load_error") : "Could not load database.";
  elements.resultsBody.innerHTML = `<tr><td colspan="7">${error.message}</td></tr>`;
});
