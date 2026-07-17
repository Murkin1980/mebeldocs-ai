import { randomUUID } from "node:crypto";
import type { CompanyProfile } from "../domain/entities";
import type { CompanyRepository } from "../domain/repository";

export class CompanyProfileService {
  constructor(private repo: CompanyRepository) {}

  async get(): Promise<CompanyProfile | null> {
    return this.repo.get();
  }

  async createOrUpdate(data: Partial<CompanyProfile>): Promise<CompanyProfile> {
    const existing = await this.repo.get();
    const now = new Date().toISOString();

    if (existing) {
      const updated: CompanyProfile = {
        ...existing,
        ...data,
        id: existing.id,
        updatedAt: now,
      };
      return this.repo.save(updated);
    }

    const profile: CompanyProfile = {
      id: randomUUID(),
      legalName: data.legalName ?? "",
      binIin: data.binIin ?? "",
      address: data.address,
      bankName: data.bankName,
      bik: data.bik,
      iban: data.iban,
      phone: data.phone,
      email: data.email,
      directorName: data.directorName,
      activityBasis: data.activityBasis,
      vatMode: data.vatMode ?? "without_vat",
      invoiceNumbering: data.invoiceNumbering ?? { nextNumber: 1 },
      createdAt: now,
      updatedAt: now,
    };
    return this.repo.save(profile);
  }
}
