import assert from "node:assert/strict";
import test from "node:test";
import { buildCompanyProfilePayload, emptyCompanyProfileForm, profileToForm, validateCompanyProfileForm } from "../lib/company-profile-form.ts";

test("company profile payload keeps only editable fields and trims values", () => {
  const payload = buildCompanyProfilePayload({ ...emptyCompanyProfileForm, legalName: "  ИП Гранд Мебель  ", binIin: " 123456789012 ", address: "   ", bankName: " Банк " });
  assert.equal(payload.legalName, "ИП Гранд Мебель"); assert.equal(payload.binIin, "123456789012"); assert.equal(payload.address, undefined); assert.equal(payload.bankName, "Банк");
  assert.equal("id" in payload, false); assert.equal("invoiceNumbering" in payload, false); assert.equal("createdAt" in payload, false);
});

test("profile mapping does not expose immutable fields", () => {
  const form = profileToForm({ id: "company-1", legalName: "ИП Тест", binIin: "123456789012", vatMode: "without_vat", invoiceNumbering: { prefix: "INV-", nextNumber: 42 }, createdAt: "now", updatedAt: "now" });
  assert.equal(form.legalName, "ИП Тест"); assert.equal("id" in form, false); assert.equal("invoiceNumbering" in form, false);
});

test("company profile validation covers required and formatted fields", () => {
  assert.equal(validateCompanyProfileForm(emptyCompanyProfileForm), "Укажите название компании");
  assert.equal(validateCompanyProfileForm({ ...emptyCompanyProfileForm, legalName: "ИП Тест", binIin: "123" }), "БИН/ИИН должен содержать 12 цифр");
  assert.equal(validateCompanyProfileForm({ ...emptyCompanyProfileForm, legalName: "ИП Тест", binIin: "123456789012", email: "bad" }), "Проверьте адрес электронной почты");
  assert.equal(validateCompanyProfileForm({ ...emptyCompanyProfileForm, legalName: "ИП Тест", binIin: "123456789012" }), null);
});
