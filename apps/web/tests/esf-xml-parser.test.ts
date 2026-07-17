import assert from "node:assert/strict";
import test from "node:test";
import { parseEsfXml, EsfParseError } from "../lib/esf/xml-parser.ts";

const VALID_ESF_XML = `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="http://www.example.com/esf">
  <invoiceInfo>
    <num>ЭСФ-2026-001</num>
    <regNum>REG-123456</regNum>
    <status>Проведен</status>
    <date>2026-05-15</date>
    <turnoverDate>2026-05-10</turnoverDate>
  </invoiceInfo>
  <invoiceBody>
    <seller>
      <name>Гранд Мебель</name>
      <bin>123-456-789-012</bin>
    </seller>
    <buyer>
      <name>Freedom Life</name>
      <bin>987-654-321-098</bin>
    </buyer>
    <totalAmount>1500000</totalAmount>
  </invoiceBody>
</Invoice>`;

test("Valid XML with Kazakh ESF structure → returns correct EsfExtractedData", () => {
  const result = parseEsfXml(VALID_ESF_XML);
  assert.equal(result.esfNumber, "ЭСФ-2026-001");
  assert.equal(result.registrationNumber, "REG-123456");
  assert.equal(result.status, "Проведен");
  assert.equal(result.issueDate, "2026-05-15");
  assert.equal(result.turnoverDate, "2026-05-10");
  assert.equal(result.sellerName, "Гранд Мебель");
  assert.equal(result.sellerBinIin, "123-456-789-012");
  assert.equal(result.buyerName, "Freedom Life");
  assert.equal(result.buyerBinIin, "987-654-321-098");
  assert.equal(result.totalAmountTiyn, 150000000, "1500000 tenge → 150000000 tiyn (×100)");
});

test("Valid XML with namespaced tags (ns:Invoice) → parses correctly", () => {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<ns:Invoice xmlns:ns="http://www.example.com/esf">
  <ns:invoiceInfo>
    <ns:num>ЭСФ-NS-001</ns:num>
    <ns:regNum>NS-REG-001</ns:regNum>
    <ns:status>Проведен</ns:status>
    <ns:date>2026-03-10</ns:date>
    <ns:turnoverDate>2026-03-05</ns:turnoverDate>
  </ns:invoiceInfo>
  <ns:invoiceBody>
    <ns:seller>
      <ns:name>Тест Продавец</ns:name>
      <ns:bin>111-222-333-444</ns:bin>
    </ns:seller>
    <ns:buyer>
      <ns:name>Тест Покупатель</ns:name>
      <ns:bin>555-666-777-888</ns:bin>
    </ns:buyer>
    <ns:totalAmount>50000</ns:totalAmount>
  </ns:invoiceBody>
</ns:Invoice>`;
  const result = parseEsfXml(xml);
  assert.equal(result.esfNumber, "ЭСФ-NS-001");
  assert.equal(result.registrationNumber, "NS-REG-001");
  assert.equal(result.status, "Проведен");
  assert.equal(result.issueDate, "2026-03-10");
  assert.equal(result.turnoverDate, "2026-03-05");
  assert.equal(result.sellerName, "Тест Продавец");
  assert.equal(result.sellerBinIin, "111-222-333-444");
  assert.equal(result.buyerName, "Тест Покупатель");
  assert.equal(result.buyerBinIin, "555-666-777-888");
  assert.equal(result.totalAmountTiyn, 5000000, "50000 tenge → 5000000 tiyn (×100)");
});

test("Empty string → throws EsfParseError", () => {
  try {
    parseEsfXml("");
    assert.fail("Should have thrown");
  } catch (err) {
    assert.ok(err instanceof EsfParseError, `Expected EsfParseError, got ${err}`);
    assert.equal(err.name, "EsfParseError");
    assert.ok(
      err.code === "unsupported_esf_format" || err.code === "invalid_structure",
      `Unexpected code: ${err.code}`,
    );
  }
});

test("XML without Invoice root → throws EsfParseError with unsupported_esf_format", () => {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<Root>
  <data>test</data>
</Root>`;
  try {
    parseEsfXml(xml);
    assert.fail("Should have thrown");
  } catch (err) {
    assert.ok(err instanceof EsfParseError);
    assert.equal(err.code, "unsupported_esf_format");
  }
});

