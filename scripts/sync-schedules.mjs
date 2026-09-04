/**
 * Portable Caribbean destination schedule sync.
 *
 * Reads authority imported schedule JSON for this port, validates schema,
 * writes local generated schedule data. Destination-specific values come from
 * scripts/destination.config.json (port slug, paths, expected totals).
 *
 * GENERATED OUTPUT IS FROM CARIBBEAN AUTHORITY — DO NOT MANUALLY EDIT.
 *
 * Usage: npm run sync:schedules
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const configPath = path.join(__dirname, "destination.config.json");

function fail(msg) {
  console.error(`sync:schedules ERROR: ${msg}`);
  process.exit(1);
}

function loadConfig() {
  if (!existsSync(configPath)) fail(`Missing config: ${configPath}`);
  return JSON.parse(readFileSync(configPath, "utf8"));
}

function normaliseCall(raw) {
  const date = String(raw.date || "").trim();
  const ship = String(raw.ship || "").trim();
  const cruiseLine = String(raw.cruiseLine || raw.cruise_line || "").trim();
  const arrival = String(raw.arrival || "").trim();
  const departure = String(raw.departure || "").trim();
  const timeInPort = String(raw.timeInPort || raw.time_in_port || "").trim();
  const passengers = String(raw.passengers || "").trim();

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) fail(`Invalid date: ${date}`);
  if (!ship) fail(`Missing ship on ${date}`);
  if (!cruiseLine) fail(`Missing cruiseLine on ${date} / ${ship}`);

  return {
    date,
    ship,
    cruiseLine,
    arrival: arrival || null,
    departure: departure || null,
    timeInPort: timeInPort || null,
    passengers: passengers || null,
  };
}

function fingerprint(c) {
  return [c.date, c.ship, c.cruiseLine, c.arrival || "", c.departure || ""].join("|");
}

function main() {
  const config = loadConfig();
  const sourcePath = path.resolve(root, config.authoritySource);
  if (!existsSync(sourcePath)) {
    fail(`Authority source absent: ${sourcePath}`);
  }

  let payload;
  try {
    payload = JSON.parse(readFileSync(sourcePath, "utf8"));
  } catch (e) {
    fail(`Malformed authority JSON: ${e.message}`);
  }

  if (!Array.isArray(payload)) {
    fail("Authority Tortola schedule must be a JSON array of call records");
  }

  const calls = payload.map(normaliseCall);
  const byYear = {};
  const byMonth = {};
  const ships = new Set();
  const lines = new Set();
  const fps = new Set();
  let duplicates = 0;

  for (const c of calls) {
    const y = c.date.slice(0, 4);
    const m = c.date.slice(0, 7);
    byYear[y] = (byYear[y] || 0) + 1;
    byMonth[m] = (byMonth[m] || 0) + 1;
    ships.add(c.ship);
    lines.add(c.cruiseLine);
    const fp = fingerprint(c);
    if (fps.has(fp)) duplicates += 1;
    else fps.add(fp);
  }

  const expected = config.expectedTotals || {};
  if (expected.total != null && calls.length !== expected.total) {
    fail(`Total mismatch: got ${calls.length}, expected ${expected.total}`);
  }
  if (expected.byYear) {
    for (const [y, n] of Object.entries(expected.byYear)) {
      const got = byYear[y] || 0;
      if (got !== n) fail(`Year ${y} mismatch: got ${got}, expected ${n}`);
    }
  }

  // Cross-port contamination: this file is port-specific; reject foreign port keys
  const contamination = [];
  for (const raw of payload) {
    const port = String(raw.port || raw.portSlug || raw.destination || "").toLowerCase();
    if (port && port !== config.portSlug && !port.includes(config.portSlug)) {
      contamination.push(port);
    }
  }
  if (contamination.length) {
    fail(`Cross-port contamination detected: ${[...new Set(contamination)].join(", ")}`);
  }

  const dates = calls.map((c) => c.date).sort();
  const populatedMonths = Object.keys(byMonth).sort();

  const out = {
    _comment:
      "GENERATED FROM CARIBBEAN AUTHORITY — DO NOT MANUALLY EDIT. Run npm run sync:schedules",
    port: config.portSlug,
    portDisplayName: config.destinationName,
    syncedAt: new Date().toISOString(),
    sourceFile: path.relative(root, sourcePath).replace(/\\/g, "/"),
    source: "caribbean-shore-excursions imported schedules",
    filter: `authority file ${config.portSlug}.json (port-specific import)`,
    callCount: calls.length,
    integrity: {
      total: calls.length,
      byYear,
      byMonth,
      firstDate: dates[0] || null,
      lastDate: dates[dates.length - 1] || null,
      uniqueShips: ships.size,
      cruiseLines: lines.size,
      populatedMonths: populatedMonths.length,
      duplicateFingerprints: duplicates,
      has2028: Boolean(byYear["2028"]),
    },
    cruiseLineList: [...lines].sort(),
    shipList: [...ships].sort(),
    populatedMonthList: populatedMonths,
    calls,
  };

  const outPath = path.resolve(root, config.localOutput);
  mkdirSync(path.dirname(outPath), { recursive: true });
  writeFileSync(outPath, `${JSON.stringify(out, null, 2)}\n`);

  // Lightweight month index for static search / sitemap helpers
  const indexPath = path.join(path.dirname(outPath), "schedule-index.json");
  writeFileSync(
    indexPath,
    `${JSON.stringify(
      {
        _comment: "GENERATED FROM CARIBBEAN AUTHORITY — DO NOT MANUALLY EDIT",
        port: config.portSlug,
        callCount: calls.length,
        byYear,
        byMonth,
        populatedMonths,
        years: Object.keys(byYear)
          .filter((y) => (byYear[y] || 0) > 0 && y !== "2028")
          .sort(),
      },
      null,
      2,
    )}\n`,
  );

  console.log(`Synced ${config.destinationName} schedules`);
  console.log(JSON.stringify(out.integrity, null, 2));
  console.log("Wrote", outPath);
  console.log("Wrote", indexPath);
}

main();
