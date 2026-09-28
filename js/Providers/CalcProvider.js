.pragma library

// CalcProvider.js: Math & Unit Conversion Calculator for Iris Spotlight
// Safe mathematical expression evaluator and unit/currency conversion engine.

var UNITS = {
  length: {
    name: "Length / Distance",
    base: "m",
    units: {
      m: { factor: 1, name: "meters", symbol: "m" },
      meter: { factor: 1, name: "meters", symbol: "m" },
      meters: { factor: 1, name: "meters", symbol: "m" },
      metre: { factor: 1, name: "meters", symbol: "m" },
      metres: { factor: 1, name: "meters", symbol: "m" },
      km: { factor: 1000, name: "kilometers", symbol: "km" },
      kilometer: { factor: 1000, name: "kilometers", symbol: "km" },
      kilometers: { factor: 1000, name: "kilometers", symbol: "km" },
      kilometre: { factor: 1000, name: "kilometers", symbol: "km" },
      kilometres: { factor: 1000, name: "kilometers", symbol: "km" },
      cm: { factor: 0.01, name: "centimeters", symbol: "cm" },
      centimeter: { factor: 0.01, name: "centimeters", symbol: "cm" },
      centimeters: { factor: 0.01, name: "centimeters", symbol: "cm" },
      mm: { factor: 0.001, name: "millimeters", symbol: "mm" },
      millimeter: { factor: 0.001, name: "millimeters", symbol: "mm" },
      millimeters: { factor: 0.001, name: "millimeters", symbol: "mm" },
      mi: { factor: 1609.344, name: "miles", symbol: "mi" },
      mile: { factor: 1609.344, name: "miles", symbol: "mi" },
      miles: { factor: 1609.344, name: "miles", symbol: "mi" },
      yd: { factor: 0.9144, name: "yards", symbol: "yd" },
      yard: { factor: 0.9144, name: "yards", symbol: "yd" },
      yards: { factor: 0.9144, name: "yards", symbol: "yd" },
      ft: { factor: 0.3048, name: "feet", symbol: "ft" },
      foot: { factor: 0.3048, name: "feet", symbol: "ft" },
      feet: { factor: 0.3048, name: "feet", symbol: "ft" },
      in: { factor: 0.0254, name: "inches", symbol: "in" },
      inch: { factor: 0.0254, name: "inches", symbol: "in" },
      inches: { factor: 0.0254, name: "inches", symbol: "in" },
      nm: { factor: 1852, name: "nautical miles", symbol: "nmi" }
    }
  },
  mass: {
    name: "Mass & Weight",
    base: "g",
    units: {
      g: { factor: 1, name: "grams", symbol: "g" },
      gram: { factor: 1, name: "grams", symbol: "g" },
      grams: { factor: 1, name: "grams", symbol: "g" },
      kg: { factor: 1000, name: "kilograms", symbol: "kg" },
      kilogram: { factor: 1000, name: "kilograms", symbol: "kg" },
      kilograms: { factor: 1000, name: "kilograms", symbol: "kg" },
      kilo: { factor: 1000, name: "kilograms", symbol: "kg" },
      kilos: { factor: 1000, name: "kilograms", symbol: "kg" },
      mg: { factor: 0.001, name: "milligrams", symbol: "mg" },
      milligram: { factor: 0.001, name: "milligrams", symbol: "mg" },
      milligrams: { factor: 0.001, name: "milligrams", symbol: "mg" },
      lb: { factor: 453.59237, name: "pounds", symbol: "lb" },
      lbs: { factor: 453.59237, name: "pounds", symbol: "lb" },
      pound: { factor: 453.59237, name: "pounds", symbol: "lb" },
      pounds: { factor: 453.59237, name: "pounds", symbol: "lb" },
      oz: { factor: 28.349523125, name: "ounces", symbol: "oz" },
      ounce: { factor: 28.349523125, name: "ounces", symbol: "oz" },
      ounces: { factor: 28.349523125, name: "ounces", symbol: "oz" },
      t: { factor: 1000000, name: "metric tons", symbol: "t" },
      ton: { factor: 1000000, name: "metric tons", symbol: "t" },
      tons: { factor: 1000000, name: "metric tons", symbol: "t" },
      tonne: { factor: 1000000, name: "metric tons", symbol: "t" },
      tonnes: { factor: 1000000, name: "metric tons", symbol: "t" }
    }
  },
  temperature: {
    name: "Temperature",
    isTemp: true,
    units: {
      c: { symbol: "°C", name: "Celsius" },
      celsius: { symbol: "°C", name: "Celsius" },
      celcius: { symbol: "°C", name: "Celsius" },
      centigrade: { symbol: "°C", name: "Celsius" },
      f: { symbol: "°F", name: "Fahrenheit" },
      fahrenheit: { symbol: "°F", name: "Fahrenheit" },
      farenheit: { symbol: "°F", name: "Fahrenheit" },
      farenheight: { symbol: "°F", name: "Fahrenheit" },
      fahrenheight: { symbol: "°F", name: "Fahrenheit" },
      k: { symbol: "K", name: "Kelvin" },
      kelvin: { symbol: "K", name: "Kelvin" }
    }
  },
  storage: {
    name: "Digital Storage",
    base: "b",
    units: {
      b: { factor: 1, name: "bytes", symbol: "B" },
      byte: { factor: 1, name: "bytes", symbol: "B" },
      bytes: { factor: 1, name: "bytes", symbol: "B" },
      kb: { factor: 1024, name: "kilobytes", symbol: "KB" },
      kilobyte: { factor: 1024, name: "kilobytes", symbol: "KB" },
      kilobytes: { factor: 1024, name: "kilobytes", symbol: "KB" },
      kib: { factor: 1024, name: "kibibytes", symbol: "KiB" },
      mb: { factor: 1024 * 1024, name: "megabytes", symbol: "MB" },
      megabyte: { factor: 1024 * 1024, name: "megabytes", symbol: "MB" },
      megabytes: { factor: 1024 * 1024, name: "megabytes", symbol: "MB" },
      mib: { factor: 1024 * 1024, name: "mebibytes", symbol: "MiB" },
      gb: { factor: 1024 * 1024 * 1024, name: "gigabytes", symbol: "GB" },
      gigabyte: { factor: 1024 * 1024 * 1024, name: "gigabytes", symbol: "GB" },
      gigabytes: { factor: 1024 * 1024 * 1024, name: "gigabytes", symbol: "GB" },
      gib: { factor: 1024 * 1024 * 1024, name: "gibibytes", symbol: "GiB" },
      tb: { factor: 1024 * 1024 * 1024 * 1024, name: "terabytes", symbol: "TB" },
      terabyte: { factor: 1024 * 1024 * 1024 * 1024, name: "terabytes", symbol: "TB" },
      terabytes: { factor: 1024 * 1024 * 1024 * 1024, name: "terabytes", symbol: "TB" },
      tib: { factor: 1024 * 1024 * 1024 * 1024, name: "tebibytes", symbol: "TiB" }
    }
  },
  time: {
    name: "Time",
    base: "s",
    units: {
      ms: { factor: 0.001, name: "milliseconds", symbol: "ms" },
      millisecond: { factor: 0.001, name: "milliseconds", symbol: "ms" },
      milliseconds: { factor: 0.001, name: "milliseconds", symbol: "ms" },
      s: { factor: 1, name: "seconds", symbol: "s" },
      sec: { factor: 1, name: "seconds", symbol: "s" },
      second: { factor: 1, name: "seconds", symbol: "s" },
      seconds: { factor: 1, name: "seconds", symbol: "s" },
      min: { factor: 60, name: "minutes", symbol: "min" },
      minute: { factor: 60, name: "minutes", symbol: "min" },
      minutes: { factor: 60, name: "minutes", symbol: "min" },
      h: { factor: 3600, name: "hours", symbol: "h" },
      hr: { factor: 3600, name: "hours", symbol: "h" },
      hour: { factor: 3600, name: "hours", symbol: "h" },
      hours: { factor: 3600, name: "hours", symbol: "h" },
      d: { factor: 86400, name: "days", symbol: "d" },
      day: { factor: 86400, name: "days", symbol: "d" },
      days: { factor: 86400, name: "days", symbol: "d" },
      wk: { factor: 604800, name: "weeks", symbol: "wk" },
      week: { factor: 604800, name: "weeks", symbol: "wk" },
      weeks: { factor: 604800, name: "weeks", symbol: "wk" },
      yr: { factor: 31557600, name: "years", symbol: "yr" },
      year: { factor: 31557600, name: "years", symbol: "yr" },
      years: { factor: 31557600, name: "years", symbol: "yr" }
    }
  },
  speed: {
    name: "Speed",
    base: "m/s",
    units: {
      "m/s": { factor: 1, name: "meters per second", symbol: "m/s" },
      mps: { factor: 1, name: "meters per second", symbol: "m/s" },
      "km/h": { factor: 1 / 3.6, name: "kilometers per hour", symbol: "km/h" },
      kmh: { factor: 1 / 3.6, name: "kilometers per hour", symbol: "km/h" },
      kph: { factor: 1 / 3.6, name: "kilometers per hour", symbol: "km/h" },
      mph: { factor: 0.44704, name: "miles per hour", symbol: "mph" },
      knot: { factor: 0.514444, name: "knots", symbol: "kn" },
      knots: { factor: 0.514444, name: "knots", symbol: "kn" }
    }
  },
  volume: {
    name: "Volume",
    base: "l",
    units: {
      l: { factor: 1, name: "liters", symbol: "L" },
      liter: { factor: 1, name: "liters", symbol: "L" },
      liters: { factor: 1, name: "liters", symbol: "L" },
      litre: { factor: 1, name: "liters", symbol: "L" },
      litres: { factor: 1, name: "liters", symbol: "L" },
      ml: { factor: 0.001, name: "milliliters", symbol: "mL" },
      milliliter: { factor: 0.001, name: "milliliters", symbol: "mL" },
      milliliters: { factor: 0.001, name: "milliliters", symbol: "mL" },
      gal: { factor: 3.78541, name: "gallons", symbol: "gal" },
      gallon: { factor: 3.78541, name: "gallons", symbol: "gal" },
      gallons: { factor: 3.78541, name: "gallons", symbol: "gal" },
      qt: { factor: 0.946353, name: "quarts", symbol: "qt" },
      quart: { factor: 0.946353, name: "quarts", symbol: "qt" },
      quarts: { factor: 0.946353, name: "quarts", symbol: "qt" },
      pt: { factor: 0.473176, name: "pints", symbol: "pt" },
      pint: { factor: 0.473176, name: "pints", symbol: "pt" },
      pints: { factor: 0.473176, name: "pints", symbol: "pt" },
      cup: { factor: 0.236588, name: "cups", symbol: "cup" },
      cups: { factor: 0.236588, name: "cups", symbol: "cup" },
      floz: { factor: 0.0295735, name: "fluid ounces", symbol: "fl oz" }
    }
  },
  area: {
    name: "Area",
    base: "m2",
    units: {
      sqm: { factor: 1, name: "square meters", symbol: "m²" },
      m2: { factor: 1, name: "square meters", symbol: "m²" },
      sqkm: { factor: 1000000, name: "square kilometers", symbol: "km²" },
      km2: { factor: 1000000, name: "square kilometers", symbol: "km²" },
      sqft: { factor: 0.092903, name: "square feet", symbol: "ft²" },
      ft2: { factor: 0.092903, name: "square feet", symbol: "ft²" },
      sqmi: { factor: 2589988.11, name: "square miles", symbol: "mi²" },
      mi2: { factor: 2589988.11, name: "square miles", symbol: "mi²" },
      acre: { factor: 4046.8564224, name: "acres", symbol: "acres" },
      acres: { factor: 4046.8564224, name: "acres", symbol: "acres" },
      ha: { factor: 10000, name: "hectares", symbol: "ha" },
      hectare: { factor: 10000, name: "hectares", symbol: "ha" },
      hectares: { factor: 10000, name: "hectares", symbol: "ha" }
    }
  },
  power: {
    name: "Power & Energy",
    base: "w",
    units: {
      w: { factor: 1, name: "watts", symbol: "W" },
      watt: { factor: 1, name: "watts", symbol: "W" },
      watts: { factor: 1, name: "watts", symbol: "W" },
      kw: { factor: 1000, name: "kilowatts", symbol: "kW" },
      kilowatt: { factor: 1000, name: "kilowatts", symbol: "kW" },
      kilowatts: { factor: 1000, name: "kilowatts", symbol: "kW" },
      hp: { factor: 745.699872, name: "horsepower", symbol: "hp" },
      j: { factor: 1, name: "joules", symbol: "J" },
      joule: { factor: 1, name: "joules", symbol: "J" },
      joules: { factor: 1, name: "joules", symbol: "J" },
      kj: { factor: 1000, name: "kilojoules", symbol: "kJ" },
      cal: { factor: 4.184, name: "calories", symbol: "cal" },
      kcal: { factor: 4184, name: "kilocalories", symbol: "kcal" },
      kwh: { factor: 3600000, name: "kilowatt-hours", symbol: "kWh" }
    }
  },
  pressure: {
    name: "Pressure",
    base: "pa",
    units: {
      pa: { factor: 1, name: "pascals", symbol: "Pa" },
      kpa: { factor: 1000, name: "kilopascals", symbol: "kPa" },
      bar: { factor: 100000, name: "bars", symbol: "bar" },
      bars: { factor: 100000, name: "bars", symbol: "bar" },
      psi: { factor: 6894.757, name: "psi", symbol: "psi" },
      atm: { factor: 101325, name: "atmospheres", symbol: "atm" }
    }
  },
  currency: {
    name: "Currency (Offline Reference)",
    isCurrency: true,
    units: {
      usd: { factor: 1.0, name: "US Dollar", symbol: "$" },
      eur: { factor: 1.08, name: "Euro", symbol: "€" },
      gbp: { factor: 1.28, name: "British Pound", symbol: "£" },
      jpy: { factor: 0.0066, name: "Japanese Yen", symbol: "¥" },
      cad: { factor: 0.73, name: "Canadian Dollar", symbol: "CA$" },
      aud: { factor: 0.65, name: "Australian Dollar", symbol: "AU$" },
      chf: { factor: 1.13, name: "Swiss Franc", symbol: "CHF" },
      cny: { factor: 0.14, name: "Chinese Yuan", symbol: "CN¥" },
      inr: { factor: 0.012, name: "Indian Rupee", symbol: "₹" },
      krw: { factor: 0.00073, name: "South Korean Won", symbol: "₩" },
      brl: { factor: 0.18, name: "Brazilian Real", symbol: "R$" },
      mxn: { factor: 0.051, name: "Mexican Peso", symbol: "MX$" },
      btc: { factor: 65000.0, name: "Bitcoin", symbol: "₿" },
      eth: { factor: 3200.0, name: "Ethereum", symbol: "Ξ" }
    }
  }
};

