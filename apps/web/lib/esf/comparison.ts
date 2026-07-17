import type { EsfExtractedData, EsfFieldComparison } from "../domain/entities";

type FieldDef = {
  key: keyof EsfExtractedData;
  label: string;
  source: string;
};

const FIELDS: FieldDef[] = [
  { key: "esfNumber", label: "Номер ЭСФ", source: "ЭСФ (ожидание)" },
  { key: "registrationNumber", label: "Регистрационный номер", source: "ЭСФ (ожидание)" },
  { key: "status", label: "Статус", source: "ЭСФ (ожидание)" },
  { key: "issueDate", label: "Дата выдачи", source: "ЭСФ (ожидание)" },
  { key: "turnoverDate", label: "Дата оборота", source: "ЭСФ (ожидание)" },
  { key: "sellerName", label: "Продавец (наименование)", source: "ЭСФ (ожидание)" },
  { key: "sellerBinIin", label: "Продавец (БИН/ИИН)", source: "ЭСФ (ожидание)" },
  { key: "buyerName", label: "Покупатель (наименование)", source: "ЭСФ (ожидание)" },
  { key: "buyerBinIin", label: "Покупатель (БИН/ИИН)", source: "ЭСФ (ожидание)" },
  { key: "totalAmountTiyn", label: "Сумма (тиын)", source: "ЭСФ (ожидание)" },
];

function normalizeString(value: unknown): string {
  return typeof value === "string" ? value.trim() : String(value ?? "").trim();
}

function normalizeAmount(value: unknown): string {
  return String(Number(value) || 0);
}

/**
 * Compare expected (baseline) ESF data with actual (final) ESF data field by field.
 * Returns an array of comparison results.
 */
export function compareEsfData(
  expected: EsfExtractedData,
  actual: EsfExtractedData,
): EsfFieldComparison[] {
  const results: EsfFieldComparison[] = [];

  for (const field of FIELDS) {
    const expectedVal = expected[field.key];
    const actualVal = actual[field.key];

    // Special handling for registrationNumber: empty expected + non-empty actual = match
    if (field.key === "registrationNumber") {
      const expStr = normalizeString(expectedVal);
      const actStr = normalizeString(actualVal);

      if (!expStr && actStr) {
        results.push({
          fieldName: field.label,
          expectedValue: "",
          actualValue: actStr,
          status: "match",
          explanation: "В исходном документе рег. номер отсутствовал, но в финальной версии он появился",
          expectedSource: field.source,
        });
      } else if (expStr && actStr && expStr === actStr) {
        results.push({
          fieldName: field.label,
          expectedValue: expStr,
          actualValue: actStr,
          status: "match",
          explanation: "Регистрационный номер совпадает",
          expectedSource: field.source,
        });
      } else if (expStr && actStr && expStr !== actStr) {
        results.push({
          fieldName: field.label,
          expectedValue: expStr,
          actualValue: actStr,
          status: "error",
          explanation: `Ожидался «${expStr}», получен «${actStr}»`,
          expectedSource: field.source,
        });
      } else {
        // both empty or expected empty, actual empty
        results.push({
          fieldName: field.label,
          expectedValue: expStr,
          actualValue: actStr,
          status: !expStr && !actStr ? "not_checked" : "match",
          explanation: !expStr && !actStr
            ? "Регистрационный номер отсутствует в обеих версиях"
            : "Значения совпадают",
          expectedSource: field.source,
        });
      }
      continue;
    }

    // Numeric fields (totalAmountTiyn)
    if (field.key === "totalAmountTiyn") {
      const expNorm = normalizeAmount(expectedVal);
      const actNorm = normalizeAmount(actualVal);

      if (expNorm === actNorm) {
        results.push({
          fieldName: field.label,
          expectedValue: expNorm,
          actualValue: actNorm,
          status: "match",
          explanation: "Сумма совпадает",
          expectedSource: field.source,
        });
      } else {
        const expNum = Number(expNorm);
        const actNum = Number(actNorm);
        const diff = actNum - expNum;
        const absDiff = Math.abs(diff);
        const threshold = expNum * 0.01; // 1% tolerance for warnings

        if (absDiff <= threshold && absDiff > 0) {
          results.push({
            fieldName: field.label,
            expectedValue: expNorm,
            actualValue: actNorm,
            status: "warning",
            explanation: `Разница ${absDiff} тиын (${((absDiff / expNum) * 100).toFixed(1)}%) — незначительное расхождение`,
            expectedSource: field.source,
          });
        } else {
          results.push({
            fieldName: field.label,
            expectedValue: expNorm,
            actualValue: actNorm,
            status: "error",
            explanation: `Ожидалось ${expNorm} тиын, получено ${actNorm} тиын`,
            expectedSource: field.source,
          });
        }
      }
      continue;
    }

    // String fields
    const expStr = normalizeString(expectedVal);
    const actStr = normalizeString(actualVal);

    if (expStr === actStr) {
      results.push({
        fieldName: field.label,
        expectedValue: expStr,
        actualValue: actStr,
        status: "match",
        explanation: "Значение совпадает",
        expectedSource: field.source,
      });
    } else if (!expStr && actStr) {
      results.push({
        fieldName: field.label,
        expectedValue: "",
        actualValue: actStr,
        status: "warning",
        explanation: `Поле было пустое, но получено значение «${actStr}»`,
        expectedSource: field.source,
      });
    } else if (expStr && !actStr) {
      results.push({
        fieldName: field.label,
        expectedValue: expStr,
        actualValue: "",
        status: "warning",
        explanation: `Ожидалось «${expStr}», но поле пустое`,
        expectedSource: field.source,
      });
    } else {
      results.push({
        fieldName: field.label,
        expectedValue: expStr,
        actualValue: actStr,
        status: "error",
        explanation: `Ожидалось «${expStr}», получено «${actStr}»`,
        expectedSource: field.source,
      });
    }
  }

  return results;
}

/**
 * Calculate overall verification result from field comparison.
 */
export function calculateVerificationResult(
  fields: EsfFieldComparison[],
): "passed" | "warnings" | "errors" {
  const hasErrors = fields.some((f) => f.status === "error");
  if (hasErrors) return "errors";

  const hasWarnings = fields.some(
    (f) => f.status === "warning" || f.status === "not_checked",
  );
  if (hasWarnings) return "warnings";

  return "passed";
}
