import type { ObjectId } from "mongodb";

export const applicationStages = [
  "Applied",
  "Interview",
  "Offer",
  "Rejected",
  "Saved",
] as const;

export type ApplicationStage = (typeof applicationStages)[number];

export type ApplicationFields = {
  company: string;
  role: string;
  location: string;
  stage: ApplicationStage;
  appliedAt: string;
  contact: string;
  contactTitle: string;
  contactEmail: string;
  nextStep: string;
  nextStepDate: string;
  source: string;
  notes: string;
};

export type ApplicationDocument = ApplicationFields & {
  _id: ObjectId;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
};

const textLimits: Record<keyof ApplicationFields, number> = {
  company: 160,
  role: 160,
  location: 160,
  stage: 20,
  appliedAt: 10,
  contact: 160,
  contactTitle: 160,
  contactEmail: 254,
  nextStep: 240,
  nextStepDate: 10,
  source: 120,
  notes: 5000,
};

function readText(
  input: Record<string, unknown>,
  key: keyof ApplicationFields,
): string | null {
  const value = input[key];
  if (typeof value !== "string" || value.length > textLimits[key]) return null;
  return value.trim();
}

function isValidDate(value: string, optional: boolean) {
  if (optional && !value) return true;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

export function parseApplicationFields(value: unknown): ApplicationFields | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const input = value as Record<string, unknown>;
  const fields = {} as ApplicationFields;

  for (const key of Object.keys(textLimits) as (keyof ApplicationFields)[]) {
    const field = readText(input, key);
    if (field === null) return null;
    fields[key] = field as never;
  }

  if (!fields.company || !fields.role) return null;
  if (!applicationStages.includes(fields.stage)) return null;
  if (!isValidDate(fields.appliedAt, false) || !isValidDate(fields.nextStepDate, true)) return null;
  if (fields.contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.contactEmail)) return null;
  return fields;
}
