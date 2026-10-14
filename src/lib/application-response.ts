import type { ApplicationDocument } from "@/lib/applications";

export function toClientApplication(document: ApplicationDocument) {
  return {
    id: document._id.toString(),
    company: document.company,
    role: document.role,
    location: document.location,
    stage: document.stage,
    appliedAt: document.appliedAt,
    contact: document.contact,
    contactTitle: document.contactTitle,
    contactEmail: document.contactEmail,
    nextStep: document.nextStep,
    nextStepDate: document.nextStepDate,
    source: document.source,
    notes: document.notes,
  };
}
