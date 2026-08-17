#!/usr/bin/env node

const readline = require('readline');

function toDMS(decimal, type = 'lat') {
  const dir = decimal < 0
    ? (type === 'lat' ? 'S' : 'W')
    : (type === 'lat' ? 'N' : 'E');

  decimal = Math.abs(decimal);

  const deg = Math.floor(decimal);
  const minFloat = (decimal - deg) * 60;
  const min = Math.floor(minFloat);
  const sec = ((minFloat - min) * 60).toFixed(3);

  return `${deg}° ${min}′ ${sec}″ ${dir}`;
}

function toCompactDMS(decimal, type = 'lat') {
  const dir = decimal < 0
    ? (type === 'lat' ? 'S' : 'W')
    : (type === 'lat' ? 'N' : 'E');

  decimal = Math.abs(decimal);

  const deg = Math.floor(decimal);
  const minFloat = (decimal - deg) * 60;
  const min = Math.floor(minFloat);
  let sec = (minFloat - min) * 60;

  // Preserve fractional seconds to 3 decimal places.
  sec = Number(sec.toFixed(3));

  // Handle rounding to exactly 60 seconds.
  if (sec >= 60) {
    sec = 0;

    if (min + 1 >= 60) {
      return toCompactDMS(deg + 1, type);
    }

    return `${String(deg).padStart(type === 'lat' ? 2 : 3, '0')}${String(min + 1).padStart(2, '0')}00${dir}`;
  }

  const secStr = sec
    .toFixed(3)
    .replace(/0+$/, '')
    .replace(/\.$/, '');

  return `${String(deg).padStart(type === 'lat' ? 2 : 3, '0')}${String(min).padStart(2, '0')}${secStr.padStart(2, '0')}${dir}`;
}

function parseDecimal(str) {
  const [lat, lon] = str.split(',').map(s => parseFloat(s.trim()));

  if (isNaN(lat) || isNaN(lon)) {
    throw new Error('Invalid decimal input');
  }

  return { lat, lon };
}

function parseDMS(str) {
  const dmsRegex = /(\d+)°\s*(\d+)[′']\s*([\d.]+)[″"]?\s*([NSEW])/;
  const match = str.match(dmsRegex);

  if (!match) {
    throw new Error(`Invalid DMS: ${str}`);
  }

  const [, deg, min, sec, dir] = match;

  let dec = +deg + +min / 60 + +sec / 3600;

  if (dir === 'S' || dir === 'W') {
    dec *= -1;
  }

  return dec;
}

function parseCompactDMS(str) {
  const value = str.trim().toUpperCase();
  const dir = value.slice(-1);
  const numeric = value.slice(0, -1);

  if (!['N', 'S', 'E', 'W'].includes(dir)) {
    throw new Error(`Invalid Compact DMS: ${str}`);
  }

  // Latitude: DDMMSS[.sss]
  // Longitude: DDDMMSS[.sss]
  const degreeDigits = ['N', 'S'].includes(dir) ? 2 : 3;

  const pattern = new RegExp(
    `^(\\d{${degreeDigits}})(\\d{2})(\\d{2}(?:\\.\\d+)?)$`
  );

  const match = numeric.match(pattern);

  if (!match) {
    throw new Error(`Invalid Compact DMS: ${str}`);
  }

  const [, deg, min, sec] = match;

  if (+min >= 60 || +sec >= 60) {
    throw new Error(`Invalid Compact DMS: ${str}`);
  }

  let dec = +deg + +min / 60 + +sec / 3600;

  if (dir === 'S' || dir === 'W') {
    dec *= -1;
  }

  return dec;
}

// Format selector
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question(
  "座標を入力してください（例：34° 01′ 59.740″ N、または 354555N、または 34.03,-118.81）:\n> ",
  input => {
    let lat, lon;

    try {
      input = input.trim();

      // Compact DMS pair:
      // DDMMSS[.sss]N,DDDMMSS[.sss]E
      const compactPairRegex =
        /^\d{6}(?:\.\d+)?[NS]\s*,\s*\d{7}(?:\.\d+)?[EW]$/i;

      if (compactPairRegex.test(input)) {
        const [latStr, lonStr] = input.split(',').map(s => s.trim());

        lat = parseCompactDMS(latStr);
        lon = parseCompactDMS(lonStr);

      } else if (input.match(/[°′″]/)) {
        lat = parseDMS(input);

        rl.question(
          "経度も同様にDMS形式で入力してください:\n> ",
          input2 => {
            try {
              lon = parseDMS(input2);
              askFormat(lat, lon);
            } catch (e) {
              console.error(e.message);
              rl.close();
            }
          }
        );

        return;

      } else if (input.match(/^\d{6}(?:\.\d+)?[NS]$/i)) {
        lat = parseCompactDMS(input);

        rl.question(
          "経度も同様にCompact形式で入力してください（例：1414130E、または1414130.28E）:\n> ",
          input2 => {
            try {
              lon = parseCompactDMS(input2);
              askFormat(lat, lon);
            } catch (e) {
              console.error(e.message);
              rl.close();
            }
          }
        );

        return;

      } else if (input.includes(',')) {
        ({ lat, lon } = parseDecimal(input));

      } else {
        throw new Error("形式が不明です。");
      }

      askFormat(lat, lon);

    } catch (e) {
      console.error(e.message);
      rl.close();
    }
  }
);

function askFormat(lat, lon) {
  console.log(`\n入力された座標（10進）: ${lat}, ${lon}\n`);

  rl.question(
    "どの形式に変換しますか？（decimal/dms/compact/all）:\n> ",
    fmt => {
      fmt = fmt.trim().toLowerCase();

      switch (fmt) {
        case 'decimal':
          console.log(
            `Decimal: ${lat.toFixed(6)}, ${lon.toFixed(6)}`
          );
          break;

        case 'dms':
          console.log(
            `DMS: ${toDMS(lat, 'lat')}, ${toDMS(lon, 'lon')}`
          );
          break;

        case 'compact':
          console.log(
            `Compact: ${toCompactDMS(lat, 'lat')}, ${toCompactDMS(lon, 'lon')}`
          );
          break;

        case 'all':
          console.log(
            `Decimal: ${lat.toFixed(6)}, ${lon.toFixed(6)}`
          );

          console.log(
            `DMS: ${toDMS(lat, 'lat')}, ${toDMS(lon, 'lon')}`
          );

          console.log(
            `Compact: ${toCompactDMS(lat, 'lat')}, ${toCompactDMS(lon, 'lon')}`
          );
          break;

        default:
          console.log("無効な選択です");
      }

      rl.close();
    }
  );
}
