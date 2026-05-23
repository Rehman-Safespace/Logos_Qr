import React from "react";

/**
 * Checks if a string contains Arabic characters
 */
export function hasArabic(text: string): boolean {
  return /[\u0600-\u06FF\u0750-\u077F]/.test(text);
}

/**
 * Checks if a string contains English/Latin characters
 */
export function hasEnglish(text: string): boolean {
  return /[a-zA-Z]/.test(text);
}

/**
 * Splits lines if they feature both Arabic and English on the same line to enforce RTL/LTR isolation.
 */
export function parseBilingualLines(text: string): Array<{ text: string; lang: "ar" | "en" | "mixed" }> {
  if (!text) return [];
  const lines = text.split("\n");
  const result: Array<{ text: string; lang: "ar" | "en" | "mixed" }> = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const containsAr = hasArabic(trimmed);
    const containsEn = hasEnglish(trimmed);

    if (containsAr && containsEn) {
      // It is mixed. Let's check if we can isolate them by simple word analysis
      // Split words into Arabic block and English block
      const words = trimmed.split(/\s+/);
      const arWords: string[] = [];
      const enWords: string[] = [];

      for (const word of words) {
        if (hasArabic(word)) {
          arWords.push(word);
        } else {
          enWords.push(word);
        }
      }

      if (arWords.length > 0) {
        result.push({ text: arWords.join(" "), lang: "ar" });
      }
      if (enWords.length > 0) {
        result.push({ text: enWords.join(" "), lang: "en" });
      }
    } else if (containsAr) {
      result.push({ text: trimmed, lang: "ar" });
    } else {
      result.push({ text: trimmed, lang: "en" });
    }
  }

  return result;
}

/**
 * Clean up strings for TTS synthesis (removes hyphens or JSON braces)
 */
export function cleanForTTS(text: string): string {
  return text
    .replace(/[#{}[\]]/g, "")
    .replace(/[-*:.‌_]/g, " ")
    .trim();
}
