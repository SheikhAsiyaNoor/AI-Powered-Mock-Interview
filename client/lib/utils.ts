import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function cleanDisplayQuestion(raw: string | undefined | null, fallback = ""): string {
  if (!raw || typeof raw !== "string") return fallback;
  let clean = raw.trim();
  clean = clean.replace(/^(undefined|null)\s*[:\-\.]\s*/i, "");
  clean = clean.replace(/^(Question\s*\d*|Interviewer|AI|Technical Question|Q\d*)\s*[:\-\.]\s*/i, "");
  clean = clean.replace(/^["'`]|["'`]$/g, "");
  clean = clean.trim();
  if (clean.toLowerCase() === "undefined" || clean.toLowerCase() === "null") return fallback;
  return clean || fallback;
}

export function cleanDisplayFeedback(raw: string | undefined | null, fallback = ""): string {
  if (!raw || typeof raw !== "string") return fallback;
  let clean = raw.trim();
  clean = clean.replace(/^(undefined|null)\s*[:\-\.]\s*/i, "");
  clean = clean.replace(/^(Feedback|Evaluation|AI Feedback)\s*[:\-\.]\s*/i, "");
  clean = clean.trim();
  if (clean.toLowerCase() === "undefined" || clean.toLowerCase() === "null") return fallback;
  return clean || fallback;
}
