import { XMLParser } from "fast-xml-parser";
import type { EsfExtractedData } from "../domain/entities";

const MAX_INPUT_SIZE = 10 * 1024 * 1024; // 10 MB
const MAX_TEXT_LENGTH = 10000;

export class EsfParseError extends Error {
  code:
    | "unsupported_esf_format"
    | "xml_too_large"
    | "invalid_structure"
    | "missing_required_fields";
  constructor(
    code:
      | "unsupported_esf_format"
      | "xml_too_large"
      | "invalid_structure"
      | "missing_required_fields",
    message: string,
  ) {
    super(message);
    this.code = code;
    this.name = "EsfParseError";
  }
}

function truncateText(value: unknown): string {
  if (value === null || value === undefined) return "";
  const str = String(value).trim();
  return str.length > MAX_TEXT_LENGTH ? str.slice(0, MAX_TEXT_LENGTH) : str;
}

/**
 * Extract a value from a potentially namespace-prefixed tag.
 * e.g. extractTag(obj, "invoiceInfo") will find obj["invoiceInfo"] or obj["ns:invoiceInfo"]
 */
function extractTag(obj: Record<string, unknown>, tagName: string): unknown {
  if (obj[tagName] !== undefined) return obj[tagName];
  // Try namespace-prefixed variants
  for (const key of Object.keys(obj)) {
    const localPart = key.includes(":") ? key.split(":").pop() : undefined;
    if (localPart === tagName) return obj[key];
  }
  return undefined;
}

function extractNestedValue(obj: Record<string, unknown>, path: string[]): unknown {
  let current: unknown = obj;
  for (const segment of path) {
    if (current === null || current === undefined || typeof current !== "object") return undefined;
    current = extractTag(current as Record<string, unknown>, segment);
  }
  return current;
}

function requireField(value: unknown, fieldName: string): string {
  const text = truncateText(value);
  if (!text) {
    throw new EsfParseError("missing_required_fields", `Отсутствует обязательное поле: ${fieldName}`);
  }
  return text;
}

/**
 * Parse Kazakh ESF XML and extract structured data.
 * Safe parser config: no DTD, no external entities, no entity expansion.
 */
