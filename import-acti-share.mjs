import fs from "node:fs/promises";

const shareUrl = process.argv[2] ?? "https://www.acti.com/products/spec/share/11065";
const endpoint = "https://www.acti.com/corpweb/Tools/ProductSelector/Ajax/GetProductSelectorComparisonResult.aspx";

const sensorFormatDefaults = {
  "1/3": { activeWidthMm: 4.8, activeHeightMm: 3.6 },
  "1/2.9": { activeWidthMm: 4.96, activeHeightMm: 3.72 },
  "1/2.8": { activeWidthMm: 5.12, activeHeightMm: 3.84 },
  "1/2.7": { activeWidthMm: 5.37, activeHeightMm: 4.04 },
  "1/2.5": { activeWidthMm: 5.76, activeHeightMm: 4.29 },
  "1/2.3": { activeWidthMm: 6.17, activeHeightMm: 4.55 },
  "1/2": { activeWidthMm: 6.4, activeHeightMm: 4.8 },
  "1/1.8": { activeWidthMm: 7.18, activeHeightMm: 5.32 },
  "1/1.7": { activeWidthMm: 7.6, activeHeightMm: 5.7 },
};

const dictionary = [
  ["app_title", "Lens Calculator", "Calculadora de lentes", "鏡頭計算器"],
  [
    "app_intro",
    "Find camera models that meet the target distance and surveillance objective.",
    "Encuentre modelos de cámara que cumplan con la distancia al objetivo y el objetivo de vigilancia.",
    "依照目標距離與監控目的，尋找符合需求的攝影機型號。",
  ],
  ["language", "Language", "Idioma", "語言"],
  ["surveillance_objective", "Surveillance objective", "Objetivo de vigilancia", "監控目的"],
  ["distance_to_target", "Distance to target", "Distancia al objetivo", "目標距離"],
  ["unit", "Unit", "Unidad", "單位"],
  ["lens_type", "Lens type", "Tipo de lente", "鏡頭類型"],
  ["lens_all", "All", "Todos", "全部"],
  ["lens_fixed", "Fixed", "Fijo", "固定焦距"],
  ["lens_variable", "Zoom / varifocal", "Zoom / varifocal", "變焦 / 可變焦"],
  ["model_search", "Model search", "Buscar modelo", "搜尋型號"],
  ["video_quality", "Video Quality", "Calidad de video", "影像品質"],
  ["how_to_choose", "How to choose", "Cómo elegir", "如何選擇"],
  ["recommendations", "Recommendations", "Recomendaciones", "建議機型"],
  ["loading_models", "Loading models...", "Cargando modelos...", "正在載入型號..."],
  ["sort_by", "Sort by", "Ordenar por", "排序方式"],
  ["sort_best_fit", "Best fit", "Mejor ajuste", "最佳符合"],
  ["sort_max_distance", "Maximum distance", "Distancia máxima", "最遠距離"],
  ["sort_widest_scene", "Widest scene", "Escena más amplia", "最寬場景"],
  ["table_model", "Model", "Modelo", "型號"],
  ["table_status", "Status", "Estado", "狀態"],
  ["table_lens", "Lens", "Lente", "鏡頭"],
  ["table_resolution", "Resolution", "Resolución", "解析度"],
  ["table_max_distance", "Max distance", "Distancia máxima", "最大距離"],
  ["table_scene_width", "Scene width", "Ancho de escena", "場景寬度"],
  ["details", "Details", "Detalles", "詳細資料"],
  ["model_details", "Model details", "Detalles del modelo", "型號詳細資料"],
  ["close_details", "Close details", "Cerrar detalles", "關閉詳細資料"],
  ["close_dori_explanation", "Close DORI explanation", "Cerrar explicación DORI", "關閉 DORI 說明"],
  ["choosing_dori_level", "Choosing a DORI Level", "Elegir un nivel DORI", "選擇 DORI 等級"],
  [
    "video_quality_objective",
    "Video Quality / Surveillance Objective",
    "Calidad de video / Objetivo de vigilancia",
    "影像品質 / 監控目的",
  ],
  ["metric_objective", "Objective", "Objetivo", "目的"],
  ["metric_target_distance", "Target distance", "Distancia objetivo", "目標距離"],
  ["metric_suitable_models", "Suitable models", "Modelos adecuados", "符合機型"],
  ["metric_longest_reach", "Longest reach", "Mayor alcance", "最遠可達距離"],
  [
    "result_count",
    "{shown} models shown, {suitable} suitable, {borderline} borderline",
    "{shown} modelos mostrados, {suitable} adecuados, {borderline} límite",
    "顯示 {shown} 個型號，{suitable} 個符合，{borderline} 個接近符合",
  ],
  ["status_suitable", "Suitable", "Adecuado", "符合"],
  ["status_borderline", "Borderline", "Límite", "接近符合"],
  ["status_not_suitable", "Not suitable", "No adecuado", "不符合"],
  ["no_models", "No models match the current filters.", "Ningún modelo coincide con los filtros actuales.", "沒有符合目前篩選條件的型號。"],
  ["unknown_sensor", "Unknown sensor", "Sensor desconocido", "未知感測器"],
  ["lens_fixed_suffix", "fixed", "fijo", "固定"],
  ["lens_zoom_suffix", "zoom", "zoom", "變焦"],
  ["use_about", "Use about {value} mm", "Use aprox. {value} mm", "約使用 {value} mm"],
  ["density_at_target", "{value} {unit} at target", "{value} {unit} en el objetivo", "目標處 {value} {unit}"],
  ["detail_lens", "Lens", "Lente", "鏡頭"],
  ["detail_sensor", "Sensor", "Sensor", "感測器"],
  ["detail_pixel_size", "Pixel size", "Tamaño de píxel", "像素尺寸"],
  ["detail_recommended_focal", "Recommended focal", "Focal recomendada", "建議焦距"],
  ["detail_current_objective", "Current objective", "Objetivo actual", "目前目的"],
  [
    "dori_range_longest_focal",
    "DORI range at longest focal length",
    "Alcance DORI con la distancia focal más larga",
    "最長焦距下的 DORI 距離",
  ],
  ["source_specs", "Source specs", "Especificaciones fuente", "來源規格"],
  ["pixel_size_source", "Pixel size source", "Fuente del tamaño de píxel", "像素尺寸來源"],
  ["db_load_error", "Could not load temporary database.", "No se pudo cargar la base de datos temporal.", "無法載入暫用資料庫。"],
  ["dori_detection_name", "Detection", "Detección", "偵測"],
  ["dori_observation_name", "Observation", "Observación", "觀察"],
  ["dori_recognition_name", "Recognition", "Reconocimiento", "辨識"],
  ["dori_identification_name", "Identification", "Identificación", "識別"],
  [
    "dori_detection_definition",
    "You can detect the presence of a subject (person, vehicle, object) in the scene, but no detail is sufficient to know what or who it is.",
    "Puede detectar la presencia de un sujeto (persona, vehículo u objeto) en la escena, pero no hay suficiente detalle para saber qué o quién es.",
    "可以偵測場景中有主體存在（人、車輛或物體），但細節不足以判斷是什麼或是誰。",
  ],
  [
    "dori_observation_definition",
    "Enough detail to observe some characteristics, such as clothing color, vehicle type, or object behavior, but still not sufficient for recognition.",
    "Hay suficiente detalle para observar características como color de ropa, tipo de vehículo o comportamiento del objeto, pero aún no alcanza para reconocerlo.",
    "具備足夠細節可觀察部分特徵，例如衣服顏色、車輛類型或物體行為，但仍不足以進行辨識。",
  ],
  [
    "dori_recognition_definition",
    "You can reliably say that the subject is the same as one seen before, though not necessarily identify them uniquely.",
    "Puede afirmar de forma fiable que el sujeto es el mismo que vio antes, aunque no necesariamente identificarlo de forma única.",
    "可以可靠判斷主體與先前看過的是同一個，但不一定能唯一識別其身分。",
  ],
  [
    "dori_identification_definition",
    "Enough resolution for unique identification, such as confirming who the person is or exactly what the object is.",
    "Resolución suficiente para una identificación única, como confirmar quién es la persona o exactamente qué objeto es.",
    "具備足夠解析度可進行唯一識別，例如確認人物身分或物體的確切資訊。",
  ],
  ["dori_detection_example", "Something is moving in that corner.", "Algo se mueve en esa esquina.", "角落有東西在移動。"],
  [
    "dori_observation_example",
    "That is a car, probably a sedan. That person is wearing a red jacket.",
    "Es un automóvil, probablemente un sedán. Esa persona lleva una chaqueta roja.",
    "那是一輛車，可能是轎車。那個人穿著紅色外套。",
  ],
  [
    "dori_recognition_example",
    "That is the same person I saw earlier. That is the same white Toyota Corolla.",
    "Es la misma persona que vi antes. Es el mismo Toyota Corolla blanco.",
    "那是我先前看過的同一個人。那是同一輛白色 Toyota Corolla。",
  ],
  [
    "dori_identification_example",
    "I can read every symbol of the license plate. That is definitely John's face.",
    "Puedo leer todos los caracteres de la placa. Definitivamente es el rostro de John.",
    "我可以讀出車牌上的每個字元。那確定是 John 的臉。",
  ],
].map(([key, en, es, zh_tw]) => ({ key, en, es, zh_tw }));

