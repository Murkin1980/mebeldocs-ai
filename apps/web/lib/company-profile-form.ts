import type { CompanyProfile } from "./domain/entities";

export type CompanyProfileForm = Pick<CompanyProfile, "legalName" | "binIin" | "address" | "bankName" | "bik" | "iban" | "phone" | "email" | "directorName" | "activityBasis" | "vatMode">;

export const emptyCompanyProfileForm: CompanyProfileForm = { legalName: "", binIin: "", address: "", bankName: "", bik: "", iban: "", phone: "", email: "", directorName: "", activityBasis: "", vatMode: "without_vat" };

export function profileToForm(profile: CompanyProfile): CompanyProfileForm {
  return { legalName: profile.legalName, binIin: profile.binIin, address: profile.address ?? "", bankName: profile.bankName ?? "", bik: profile.bik ?? "", iban: profile.iban ?? "", phone: profile.phone ?? "", email: profile.email ?? "", directorName: profile.directorName ?? "", activityBasis: profile.activityBasis ?? "", vatMode: profile.vatMode };
}

export function buildCompanyProfilePayload(form: CompanyProfileForm): CompanyProfileForm {
  const clean = (value?: string) => value?.trim() || undefined;
  return { legalName: form.legalName.trim(), binIin: form.binIin.trim(), address: clean(form.address), bankName: clean(form.bankName), bik: clean(form.bik), iban: clean(form.iban), phone: clean(form.phone), email: clean(form.email), directorName: clean(form.directorName), activityBasis: clean(form.activityBasis), vatMode: form.vatMode };
}

export function validateCompanyProfileForm(form: CompanyProfileForm): string | null {
  if (!form.legalName.trim()) return "Укажите название компании";
  if (!/^\d{12}$/.test(form.binIin.trim())) return "БИН/ИИН должен содержать 12 цифр";
  if (form.email?.trim() && !/^\S+@\S+\.\S+$/.test(form.email.trim())) return "Проверьте адрес электронной почты";
  return null;
}