export function parseEsfXml(xmlString: string): EsfExtractedData {
  // Size check
  if (Buffer.byteLength(xmlString, "utf8") > MAX_INPUT_SIZE) {
    throw new EsfParseError("xml_too_large", "Файл слишком большой (максимум 10 МБ)");
  }

  const parser = new XMLParser({
    ignoreAttributes: false,
    // Security: disable DTD and entity processing
    processEntities: false,
    htmlEntities: false,
    stopNodes: ["*.comment"],
    // Allow CDATA
    cdataPropName: "__cdata",
  });

  let parsed: Record<string, unknown>;
  try {
    parsed = parser.parse(xmlString) as Record<string, unknown>;
  } catch {
    throw new EsfParseError("invalid_structure", "Не удалось разобрать XML");
  }

  if (!parsed || typeof parsed !== "object") {
    throw new EsfParseError("invalid_structure", "Пустой или некорректный XML");
  }

  // Find root Invoice element (may be namespace-prefixed)
  const invoiceRoot = extractTag(parsed, "Invoice") as Record<string, unknown> | undefined;
  if (!invoiceRoot || typeof invoiceRoot !== "object") {
    throw new EsfParseError("unsupported_esf_format", "Корневой элемент <Invoice> не найден");
  }

  // Navigate to invoiceInfo
  const invoiceInfo = extractNestedValue(invoiceRoot, ["invoiceInfo"]) as
    | Record<string, unknown>
    | undefined;
  if (!invoiceInfo || typeof invoiceInfo !== "object") {
    throw new EsfParseError("invalid_structure", "Блок <invoiceInfo> не найден");
  }

  const esfNumber = requireField(extractTag(invoiceInfo, "num"), "номер ЭСФ");
  const status = requireField(extractTag(invoiceInfo, "status"), "статус ЭСФ");
  const issueDate = requireField(extractTag(invoiceInfo, "date"), "дата выдачи ЭСФ");
  const turnoverDate = requireField(extractTag(invoiceInfo, "turnoverDate"), "дата оборота");
  const registrationNumber = truncateText(extractTag(invoiceInfo, "regNum")) || undefined;

  // Navigate to invoiceBody (may contain CDATA)
  const invoiceBody = extractNestedValue(invoiceRoot, ["invoiceBody"]) as
    | Record<string, unknown>
    | undefined;

  let sellerName = "";
  let sellerBinIin = "";
  let buyerName = "";
  let buyerBinIin = "";

  if (invoiceBody && typeof invoiceBody === "object") {
    // Find participants
    const participants = extractTag(invoiceBody, "participants");
    let participantList: Record<string, unknown>[] = [];

    if (Array.isArray(participants)) {
      participantList = participants as Record<string, unknown>[];
    } else if (participants && typeof participants === "object") {
      // Single participant wrapped in object
      const singleParticipant = extractTag(participants as Record<string, unknown>, "participant");
      if (Array.isArray(singleParticipant)) {
        participantList = singleParticipant as Record<string, unknown>[];
      } else if (singleParticipant && typeof singleParticipant === "object") {
        participantList = [singleParticipant as Record<string, unknown>];
      }
    }

    // Try direct participant tag under invoiceBody
    if (participantList.length === 0) {
      const directParticipant = extractTag(invoiceBody, "participant");
      if (Array.isArray(directParticipant)) {
        participantList = directParticipant as Record<string, unknown>[];
      } else if (directParticipant && typeof directParticipant === "object") {
        participantList = [directParticipant as Record<string, unknown>];
      }
    }

    for (const p of participantList) {
      const role = truncateText(extractTag(p, "role")).toLowerCase();
      const name = truncateText(extractTag(p, "name"));
      const bin = truncateText(extractTag(p, "bin"));

      if (role.includes("seller") || role.includes("продавец")) {
        sellerName = name;
        sellerBinIin = bin;
      } else if (role.includes("buyer") || role.includes("покупатель")) {
        buyerName = name;
        buyerBinIin = bin;
      }
    }

    // Fallback: try totalAmount from invoiceBody or invoiceInfo
    if (!sellerName) {
      const sellerBlock = extractNestedValue(invoiceBody, ["seller"]) as
        | Record<string, unknown>
        | undefined;
      if (sellerBlock) {
        sellerName = truncateText(extractTag(sellerBlock, "name"));
        sellerBinIin = truncateText(extractTag(sellerBlock, "bin"));
      }
    }
    if (!buyerName) {
      const buyerBlock = extractNestedValue(invoiceBody, ["buyer"]) as
        | Record<string, unknown>
        | undefined;
      if (buyerBlock) {
        buyerName = truncateText(extractTag(buyerBlock, "name"));
        buyerBinIin = truncateText(extractTag(buyerBlock, "bin"));
      }
    }
  }

  // Total amount
  let totalAmountTiyn = 0;
  const totalAmountFromInfo = extractTag(invoiceInfo, "totalAmount");
  const totalAmountFromBody = invoiceBody
    ? extractTag(invoiceBody as Record<string, unknown>, "totalAmount")
    : undefined;
  const rawTotal = totalAmountFromInfo ?? totalAmountFromBody;
  if (rawTotal !== undefined) {
    const parsed = parseFloat(truncateText(rawTotal));
    if (!isNaN(parsed)) {
      // Amount in XML is usually in tenge with decimal; convert to tiyn
      totalAmountTiyn = Math.round(parsed * 100);
    }
  }

  return {
    esfNumber,
    registrationNumber,
    status,
    issueDate,
    turnoverDate,
    sellerName,
    sellerBinIin,
    buyerName,
    buyerBinIin,
    totalAmountTiyn,
    formatVersion: "esf_export_v1",
  };
}