function formatNumber(n) {
  if (n === null || n === undefined || isNaN(n) || !isFinite(n)) return String(n);
  if (Number.isInteger(n)) return n.toLocaleString("en-US");
  var rounded = parseFloat(n.toPrecision(12));
  if (Number.isInteger(rounded)) return rounded.toLocaleString("en-US");
  if (Math.abs(rounded) < 1e12 && Math.abs(rounded) > 1e-6) {
    return rounded.toLocaleString("en-US", { maximumFractionDigits: 6 });
  }
  return n.toExponential(4);
}

function convertTemperature(value, from, to) {
  var isFromF = (from === "f" || from === "fahrenheit" || from === "farenheit" || from === "farenheight" || from === "fahrenheight");
  var isFromK = (from === "k" || from === "kelvin");

  var celsius = value;
  if (isFromF) {
    celsius = (value - 32) * (5 / 9);
  } else if (isFromK) {
    celsius = value - 273.15;
  }

  var isToF = (to === "f" || to === "fahrenheit" || to === "farenheit" || to === "farenheight" || to === "fahrenheight");
  var isToK = (to === "k" || to === "kelvin");

  var result = celsius;
  if (isToF) {
    result = (celsius * 9 / 5) + 32;
  } else if (isToK) {
    result = celsius + 273.15;
  }
  return result;
}