function cleanValue(value) {
  if (value == null) return null;
  return String(value)
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/gi, "&")
    .replace(/\s+\n/g, "\n")
    .replace(/\n\s+/g, "\n")
    .replace(/[ \t]+/g, " ")
    .trim();
}

function parseFirstResolution(value) {
  const match = cleanValue(value)?.match(/(\d{3,5})\s*x\s*(\d{3,5})/i);
  if (!match) return { horizontal: null, vertical: null };
  return { horizontal: Number(match[1]), vertical: Number(match[2]) };
}

function parseSensorFormat(value) {
  const text = cleanValue(value) ?? "";
  const match = text.match(/1\s*\/\s*([0-9]+(?:\.[0-9]+)?)/);
  return match ? `1/${match[1]}` : null;
}

function estimateSensor(sensorSize, horizontalResolution) {
  const sensorFormat = parseSensorFormat(sensorSize);
  const defaults = sensorFormat ? sensorFormatDefaults[sensorFormat] : null;

  if (!defaults || !horizontalResolution) {
    return {
      sensor_format: sensorFormat,
      estimated_active_width_mm: null,
      estimated_active_height_mm: null,
      pixel_size_um: null,
      pixel_size_source: "missing_estimate_inputs",
      pixel_size_confidence: "unknown",
      sensor_width_mm: null,
    };
  }

  const pixelSizeUm = (defaults.activeWidthMm * 1000) / horizontalResolution;

  return {
    sensor_format: sensorFormat,
    estimated_active_width_mm: defaults.activeWidthMm,
    estimated_active_height_mm: defaults.activeHeightMm,
    pixel_size_um: Number(pixelSizeUm.toFixed(3)),
    pixel_size_source: "estimated_from_sensor_format_and_resolution",
    pixel_size_confidence: "temporary",
    sensor_width_mm: Number(defaults.activeWidthMm.toFixed(3)),
  };
}

