import fs from "node:fs/promises";
import path from "node:path";

const metersToFeet = 3.280839895;

async function getText(filePath) {
  return fs.readFile(path.join(process.cwd(), filePath), "utf8");
}

function getSensor(db, camera) {
  const relation = db.camera_vs_sensor.find((item) => item.camera_id === camera.id);
  return db.sensor.find((sensor) => sensor.id === relation?.sensor_id);
}

const [html, css, js, dbText] = await Promise.all([
  getText("index.html"),
  getText("styles.css"),
  getText("app.js"),
  getText("data/temp-db.json"),
]);
await Promise.all([
  fs.access("data/temp-db.js"),
  fs.access("assets/dori/detection.png"),
  fs.access("assets/dori/observation.png"),
  fs.access("assets/dori/recognition.png"),
  fs.access("assets/dori/identification.png"),
]);

const db = JSON.parse(dbText);
const dori = db.dori.find((item) => item.name === "Recognition");
const targetDistance = 25;
const rows = db.camera.map((camera) => {
  const sensor = getSensor(db, camera);
  const maxDistance =
    camera.max_focal_length_mm *
    camera.max_horizontal_resolution /
    dori.ppm /
    sensor.sensor_width_mm;
  const neededFocal =
    targetDistance *
    dori.ppm *
    sensor.sensor_width_mm /
    camera.max_horizontal_resolution;
  return {
    model: camera.model,
    maxDistance,
    neededFocal,
    sensor: sensor.sensor_size,
    suitable: maxDistance >= targetDistance,
  };
});

const requiredHtml = ["calculator-form", "results-body", "model-dialog", "dori-dialog", "open-dori-help"];
const missingHtml = requiredHtml.filter((token) => !html.includes(token));
if (missingHtml.length) throw new Error(`Missing HTML hooks: ${missingHtml.join(", ")}`);
if (!css.includes(".workspace")) throw new Error("CSS did not load expected layout rules.");
if (!js.includes("deriveCamera")) throw new Error("App script did not load expected calculator logic.");
if (!js.includes("lens_calculator_unit")) throw new Error("Unit persistence logic is missing.");
if (!js.includes("lens_calculator_language")) throw new Error("Language persistence logic is missing.");
if (!js.includes("densityLabel")) throw new Error("Unit-aware density display logic is missing.");
if (!js.includes("doriContent")) throw new Error("DORI explanation content is missing.");
if (!Array.isArray(db.dictionary) || db.dictionary.length < 40) {
  throw new Error("Dictionary table is missing or too small.");
}
if (db.dictionary.some((row) => !row.key || !row.en || !row.es || !row.zh_tw)) {
  throw new Error("Dictionary rows must include key, en, es, and zh_tw.");
}
if (rows.some((row) => !Number.isFinite(row.maxDistance) || !Number.isFinite(row.neededFocal))) {
  throw new Error("Some recommendation rows produced invalid calculations.");
}

console.log(JSON.stringify({
  cameras: db.camera.length,
  sensors: db.sensor.length,
  suitableAt25mRecognition: rows.filter((row) => row.suitable).length,
  longestReachMeters: Math.max(...rows.map((row) => row.maxDistance)),
  longestReachFeet: Math.max(...rows.map((row) => row.maxDistance)) * metersToFeet,
}, null, 2));
