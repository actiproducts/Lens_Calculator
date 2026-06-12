# ACTi Lens Calculator Prototype

This repository contains the working prototype for the new ACTi Lens Calculator.

Live preview:

https://actiproducts.github.io/Lens_Calculator/

## Purpose

The tool helps users find suitable ACTi camera models based on:

- Surveillance objective: Detection, Observation, Recognition, or Identification
- Target distance
- Distance unit: meters or feet
- Lens type
- Optional model search

The prototype uses a temporary local database so the UI and calculation workflow can be reviewed before connecting to the official ACTi product database.

## Main Files

- `index.html` - page structure
- `styles.css` - visual design
- `app.js` - calculator logic, filtering, language switching, dialogs
- `data/temp-db.json` - temporary test database
- `data/temp-db.js` - browser-ready copy of the temporary database
- `assets/dori/` - visual reference images for DORI levels
- `import-acti-share.mjs` - importer that builds the temporary database from ACTi shared spec data
- `smoke-test.mjs` - lightweight validation test

## Database Documentation

See [docs/schema.md](docs/schema.md) for the temporary database schema, table relationships, and calculation flow.

## Notes

Pixel size values in the temporary database are estimated from sensor format and resolution. They are marked as temporary in the data and should be replaced by official ACTi database values later.