function convertUnit(value, fromUnitStr, toUnitStr) {
  var from = (fromUnitStr || "").toLowerCase().trim().replace(/°/g, "");
  var to = (toUnitStr || "").toLowerCase().trim().replace(/°/g, "");

  for (var catKey in UNITS) {
    var cat = UNITS[catKey];
    if (cat.isTemp) {
      if (cat.units[from] && cat.units[to]) {
        var res = convertTemperature(value, from, to);
        return {
          category: cat.name,
          fromValue: value,
          fromUnit: cat.units[from].symbol,
          fromName: cat.units[from].name,
          toValue: res,
          toUnit: cat.units[to].symbol,
          toName: cat.units[to].name,
          isCurrency: false
        };
      }
    } else if (cat.units && cat.units[from] && cat.units[to]) {
      var fromDef = cat.units[from];
      var toDef = cat.units[to];
      var baseVal = value * fromDef.factor;
      var finalVal = baseVal / toDef.factor;
      return {
        category: cat.name,
        fromValue: value,
        fromUnit: fromDef.symbol,
        fromName: fromDef.name,
        toValue: finalVal,
        toUnit: toDef.symbol,
        toName: toDef.name,
        rate: fromDef.factor / toDef.factor,
        isCurrency: cat.isCurrency === true
      };
    }
  }
  return null;
}