function parseFocalLength(value) {
  const text = cleanValue(value) ?? "";
  const focalRange = text.match(/f\s*([0-9]+(?:\.[0-9]+)?)(?:\s*-\s*([0-9]+(?:\.[0-9]+)?))?\s*mm/i);
  const nums = focalRange
    ? [focalRange[1], focalRange[2]].filter(Boolean).map((n) => Number(n))
    : [...text.matchAll(/([0-9]+(?:\.[0-9]+)?)\s*mm/gi)].map((m) => Number(m[1]));
  const lower = text.toLowerCase();
  const type = lower.includes("vari") || lower.includes("zoom") ? "variable" : "fixed";

  if (nums.length === 0) {
    return { type, fixedMm: null, minMm: null, maxMm: null };
  }

  if (type === "fixed" || nums.length === 1) {
    return { type: "fixed", fixedMm: nums[0], minMm: nums[0], maxMm: nums[0] };
  }

  return { type, fixedMm: null, minMm: Math.min(...nums), maxMm: Math.max(...nums) };
}

function getSpecMap(modelInfo) {
  return Object.fromEntries(
    modelInfo.ModelSpecList.map((item) => [item.Spec, cleanValue(item.Value)]),
  );
}

async function postModels(modelGuids) {
  const body = new URLSearchParams({
    __LangTag: "en",
    __Model: `${modelGuids.join("|")}|`,
  });

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!response.ok) {
    throw new Error(`Spec endpoint failed: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

async function main() {
  const shareResponse = await fetch(shareUrl);
  if (!shareResponse.ok) {
    throw new Error(`Share page failed: ${shareResponse.status} ${shareResponse.statusText}`);
  }

  const html = await shareResponse.text();
  const match = html.match(/var modelHiddenValue = '([^']+)'/);
  if (!match) {
    throw new Error("Could not find modelHiddenValue in share page.");
  }

  const modelGuids = match[1].split("|").filter(Boolean);
  const rawModels = [];

  for (let i = 0; i < modelGuids.length; i += 4) {
    rawModels.push(...(await postModels(modelGuids.slice(i, i + 4))));
  }

  const sensorsByKey = new Map();
  const cameras = [];
  const cameraSensors = [];

  rawModels.forEach((raw, index) => {
    const specs = getSpecMap(raw);
    const focal = parseFocalLength(specs.focallength);
    const resolution = parseFirstResolution(specs.maximumframeratevsresolution);
    const sensorKey = [specs.imagesensor, specs.sensorsize].filter(Boolean).join(" | ") || `unknown-${index + 1}`;

    if (!sensorsByKey.has(sensorKey)) {
      const sensorEstimate = estimateSensor(specs.sensorsize, resolution.horizontal);

      sensorsByKey.set(sensorKey, {
        id: sensorsByKey.size + 1,
        sensor_name: sensorKey,
        image_sensor: specs.imagesensor,
        sensor_size: specs.sensorsize,
        sensor_format: sensorEstimate.sensor_format,
        estimated_active_width_mm: sensorEstimate.estimated_active_width_mm,
        estimated_active_height_mm: sensorEstimate.estimated_active_height_mm,
        pixel_size_um: sensorEstimate.pixel_size_um,
        pixel_size_source: sensorEstimate.pixel_size_source,
        pixel_size_confidence: sensorEstimate.pixel_size_confidence,
        acti_max_horizontal_resolution: null,
        sensor_width_mm: sensorEstimate.sensor_width_mm,
      });
    }

    const camera = {
      id: index + 1,
      acti_guid: raw.Model,
      model: specs.ebiztitle,
      maximum_resolution_label: specs.maximumresolution,
      max_horizontal_resolution: resolution.horizontal,
      max_vertical_resolution: resolution.vertical,
      focal_length_type: focal.type,
      fixed_focal_length_mm: focal.fixedMm,
      min_focal_length_mm: focal.minMm,
      max_focal_length_mm: focal.maxMm,
      focal_length_raw: specs.focallength,
      max_frame_rate_vs_resolution: specs.maximumframeratevsresolution,
      horizontal_viewing_angle: specs.horizontalviewingangle,
      vertical_viewing_angle: specs.verticalviewingangle,
      observation_range_raw: specs.observationrange,
      application_environment: specs.applicationenvironment,
    };

    cameras.push(camera);
    cameraSensors.push({
      camera_id: camera.id,
      sensor_id: sensorsByKey.get(sensorKey).id,
      is_primary: true,
      notes: "Imported from ACTi shared product specification page.",
    });
  });

  const db = {
    source_url: shareUrl,
    imported_at: new Date().toISOString(),
    camera: cameras,
    sensor: [...sensorsByKey.values()],
    camera_vs_sensor: cameraSensors,
    dori: [
      { name: "Detection", ppm: 25, ppf: 8 },
      { name: "Observation", ppm: 62, ppf: 19 },
      { name: "Recognition", ppm: 125, ppf: 38 },
      { name: "Identification", ppm: 250, ppf: 76 },
    ],
    dictionary,
    missing_fields_to_fill: [
      "sensor.acti_max_horizontal_resolution",
      "official sensor.pixel_size_um",
      "official sensor.sensor_width_mm",
    ],
  };

  await fs.mkdir("data", { recursive: true });
  await fs.writeFile("data/temp-db.json", `${JSON.stringify(db, null, 2)}\n`);
  await fs.writeFile("data/temp-db.js", `window.LENS_CALCULATOR_TEMP_DB = ${JSON.stringify(db, null, 2)};\n`);

  console.log(`Imported ${db.camera.length} cameras and ${db.sensor.length} sensors.`);
  console.log("Wrote data/temp-db.json and data/temp-db.js");
}

await main();
