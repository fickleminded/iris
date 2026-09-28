const { test, describe, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const { createIrisEngine, createIrisOverlayState } = require("./helpers/qml-env.js");

describe("Math & Conversion Provider (CalcProvider)", () => {
  let engine;
  let CalcProvider;

  beforeEach(() => {
    const iris = createIrisEngine();
    engine = iris.Engine;
    CalcProvider = iris.CalcProvider;
  });

  describe("1. Mathematical Expression Evaluation (evaluateMath)", () => {
    test("evaluates basic arithmetic operations (+, -, *, /, %, ^)", () => {
      assert.strictEqual(CalcProvider.evaluateMath("25 + 17"), 42);
      assert.strictEqual(CalcProvider.evaluateMath("100 - 37"), 63);
      assert.strictEqual(CalcProvider.evaluateMath("12 * 12"), 144);
      assert.strictEqual(CalcProvider.evaluateMath("144 / 12"), 12);
      assert.strictEqual(CalcProvider.evaluateMath("25 % 7"), 4);
      assert.strictEqual(CalcProvider.evaluateMath("2 ^ 8"), 256);
    });

    test("supports alternate multiplication operators (x, X, ×)", () => {
      assert.strictEqual(CalcProvider.evaluateMath("15 x 4"), 60);
      assert.strictEqual(CalcProvider.evaluateMath("8 X 9"), 72);
      assert.strictEqual(CalcProvider.evaluateMath("7 × 6"), 42);
    });

    test("respects operator precedence and nested parentheses", () => {
      // 10 + 5 * 2 = 20, not 30
      assert.strictEqual(CalcProvider.evaluateMath("10 + 5 * 2"), 20);
      // (10 + 5) * 2 = 30
      assert.strictEqual(CalcProvider.evaluateMath("(10 + 5) * 2"), 30);
      // Nested
      assert.strictEqual(CalcProvider.evaluateMath("((2 + 3) * (4 + 1)) ^ 2"), 625);
    });

    test("evaluates mathematical constants in expressions (pi, e, tau)", () => {
      assert.strictEqual(CalcProvider.evaluateMath("pi * 1"), Math.PI);
      assert.strictEqual(CalcProvider.evaluateMath("1 * e"), Math.E);
      assert.strictEqual(CalcProvider.evaluateMath("tau / 2"), Math.PI);
      assert.strictEqual(CalcProvider.evaluateMath("2 * pi"), 2 * Math.PI);
      assert.strictEqual(CalcProvider.evaluateMath("sin(pi / 2)"), 1);
      assert.strictEqual(CalcProvider.evaluateMath("ln(e)"), 1);

      // Standalone word without operations or functions is not evaluated as a calculation
      assert.strictEqual(CalcProvider.evaluateMath("pi"), null);
      assert.strictEqual(CalcProvider.evaluateMath("e"), null);
    });

    test("evaluates standard math functions", () => {
      assert.strictEqual(CalcProvider.evaluateMath("sqrt(144)"), 12);
      assert.strictEqual(CalcProvider.evaluateMath("cbrt(27)"), 3);
      assert.strictEqual(CalcProvider.evaluateMath("abs(-42)"), 42);
      assert.strictEqual(CalcProvider.evaluateMath("floor(4.9)"), 4);
      assert.strictEqual(CalcProvider.evaluateMath("ceil(4.1)"), 5);
      assert.strictEqual(CalcProvider.evaluateMath("round(4.6)"), 5);
      assert.strictEqual(CalcProvider.evaluateMath("log10(1000)"), 3);
      assert.strictEqual(CalcProvider.evaluateMath("log2(1024)"), 10);
      assert.strictEqual(CalcProvider.evaluateMath("ln(e)"), 1);
      assert.strictEqual(CalcProvider.evaluateMath("exp(0)"), 1);
      assert.strictEqual(CalcProvider.evaluateMath("sin(0)"), 0);
      assert.strictEqual(CalcProvider.evaluateMath("cos(0)"), 1);
      assert.strictEqual(CalcProvider.evaluateMath("tan(0)"), 0);
    });

    test("evaluates percentage queries", () => {
      assert.strictEqual(CalcProvider.evaluateMath("20% of 150"), 30);
      assert.strictEqual(CalcProvider.evaluateMath("15% of 80"), 12);
      assert.strictEqual(CalcProvider.evaluateMath("50% * 200"), 100);
    });

    test("evaluates negative numbers and decimal exponents", () => {
      assert.strictEqual(CalcProvider.evaluateMath("-5 + 10"), 5);
      assert.strictEqual(CalcProvider.evaluateMath("4 ^ 0.5"), 2);
      assert.strictEqual(CalcProvider.evaluateMath("1e3 + 200"), 1200);
    });

    test("safely handles edge cases without throwing", () => {
      // Empty or whitespace
      assert.strictEqual(CalcProvider.evaluateMath(""), null);
      assert.strictEqual(CalcProvider.evaluateMath("   "), null);

      // Plain non-math text
      assert.strictEqual(CalcProvider.evaluateMath("hello world"), null);
      assert.strictEqual(CalcProvider.evaluateMath("firefox"), null);

      // Division by zero
      assert.strictEqual(CalcProvider.evaluateMath("10 / 0"), Infinity);

      // Unmatched syntax
      assert.strictEqual(CalcProvider.evaluateMath("(5 + 2"), null);
      assert.strictEqual(CalcProvider.evaluateMath("5 +* 2"), null);
      assert.strictEqual(CalcProvider.evaluateMath("unknownFunc(10)"), null);
    });
  });

  describe("2. Number Formatting & Calculation Result Model", () => {
    test("formats integers with locale strings", () => {
      assert.strictEqual(CalcProvider.formatNumber(1000), "1,000");
      assert.strictEqual(CalcProvider.formatNumber(1000000), "1,000,000");
    });

    test("formats decimals up to 6 decimal places", () => {
      assert.strictEqual(CalcProvider.formatNumber(3.14159265), "3.141593");
      assert.strictEqual(CalcProvider.formatNumber(0.125), "0.125");
    });

    test("generates full calculator item model with hex, binary, and scientific notation", () => {
      const item = CalcProvider.evaluate("255 + 1");
      assert.ok(item);
      assert.strictEqual(item.kind, "calc");
      assert.strictEqual(item.category, "Calculator");
      assert.strictEqual(item.name, "256");
      assert.strictEqual(item.rawResult, "256");
      assert.strictEqual(item.formattedResult, "256");
      assert.strictEqual(item.hasPreview, true);
      assert.strictEqual(item.previewType, "calc");
      assert.strictEqual(item.action, "copy");
      assert.strictEqual(item.isTopHit, true);

      // Breakdown details
      assert.strictEqual(item.details.isConversion, false);
      assert.strictEqual(item.details.isInteger, true);
      assert.strictEqual(item.details.hex, "0x100");
      assert.strictEqual(item.details.binary, "0b100000000");
    });

    test("rejects non-finite results (e.g. 1 / 0) from evaluation", () => {
      const item = CalcProvider.evaluate("10 / 0");
      assert.strictEqual(item, null);
    });
  });

  describe("3. Unit Conversions: Testing All Categories & Query Connectors", () => {
    test("supports multiple query connectors (to, in, into, =)", () => {
      const resTo = CalcProvider.parseUnitQuery("10 km to m");
      const resIn = CalcProvider.parseUnitQuery("10 km in m");
      const resInto = CalcProvider.parseUnitQuery("10 km into m");
      const resEquals = CalcProvider.parseUnitQuery("10 km = m");

      assert.ok(resTo);
      assert.strictEqual(resTo.toValue, 10000);
      assert.ok(resIn);
      assert.strictEqual(resIn.toValue, 10000);
      assert.ok(resInto);
      assert.strictEqual(resInto.toValue, 10000);
      assert.ok(resEquals);
      assert.strictEqual(resEquals.toValue, 10000);
    });

    test("Category 1: Length / Distance (m, km, cm, mm, mi, yd, ft, in, nm)", () => {
      // Metric
      const kmToM = CalcProvider.convertUnit(5, "km", "m");
      assert.strictEqual(kmToM.category, "Length / Distance");
      assert.strictEqual(kmToM.toValue, 5000);

      const mToCm = CalcProvider.convertUnit(2, "m", "cm");
      assert.strictEqual(mToCm.toValue, 200);

      const cmToMm = CalcProvider.convertUnit(15, "cm", "mm");
      assert.strictEqual(cmToMm.toValue, 150);

      // Imperial to Metric
      const miToKm = CalcProvider.convertUnit(10, "miles", "km");
      assert.strictEqual(Math.round(miToKm.toValue * 1000) / 1000, 16.093);

      const ydToM = CalcProvider.convertUnit(100, "yards", "m");
      assert.strictEqual(ydToM.toValue, 91.44);

      const ftToIn = CalcProvider.convertUnit(6, "feet", "inches");
      assert.strictEqual(Math.round(ftToIn.toValue), 72);

      const inToCm = CalcProvider.convertUnit(1, "inch", "cm");
      assert.strictEqual(inToCm.toValue, 2.54);

      // Nautical miles
      const nmToM = CalcProvider.convertUnit(1, "nm", "m");
      assert.strictEqual(nmToM.toValue, 1852);
    });

    test("Category 2: Mass & Weight (g, kg, mg, lb, oz, ton)", () => {
      const kgToG = CalcProvider.convertUnit(2.5, "kg", "g");
      assert.strictEqual(kgToG.category, "Mass & Weight");
      assert.strictEqual(kgToG.toValue, 2500);

      const gToMg = CalcProvider.convertUnit(1, "g", "mg");
      assert.strictEqual(gToMg.toValue, 1000);

      const lbToKg = CalcProvider.convertUnit(10, "lbs", "kg");
      assert.strictEqual(Math.round(lbToKg.toValue * 10000) / 10000, 4.5359);

      const lbToOz = CalcProvider.convertUnit(1, "lb", "oz");
      assert.strictEqual(Math.round(lbToOz.toValue), 16);

      const tToKg = CalcProvider.convertUnit(3, "ton", "kg");
      assert.strictEqual(tToKg.toValue, 3000);
    });

    test("Category 3: Temperature (Celsius, Fahrenheit, Kelvin)", () => {
      // Celsius to Fahrenheit
      const cToF = CalcProvider.convertUnit(100, "c", "f");
      assert.strictEqual(cToF.category, "Temperature");
      assert.strictEqual(cToF.toValue, 212);

      const freezeCtoF = CalcProvider.convertUnit(0, "celsius", "fahrenheit");
      assert.strictEqual(freezeCtoF.toValue, 32);

      // Fahrenheit to Celsius
      const fToC = CalcProvider.convertUnit(32, "f", "c");
      assert.strictEqual(fToC.toValue, 0);

      const boilFtoC = CalcProvider.convertUnit(212, "fahrenheit", "celsius");
      assert.strictEqual(boilFtoC.toValue, 100);

      // Celsius to Kelvin
      const cToK = CalcProvider.convertUnit(0, "c", "k");
      assert.strictEqual(cToK.toValue, 273.15);

      // Kelvin to Celsius
      const kToC = CalcProvider.convertUnit(273.15, "k", "c");
      assert.strictEqual(kToC.toValue, 0);

      // Fahrenheit to Kelvin
      const fToK = CalcProvider.convertUnit(32, "f", "k");
      assert.strictEqual(fToK.toValue, 273.15);

      // Degree symbol tolerance
      const degCtoF = CalcProvider.convertUnit(25, "°C", "°F");
      assert.strictEqual(degCtoF.toValue, 77);
    });

    test("Category 4: Digital Storage (bytes, KB, MB, GB, TB, KiB, MiB, GiB, TiB)", () => {
      const kbToB = CalcProvider.convertUnit(1, "kb", "bytes");
      assert.strictEqual(kbToB.category, "Digital Storage");
      assert.strictEqual(kbToB.toValue, 1024);

      const mbToKb = CalcProvider.convertUnit(1, "mb", "kb");
      assert.strictEqual(mbToKb.toValue, 1024);

      const gbToMb = CalcProvider.convertUnit(8, "gb", "mb");
      assert.strictEqual(gbToMb.toValue, 8192);

      const tbToGb = CalcProvider.convertUnit(2, "tb", "gb");
      assert.strictEqual(tbToGb.toValue, 2048);

      const gibToB = CalcProvider.convertUnit(1, "gib", "b");
      assert.strictEqual(gibToB.toValue, 1024 * 1024 * 1024);
    });

    test("Category 5: Time (ms, sec, min, hr, day, week, year)", () => {
      const sToMs = CalcProvider.convertUnit(5, "seconds", "ms");
      assert.strictEqual(sToMs.category, "Time");
      assert.strictEqual(sToMs.toValue, 5000);

      const minToS = CalcProvider.convertUnit(10, "minutes", "s");
      assert.strictEqual(minToS.toValue, 600);

      const hToMin = CalcProvider.convertUnit(2, "hours", "min");
      assert.strictEqual(hToMin.toValue, 120);

      const dToH = CalcProvider.convertUnit(3, "days", "hours");
      assert.strictEqual(dToH.toValue, 72);

      const wkToD = CalcProvider.convertUnit(2, "weeks", "days");
      assert.strictEqual(wkToD.toValue, 14);

      const yrToD = CalcProvider.convertUnit(1, "year", "days");
      assert.strictEqual(Math.round(yrToD.toValue), 365);
    });

    test("Category 6: Speed (m/s, km/h, mph, knots)", () => {
      const kmhToMps = CalcProvider.convertUnit(36, "km/h", "m/s");
      assert.strictEqual(kmhToMps.category, "Speed");
      assert.strictEqual(kmhToMps.toValue, 10);

      const mphToKmh = CalcProvider.convertUnit(60, "mph", "km/h");
      assert.strictEqual(Math.round(mphToKmh.toValue * 10) / 10, 96.6);

      const knotsToKmh = CalcProvider.convertUnit(10, "knots", "km/h");
      assert.strictEqual(Math.round(knotsToKmh.toValue * 10) / 10, 18.5);
    });

    test("Category 7: Volume (liter, ml, gallon, quart, pint, cup, floz)", () => {
      const lToMl = CalcProvider.convertUnit(1.5, "liter", "ml");
      assert.strictEqual(lToMl.category, "Volume");
      assert.strictEqual(lToMl.toValue, 1500);

      const galToL = CalcProvider.convertUnit(1, "gallon", "liters");
      assert.strictEqual(Math.round(galToL.toValue * 1000) / 1000, 3.785);

      const galToQt = CalcProvider.convertUnit(1, "gallon", "quarts");
      assert.strictEqual(Math.round(galToQt.toValue), 4);

      const qtToPt = CalcProvider.convertUnit(1, "quart", "pints");
      assert.strictEqual(Math.round(qtToPt.toValue), 2);

      const cupToFloz = CalcProvider.convertUnit(1, "cup", "floz");
      assert.strictEqual(Math.round(cupToFloz.toValue), 8);
    });

    test("Category 8: Area (sqm, sqkm, sqft, sqmi, acre, hectare)", () => {
      const sqkmToSqm = CalcProvider.convertUnit(1, "sqkm", "sqm");
      assert.strictEqual(sqkmToSqm.category, "Area");
      assert.strictEqual(sqkmToSqm.toValue, 1000000);

      const m2ToFt2 = CalcProvider.convertUnit(100, "m2", "ft2");
      assert.strictEqual(Math.round(m2ToFt2.toValue), 1076);

      const haToSqm = CalcProvider.convertUnit(1, "ha", "sqm");
      assert.strictEqual(haToSqm.toValue, 10000);

      const acreToSqft = CalcProvider.convertUnit(1, "acre", "sqft");
      assert.strictEqual(Math.round(acreToSqft.toValue), 43560);
    });

    test("Category 9: Power & Energy (watt, kw, hp, joules, kj, cal, kcal, kwh)", () => {
      const kwToW = CalcProvider.convertUnit(5, "kw", "watts");
      assert.strictEqual(kwToW.category, "Power & Energy");
      assert.strictEqual(kwToW.toValue, 5000);

      const hpToW = CalcProvider.convertUnit(1, "hp", "watts");
      assert.strictEqual(Math.round(hpToW.toValue), 746);

      const kjToJ = CalcProvider.convertUnit(2, "kj", "joules");
      assert.strictEqual(kjToJ.toValue, 2000);

      const calToJ = CalcProvider.convertUnit(1, "cal", "joules");
      assert.strictEqual(calToJ.toValue, 4.184);

      const kcalToCal = CalcProvider.convertUnit(1, "kcal", "cal");
      assert.strictEqual(kcalToCal.toValue, 1000);

      const kwhToJ = CalcProvider.convertUnit(1, "kwh", "joules");
      assert.strictEqual(kwhToJ.toValue, 3600000);
    });

    test("Category 10: Pressure (pa, kpa, bar, psi, atm)", () => {
      const kpaToPa = CalcProvider.convertUnit(5, "kpa", "pa");
      assert.strictEqual(kpaToPa.category, "Pressure");
      assert.strictEqual(kpaToPa.toValue, 5000);

      const barToPa = CalcProvider.convertUnit(1, "bar", "pa");
      assert.strictEqual(barToPa.toValue, 100000);

      const atmToPsi = CalcProvider.convertUnit(1, "atm", "psi");
      assert.strictEqual(Math.round(atmToPsi.toValue * 10) / 10, 14.7);

      const atmToPa = CalcProvider.convertUnit(1, "atm", "pa");
      assert.strictEqual(atmToPa.toValue, 101325);
    });

    test("Category 11: Currencies (USD, EUR, GBP, JPY, CAD, AUD, CHF, CNY, INR, KRW, BRL, MXN, BTC, ETH)", () => {
      const supportedCurrencies = [
        "usd", "eur", "gbp", "jpy", "cad", "aud", "chf",
        "cny", "inr", "krw", "brl", "mxn", "btc", "eth"
      ];

      // Test each currency converts to USD and has isCurrency flag
      for (const curr of supportedCurrencies) {
        const res = CalcProvider.convertUnit(100, curr, "usd");
        assert.ok(res, `Currency conversion failed for: ${curr}`);
        assert.strictEqual(res.isCurrency, true);
        assert.strictEqual(res.category, "Currency (Offline Reference)");
        assert.ok(typeof res.toValue === "number" && res.toValue > 0);
      }

      // Cross-currency conversion e.g. EUR to GBP
      const eurToGbp = CalcProvider.convertUnit(100, "eur", "gbp");
      assert.ok(eurToGbp);
      assert.strictEqual(eurToGbp.fromUnit, "€");
      assert.strictEqual(eurToGbp.toUnit, "£");
      assert.strictEqual(eurToGbp.isCurrency, true);

      // Bitcoin and Ethereum
      const btcToUsd = CalcProvider.convertUnit(1, "btc", "usd");
      assert.ok(btcToUsd);
      assert.strictEqual(btcToUsd.toValue, 65000);

      const ethToUsd = CalcProvider.convertUnit(2, "eth", "usd");
      assert.ok(ethToUsd);
      assert.strictEqual(ethToUsd.toValue, 6400);
    });

    test("prevents cross-category unit conversions (e.g. kg to meters)", () => {
      const invalidConv = CalcProvider.convertUnit(10, "kg", "meters");
      assert.strictEqual(invalidConv, null);

      const invalidQuery = CalcProvider.parseUnitQuery("10 kg to meters");
      assert.strictEqual(invalidQuery, null);
    });
  });

  describe("4. Item Model & Conversion Presentation", () => {
    test("generates conversion item with proper icons and preview metadata", () => {
      // Standard unit conversion icon is 󰪚
      const unitItem = CalcProvider.evaluate("10 km to miles");
      assert.ok(unitItem);
      assert.strictEqual(unitItem.kind, "calc");
      assert.strictEqual(unitItem.icon, "󰪚");
      assert.strictEqual(unitItem.hasPreview, true);
      assert.strictEqual(unitItem.previewType, "calc");
      assert.strictEqual(unitItem.details.isConversion, true);
      assert.strictEqual(unitItem.details.fromUnit, "km");
      assert.strictEqual(unitItem.details.toUnit, "mi");
      assert.ok(unitItem.details.rateText.includes("1 km ="));

      // Currency conversion icon is 󰅚
      const currItem = CalcProvider.evaluate("100 usd to eur");
      assert.ok(currItem);
      assert.strictEqual(currItem.icon, "󰅚");
      assert.strictEqual(currItem.details.isCurrency, true);
      assert.strictEqual(currItem.details.fromUnit, "$");
      assert.strictEqual(currItem.details.toUnit, "€");
    });
  });

  describe("5. Clipboard Copy Action (copyResult)", () => {
    test("copies raw calculation result via wl-copy command", () => {
      const executedCommands = [];
      const mockUtil = {
        shellQuote(s) {
          return "'" + String(s).replace(/'/g, "'\\''") + "'";
        },
        execDetached(cmd) {
          executedCommands.push(cmd);
          return true;
        }
      };

      const calcItem = CalcProvider.evaluate("128 * 2");
      CalcProvider.copyResult(calcItem, mockUtil);

      assert.strictEqual(executedCommands.length, 1);
      assert.strictEqual(executedCommands[0], "printf %s '256' | wl-copy");
    });

    test("copies formatted conversion result via wl-copy command", () => {
      const executedCommands = [];
      const mockUtil = {
        shellQuote(s) {
          return "'" + String(s).replace(/'/g, "'\\''") + "'";
        },
        execDetached(cmd) {
          executedCommands.push(cmd);
          return true;
        }
      };

      const convItem = CalcProvider.evaluate("1000 m to km");
      CalcProvider.copyResult(convItem, mockUtil);

      assert.strictEqual(executedCommands.length, 1);
      assert.strictEqual(executedCommands[0], "printf %s '1' | wl-copy");
    });
  });

  describe("6. Iris Overlay Integration: Adaptive Layout & Execution", () => {
    test("typing a math expression promotes calc result to top hit and adapts card width", () => {
      const overlay = createIrisOverlayState();
      overlay.open("{}");

      // Initially zero text -> hints list, single-pane 640px
      assert.strictEqual(overlay.filterText, "");
      assert.strictEqual(overlay.hasPreview, false);
      assert.strictEqual(overlay.currentCardWidth, 640);

      // Typing calculation
      overlay.setFilterText("125 * 8");

      assert.ok(overlay.itemsList.length > 0);
      const topHit = overlay.itemsList[0];
      assert.strictEqual(topHit.kind, "calc");
      assert.strictEqual(topHit.name, "1,000");
      assert.strictEqual(topHit.rawResult, "1000");

      // Adaptive UI expansion for instant calculator preview
      assert.strictEqual(overlay.hasPreview, true);
      assert.strictEqual(overlay.currentCardWidth, 920);
    });

    test("typing a unit conversion adapts card width and provides instant result", () => {
      const overlay = createIrisOverlayState();
      overlay.open("{}");

      overlay.setFilterText("100 f to c");

      assert.ok(overlay.itemsList.length > 0);
      const topHit = overlay.itemsList[0];
      assert.strictEqual(topHit.kind, "calc");
      assert.strictEqual(topHit.details.isConversion, true);
      assert.strictEqual(topHit.details.toUnit, "°C");

      assert.strictEqual(overlay.hasPreview, true);
      assert.strictEqual(overlay.currentCardWidth, 920);
    });

    test("activating a calc item copies the result and dismisses Iris", () => {
      const overlay = createIrisOverlayState();
      overlay.open("{}");
      overlay.setFilterText("42 * 10");

      const topHit = overlay.selectedItem;
      assert.strictEqual(topHit.kind, "calc");

      // User presses Enter
      overlay.activateItem(topHit);

      // Result copied to clipboard
      assert.strictEqual(overlay.launchedCommands.length, 1);
      assert.strictEqual(overlay.launchedCommands[0], "printf %s '420' | wl-copy");

      // Iris closed and hidden
      assert.strictEqual(overlay.opened, false);
      assert.ok(overlay.shellCalls.hide >= 1);
    });

    test("copyCalcResult helper copies without error", () => {
      const overlay = createIrisOverlayState();
      const item = CalcProvider.evaluate("50 + 50");

      overlay.copyCalcResult(item);

      assert.strictEqual(overlay.launchedCommands.length, 1);
      assert.strictEqual(overlay.launchedCommands[0], "printf %s '100' | wl-copy");
    });
  });
});