function parseUnitQuery(query) {
  var q = (query || "").trim();
  var match = q.match(/^([+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?)\s*([a-zA-Z°\/]+)\s+(?:to|in|into|=)\s+([a-zA-Z°\/]+)$/i);
  if (match) {
    var val = parseFloat(match[1]);
    var fromU = match[2];
    var toU = match[3];
    return convertUnit(val, fromU, toU);
  }
  return null;
}

// Tokenizer & Safe Recursive-Descent Math Evaluator
function evaluateMath(expression) {
  var expr = (expression || "").trim();
  if (expr.length === 0) return null;

  // Handle percentage syntax: e.g. "20% of 150" => "(20 / 100) * 150"
  var ofMatch = expr.match(/^([+-]?(?:\d+\.?\d*|\.\d+))%\s+of\s+(.+)$/i);
  if (ofMatch) {
    expr = "(" + ofMatch[1] + " / 100) * (" + ofMatch[2] + ")";
  }

  // Tokenize
  var tokens = [];
  var i = 0;
  var len = expr.length;

  var hasMathIntent = /[\+\-\*\/\^\%×]|sqrt|cbrt|sin|cos|tan|asin|acos|atan|abs|log|ln|exp|pi\b|e\b|\(|\)|[\d\)]\s*[xX×]\s*[\d\(]/i.test(expr);
  if (!hasMathIntent) return null;

  while (i < len) {
    var ch = expr[i];
    if (/\s/.test(ch)) {
      i++;
      continue;
    }

    if (/\d/.test(ch) || (ch === '.' && i + 1 < len && /\d/.test(expr[i + 1]))) {
      var numStr = "";
      while (i < len && (/[\d\.]/.test(expr[i]) || (/[eE]/.test(expr[i]) && (expr[i + 1] === '+' || expr[i + 1] === '-' || /\d/.test(expr[i + 1]))))) {
        numStr += expr[i];
        if (/[eE]/.test(expr[i])) {
          i++;
          if (i < len && (expr[i] === '+' || expr[i] === '-')) {
            numStr += expr[i];
            i++;
          }
          continue;
        }
        i++;
      }
      var numVal = parseFloat(numStr);
      if (isNaN(numVal)) return null;

      if (i < len && expr[i] === '%') {
        numVal = numVal / 100;
        i++;
      }
      tokens.push({ type: "NUMBER", value: numVal });
      continue;
    }

    if (ch === '+' || ch === '-' || ch === '*' || ch === '/' || ch === '^' || ch === '%' || ch === '(' || ch === ')') {
      tokens.push({ type: "OP", value: ch });
      i++;
      continue;
    }

    if (ch === '×' || ch === 'x' || ch === 'X') {
      var prev = tokens.length > 0 ? tokens[tokens.length - 1] : null;
      if (prev && (prev.type === "NUMBER" || (prev.type === "OP" && prev.value === ')'))) {
        tokens.push({ type: "OP", value: '*' });
        i++;
        continue;
      }
    }

    if (/[a-zA-Z]/.test(ch)) {
      var word = "";
      while (i < len && /[a-zA-Z0-9]/.test(expr[i])) {
        word += expr[i];
        i++;
      }
      var lowerWord = word.toLowerCase();
      if (lowerWord === "pi") {
        tokens.push({ type: "NUMBER", value: Math.PI });
      } else if (lowerWord === "e") {
        tokens.push({ type: "NUMBER", value: Math.E });
      } else if (lowerWord === "tau") {
        tokens.push({ type: "NUMBER", value: 2 * Math.PI });
      } else if (/^(sqrt|cbrt|sin|cos|tan|asin|acos|atan|abs|floor|ceil|round|log|log10|log2|ln|exp)$/.test(lowerWord)) {
        tokens.push({ type: "FUNC", value: lowerWord });
      } else {
        return null;
      }
      continue;
    }

    return null;
  }

  if (tokens.length === 0) return null;

  // Verify that expression contains at least one operator, function, or constant
  var hasOperation = false;
  for (var t = 0; t < tokens.length; t++) {
    if (tokens[t].type === "FUNC" || tokens[t].type === "OP") {
      hasOperation = true;
      break;
    }
  }
  if (!hasOperation) return null;

  var cur = 0;

  function peek() {
    return cur < tokens.length ? tokens[cur] : null;
  }

  function consume() {
    return cur < tokens.length ? tokens[cur++] : null;
  }

  function parsePrimary() {
    var tok = peek();
    if (!tok) throw new Error("Unexpected end");

    if (tok.type === "OP" && tok.value === '+') {
      consume();
      return parsePrimary();
    }
    if (tok.type === "OP" && tok.value === '-') {
      consume();
      var val = parsePrimary();
      return -val;
    }
    if (tok.type === "NUMBER") {
      consume();
      return tok.value;
    }
    if (tok.type === "FUNC") {
      consume();
      var fnName = tok.value;
      var next = peek();
      if (!next || next.value !== '(') throw new Error("Expected '(' after function");
      consume();
      var arg = parseExpression();
      var closeP = peek();
      if (!closeP || closeP.value !== ')') throw new Error("Expected ')'");
      consume();

      switch (fnName) {
        case "sqrt": return Math.sqrt(arg);
        case "cbrt": return Math.cbrt(arg);
        case "sin": return Math.sin(arg);
        case "cos": return Math.cos(arg);
        case "tan": return Math.tan(arg);
        case "asin": return Math.asin(arg);
        case "acos": return Math.acos(arg);
        case "atan": return Math.atan(arg);
        case "abs": return Math.abs(arg);
        case "floor": return Math.floor(arg);
        case "ceil": return Math.ceil(arg);
        case "round": return Math.round(arg);
        case "log": return Math.log(arg);
        case "ln": return Math.log(arg);
        case "log10": return Math.log10(arg);
        case "log2": return Math.log2(arg);
        case "exp": return Math.exp(arg);
        default: throw new Error("Unknown func " + fnName);
      }
    }
    if (tok.type === "OP" && tok.value === '(') {
      consume();
      var inner = parseExpression();
      var close = peek();
      if (!close || close.value !== ')') throw new Error("Expected ')'");
      consume();
      return inner;
    }
    throw new Error("Unexpected token");
  }

  function parsePower() {
    var left = parsePrimary();
    var tok = peek();
    if (tok && tok.type === "OP" && tok.value === '^') {
      consume();
      var right = parsePower();
      return Math.pow(left, right);
    }
    return left;
  }

  function parseMulDiv() {
    var left = parsePower();
    while (true) {
      var tok = peek();
      if (!tok || tok.type !== "OP") break;
      if (tok.value === '*' || tok.value === '/' || tok.value === '%') {
        consume();
        var right = parsePower();
        if (tok.value === '*') left = left * right;
        else if (tok.value === '/') {
          if (right === 0) return Infinity;
          left = left / right;
        } else if (tok.value === '%') {
          left = left % right;
        }
      } else {
        break;
      }
    }
    return left;
  }

  function parseAddSub() {
    var left = parseMulDiv();
    while (true) {
      var tok = peek();
      if (!tok || tok.type !== "OP") break;
      if (tok.value === '+' || tok.value === '-') {
        consume();
        var right = parseMulDiv();
        if (tok.value === '+') left = left + right;
        else if (tok.value === '-') left = left - right;
      } else {
        break;
      }
    }
    return left;
  }

  function parseExpression() {
    return parseAddSub();
  }

  try {
    var result = parseExpression();
    if (cur !== tokens.length) return null;
    if (typeof result !== "number" || isNaN(result)) return null;
    return result;
  } catch (err) {
    return null;
  }
}

// Main evaluation entry point for Iris Spotlight
function evaluate(query) {
  var q = (query || "").trim();
  if (q.length === 0) return null;

  // 1. Try Unit & Currency conversion first
  var conv = parseUnitQuery(q);
  if (conv) {
    var formattedVal = formatNumber(conv.toValue);
    var formattedFromVal = formatNumber(conv.fromValue);
    var displayUnit = conv.toUnit || "";
    var nameStr = formattedVal + (displayUnit.length > 0 ? " " + displayUnit : "");
    var rawStr = String(parseFloat(conv.toValue.toPrecision(12)));

    return {
      id: "calc-conv-" + q,
      kind: "calc",
      category: conv.category || "Conversion",
      name: nameStr,
      description: "= " + nameStr + " (" + formattedFromVal + " " + conv.fromUnit + ")",
      expression: q,
      rawResult: rawStr,
      formattedResult: nameStr,
      icon: conv.isCurrency ? "󰅚" : "󰪚",
      isTopHit: true,
      hasPreview: true,
      previewType: "calc",
      action: "copy",
      details: {
        isConversion: true,
        category: conv.category,
        fromValue: conv.fromValue,
        fromFormatted: formattedFromVal,
        fromUnit: conv.fromUnit,
        fromName: conv.fromName,
        toValue: conv.toValue,
        toFormatted: formattedVal,
        toUnit: conv.toUnit,
        toName: conv.toName,
        rateText: conv.rate ? ("1 " + conv.fromUnit + " = " + formatNumber(conv.rate) + " " + conv.toUnit) : "",
        isCurrency: conv.isCurrency === true
      }
    };
  }

  // 2. Try Math expression evaluation
  var mathVal = evaluateMath(q);
  if (mathVal !== null && isFinite(mathVal)) {
    var formatted = formatNumber(mathVal);
    var isInt = Number.isInteger(mathVal) && Math.abs(mathVal) < 1e15;
    var hexVal = (isInt && mathVal >= 0 && mathVal <= 0xFFFFFFFF) ? ("0x" + mathVal.toString(16).toUpperCase()) : null;
    var binVal = (isInt && mathVal >= 0 && mathVal <= 0xFFFF) ? ("0b" + mathVal.toString(2)) : null;
    var sciVal = (Math.abs(mathVal) >= 1e4 || (Math.abs(mathVal) < 0.01 && mathVal !== 0)) ? mathVal.toExponential(4) : null;
    var rawMathStr = String(parseFloat(mathVal.toPrecision(12)));

    return {
      id: "calc-math-" + q,
      kind: "calc",
      category: "Calculator",
      name: formatted,
      description: "= " + formatted + " (" + q + ")",
      expression: q,
      rawResult: rawMathStr,
      formattedResult: formatted,
      icon: "󰪚",
      isTopHit: true,
      hasPreview: true,
      previewType: "calc",
      action: "copy",
      details: {
        isConversion: false,
        category: "Calculation",
        raw: rawMathStr,
        formatted: formatted,
        isInteger: isInt,
        hex: hexVal,
        binary: binVal,
        scientific: sciVal
      }
    };
  }

  return null;
}

// Copy result to clipboard via wl-copy
function copyResult(item, quickshellUtil) {
  if (!item) return;
  var textToCopy = item.rawResult || item.name || "";
  if (quickshellUtil && typeof quickshellUtil.execDetached === "function") {
    quickshellUtil.execDetached("printf %s " + quickshellUtil.shellQuote(textToCopy) + " | wl-copy");
  }
}
