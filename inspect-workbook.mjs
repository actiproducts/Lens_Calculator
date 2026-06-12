import { FileBlob, SpreadsheetFile } from "@oai/artifact-tool";

const filePath =
  "C:/Users/ando.meritee.ACTIAD/Desktop/Excel-Word-PDF/Lens Calculator_Enhancement_Support DORI_250702.xlsx";

const input = await FileBlob.load(filePath);
const workbook = await SpreadsheetFile.importXlsx(input);

const overview = await workbook.inspect({
  kind: "workbook,sheet,table",
  maxChars: 20000,
  tableMaxRows: 10,
  tableMaxCols: 16,
  tableMaxCellChars: 100,
});

console.log(overview.ndjson);

const formulas = await workbook.inspect({
  kind: "formula",
  maxChars: 12000,
  options: { maxResults: 100 },
});

console.log(formulas.ndjson);