test("Valid XML with CDATA sections → parses without crash", () => {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="http://www.example.com/esf">
  <invoiceInfo>
    <num>ЭСФ-CDATA-001</num>
    <status>Проведен</status>
    <date>2026-05-15</date>
    <turnoverDate>2026-05-10</turnoverDate>
  </invoiceInfo>
  <invoiceBody>
    <comment><![CDATA[This is a comment with <special> &amp; characters]]></comment>
    <totalAmount>100000</totalAmount>
  </invoiceBody>
</Invoice>`;
  const result = parseEsfXml(xml);
  assert.equal(result.esfNumber, "ЭСФ-CDATA-001");
  assert.equal(result.status, "Проведен");
  assert.equal(result.issueDate, "2026-05-15");
  assert.equal(result.turnoverDate, "2026-05-10");
  assert.equal(result.formatVersion, "esf_export_v1");
});

test("Verify extracted fields are all present in output", () => {
  const result = parseEsfXml(VALID_ESF_XML);
  assert.equal(typeof result.esfNumber, "string");
  assert.equal(typeof result.status, "string");
  assert.equal(typeof result.issueDate, "string");
  assert.equal(typeof result.turnoverDate, "string");
  assert.equal(typeof result.sellerName, "string");
  assert.equal(typeof result.sellerBinIin, "string");
  assert.equal(typeof result.buyerName, "string");
  assert.equal(typeof result.buyerBinIin, "string");
  assert.equal(typeof result.totalAmountTiyn, "number");
});

test("Verify formatVersion is set in output", () => {
  const result = parseEsfXml(VALID_ESF_XML);
  assert.equal(result.formatVersion, "esf_export_v1");
});

test("Very large XML (over 10MB) → throws EsfParseError xml_too_large", () => {
  const padding = "A".repeat(10 * 1024 * 1024 + 1);
  const xml = `<?xml version="1.0"?><Invoice><invoiceInfo><num>${padding}</num><status>OK</status><date>2026-01-01</date><turnoverDate>2026-01-01</turnoverDate></invoiceInfo></Invoice>`;
  try {
    parseEsfXml(xml);
    assert.fail("Should have thrown for oversized XML");
  } catch (err) {
    assert.ok(err instanceof EsfParseError);
    assert.equal(err.code, "xml_too_large");
  }
});

test("XML with missing required field (no status) → throws missing_required_fields", () => {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="http://www.example.com/esf">
  <invoiceInfo>
    <num>ЭСФ-002</num>
    <date>2026-05-15</date>
    <turnoverDate>2026-05-10</turnoverDate>
  </invoiceInfo>
  <invoiceBody></invoiceBody>
</Invoice>`;
  try {
    parseEsfXml(xml);
    assert.fail("Should have thrown");
  } catch (err) {
    assert.ok(err instanceof EsfParseError);
    assert.equal(err.code, "missing_required_fields");
  }
});

test("XML with participants structure (seller/buyer via role) → parses correctly", () => {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="http://www.example.com/esf">
  <invoiceInfo>
    <num>ЭСФ-PART-001</num>
    <status>Проведен</status>
    <date>2026-04-01</date>
    <turnoverDate>2026-03-28</turnoverDate>
  </invoiceInfo>
  <invoiceBody>
    <participants>
      <participant>
        <role>Продавец</role>
        <name>Участник А</name>
        <bin>123-456-789-012</bin>
      </participant>
      <participant>
        <role>Покупатель</role>
        <name>Участник Б</name>
        <bin>987-654-321-098</bin>
      </participant>
    </participants>
    <totalAmount>50000</totalAmount>
  </invoiceBody>
</Invoice>`;
  const result = parseEsfXml(xml);
  assert.equal(result.esfNumber, "ЭСФ-PART-001");
  assert.equal(result.sellerName, "Участник А");
  assert.equal(result.sellerBinIin, "123-456-789-012");
  assert.equal(result.buyerName, "Участник Б");
  assert.equal(result.buyerBinIin, "987-654-321-098");
  assert.equal(result.totalAmountTiyn, 5000000, "50000 tenge → 5000000 tiyn (×100)");
});

test("XML without registrationNumber → registrationNumber is undefined", () => {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="http://www.example.com/esf">
  <invoiceInfo>
    <num>ЭСФ-NOREG-001</num>
    <status>Проведен</status>
    <date>2026-05-15</date>
    <turnoverDate>2026-05-10</turnoverDate>
  </invoiceInfo>
  <invoiceBody></invoiceBody>
</Invoice>`;
  const result = parseEsfXml(xml);
  assert.equal(result.registrationNumber, undefined);
});

test("Malformed XML → throws EsfParseError", () => {
  const xml = `<?xml version="1.0"?><Invoice><unclosed>`;
  try {
    parseEsfXml(xml);
    assert.fail("Should have thrown for malformed XML");
  } catch (err) {
    assert.ok(err instanceof EsfParseError);
    assert.ok(
      err.code === "invalid_structure" || err.code === "unsupported_esf_format",
      `Unexpected code: ${err.code}`,
    );
  }
});

test("Pure-numeric bin values are parsed correctly by truncateText", () => {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="http://www.example.com/esf">
  <invoiceInfo>
    <num>ЭСФ-NUM-001</num>
    <status>Проведен</status>
    <date>2026-05-15</date>
    <turnoverDate>2026-05-10</turnoverDate>
  </invoiceInfo>
  <invoiceBody>
    <seller>
      <name>Продавец</name>
      <bin>123456789012</bin>
    </seller>
    <buyer>
      <name>Покупатель</name>
      <bin>987654321098</bin>
    </buyer>
    <totalAmount>100000</totalAmount>
  </invoiceBody>
</Invoice>`;
  const result = parseEsfXml(xml);
  assert.equal(result.sellerName, "Продавец");
  assert.equal(result.buyerName, "Покупатель");
  assert.equal(result.sellerBinIin, "123456789012", "truncateText converts numeric to string");
  assert.equal(result.buyerBinIin, "987654321098", "truncateText converts numeric to string");
  assert.equal(result.totalAmountTiyn, 10000000, "100000 tenge → 10000000 tiyn (×100)");
});
