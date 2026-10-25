// A student's contact details. Kept out of every public or AI-bound view of the
// profile; only professionals who saved the student see them.
export interface StudentContact {
  email: string;
  phone: string;
  linkedin: string;
}

export const emptyContact: StudentContact = { email: "", phone: "", linkedin: "" };

// Each normalizer returns "" for blank input, the cleaned value when valid, and null when invalid.

export function normalizeEmail(value: string): string | null {
  const email = value.trim();
  if (!email) return "";
  return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null;
}

export function normalizePhone(value: string): string | null {
  const phone = value.trim().replace(/\s+/g, " ");
  if (!phone) return "";
  const digits = phone.replace(/\D/g, "").length;
  return phone.length <= 40 && /^\+?[\d\s().-]+(?:\s*(?:x|ext\.?)\s*\d+)?$/i.test(phone) && digits >= 7 && digits <= 20
    ? phone
    : null;
}

// Accepts "linkedin.com/in/name", "https://www.linkedin.com/in/name/" and similar; stores the canonical profile URL.
export function normalizeLinkedIn(value: string): string | null {
  const raw = value.trim();
  if (!raw) return "";
  try {
    const url = new URL(/^[a-z][a-z0-9+.-]*:/i.test(raw) ? raw : `https://${raw}`);
    const host = url.hostname.replace(/^www\./, "").toLowerCase();
    const [section, handle] = url.pathname.split("/").filter(Boolean);
    if ((url.protocol !== "https:" && url.protocol !== "http:") || !(host === "linkedin.com" || host.endsWith(".linkedin.com"))) return null;
    if (section !== "in" || !handle) return null;
    return `https://www.linkedin.com/in/${handle}`.slice(0, 500);
  } catch {
    return null;
  }
}

// Lenient version for untrusted sources such as a parsed resume: anything invalid is dropped.
export function cleanContact(value: Partial<Record<keyof StudentContact, unknown>> | null | undefined): StudentContact {
  const text = (field: unknown) => (typeof field === "string" ? field : "");
  return {
    email: normalizeEmail(text(value?.email)) ?? "",
    phone: normalizePhone(text(value?.phone)) ?? "",
    linkedin: normalizeLinkedIn(text(value?.linkedin)) ?? "",
  };
}
