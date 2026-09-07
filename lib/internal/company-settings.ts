import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";

const COLLECTION = "internal_settings";
const DOCUMENT = "company";

export type CompanySettings = {
  brandName: string;
  legalName: string;
  cnpj: string;
  address: string;
  cityState: string;
  representative: string;
  email: string;
  phone: string;
  website: string;
  slogan: string;
  updatedAt?: string;
  updatedBy?: string;
};

const defaults: CompanySettings = {
  brandName: "ALGENRI",
  legalName: "JM MIND E PERFORMANCE LTDA",
  cnpj: "",
  address: "",
  cityState: "Ponta Grossa/PR",
  representative: "",
  email: "contato@algenri.com.br",
  phone: "",
  website: "algenri.com.br",
  slogan: "Tecnologia que impulsiona o seu amanhã.",
};

function value(input: unknown, max = 180) {
  return typeof input === "string" ? input.trim().slice(0, max) : "";
}

export async function getCompanySettings(): Promise<CompanySettings> {
  const db = await getAdminDb();
  const snap = await db.collection(COLLECTION).doc(DOCUMENT).get();
  if (!snap.exists) return defaults;
  return { ...defaults, ...(snap.data() as Partial<CompanySettings>) };
}

export async function saveCompanySettings(input: Record<string, unknown>, updatedBy: string) {
  const next: CompanySettings = {
    brandName: value(input.brandName) || defaults.brandName,
    legalName: value(input.legalName),
    cnpj: value(input.cnpj, 32),
    address: value(input.address, 240),
    cityState: value(input.cityState, 120),
    representative: value(input.representative, 160),
    email: value(input.email, 160),
    phone: value(input.phone, 60),
    website: value(input.website, 160),
    slogan: value(input.slogan, 220),
    updatedBy,
  };

  if (!next.brandName) throw new Error("brand_name_required");
  const db = await getAdminDb();
  await db.collection(COLLECTION).doc(DOCUMENT).set({ ...next, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
  return next;
}
