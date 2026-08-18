"use client";

import { useEffect, useState } from "react";
import AppShell from "../../components/AppShell";
import type { CompanyProfile } from "../../lib/domain/entities";
import { buildCompanyProfilePayload, emptyCompanyProfileForm, profileToForm, validateCompanyProfileForm, type CompanyProfileForm } from "../../lib/company-profile-form";
import "./company-profile.css";
import "./navigation.css";

const fields: Array<{ key: keyof CompanyProfileForm; label: string; placeholder?: string; type?: string; span?: boolean }> = [
  { key: "legalName", label: "Юридическое название *", placeholder: "ИП Гранд Мебель", span: true }, { key: "binIin", label: "БИН / ИИН *", placeholder: "12 цифр" },
  { key: "directorName", label: "Руководитель", placeholder: "ФИО" }, { key: "address", label: "Юридический адрес", placeholder: "Город, улица, дом", span: true },
  { key: "phone", label: "Телефон", placeholder: "+7 700 000 00 00", type: "tel" }, { key: "email", label: "Электронная почта", placeholder: "office@example.kz", type: "email" },
  { key: "bankName", label: "Банк", placeholder: "Название банка" }, { key: "bik", label: "БИК", placeholder: "Банковский код" },
  { key: "iban", label: "ИИК / IBAN", placeholder: "KZ...", span: true }, { key: "activityBasis", label: "Основание деятельности", placeholder: "Свидетельство, талон или устав", span: true },
];

export default function CompanyProfilePage() {
  const [form, setForm] = useState<CompanyProfileForm>(emptyCompanyProfileForm); const [loading, setLoading] = useState(true); const [saving, setSaving] = useState(false);
  const [isNew, setIsNew] = useState(false); const [error, setError] = useState<string | null>(null); const [saved, setSaved] = useState(false);
  useEffect(() => { fetch("/api/company-profile", { cache: "no-store" }).then(async (response) => { if (response.status === 404) { setIsNew(true); return null; } if (!response.ok) throw new Error("Не удалось загрузить профиль компании"); return response.json() as Promise<CompanyProfile>; }).then((profile) => { if (profile) setForm(profileToForm(profile)); }).catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Не удалось загрузить профиль компании")).finally(() => setLoading(false)); }, []);
  function update<K extends keyof CompanyProfileForm>(key: K, value: CompanyProfileForm[K]) { setSaved(false); setForm((current) => ({ ...current, [key]: value })); }
  async function submit(event: React.FormEvent) { event.preventDefault(); const validationError = validateCompanyProfileForm(form); if (validationError) { setError(validationError); return; } setSaving(true); setError(null); setSaved(false); try { const response = await fetch("/api/company-profile", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(buildCompanyProfilePayload(form)) }); if (!response.ok) throw new Error("Не удалось сохранить профиль компании"); const profile = await response.json() as CompanyProfile; setForm(profileToForm(profile)); setIsNew(false); setSaved(true); } catch (reason: unknown) { setError(reason instanceof Error ? reason.message : "Не удалось сохранить профиль компании"); } finally { setSaving(false); } }
  return <AppShell activePage="Компания"><div style={{ maxWidth: 900, margin: "0 auto" }}><div className="titleRow profileTitle"><div><p className="eyebrow">НАСТРОЙКИ ДОКУМЕНТОВ</p><h1>Профиль компании</h1><p>Эти реквизиты подставляются в счета и закрывающие документы.</p></div><span className="profileSafety">Локальная песочница</span></div>
    <form onSubmit={submit} className="profileForm"><section className="reviewCard profileCard"><div className="profileCardHead"><div><span className="profileIndex">01</span><div><h2>Реквизиты</h2><p>{isNew ? "Создайте профиль пилотной компании" : "Проверьте данные перед выпуском документов"}</p></div></div><span>Системные поля защищены</span></div>
      {loading ? <div className="profileState">Загружаем профиль...</div> : <div className="profileGrid">{fields.map((field) => <label key={field.key} className={field.span ? "profileSpan" : undefined}><span>{field.label}</span><input type={field.type ?? "text"} value={String(form[field.key] ?? "")} placeholder={field.placeholder} onChange={(event) => update(field.key, event.target.value as never)} disabled={saving} /></label>)}<label><span>Режим НДС</span><select value={form.vatMode} onChange={(event) => update("vatMode", event.target.value as CompanyProfileForm["vatMode"])} disabled={saving}><option value="without_vat">Без НДС</option><option value="vat_payer">Плательщик НДС</option><option value="unknown">Нужно уточнить</option></select></label></div>}
    </section><div className="profilePrivacy"><strong>Реквизиты остаются в закрытом контуре</strong><span>Экран не отправляет документы и не изменяет нумерацию счетов.</span></div>{error && <div className="profileNotice error" role="alert">{error}</div>}{saved && <div className="profileNotice success" role="status">Профиль сохранён. Новые документы будут использовать обновлённые реквизиты.</div>}<div className="profileActions"><button type="submit" className="primary" disabled={loading || saving}>{saving ? "Сохраняем..." : isNew ? "Создать профиль" : "Сохранить изменения"}</button></div></form></div></AppShell>;
}
