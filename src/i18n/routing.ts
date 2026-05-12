import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "ja", "zh-Hans", "zh-Hant"] as const,
  defaultLocale: "en",
  // 'as-needed' = English at /pokemon-champions, others at /ja/pokemon-champions etc.
  localePrefix: "as-needed",
});

export type Locale = (typeof routing.locales)[number];

export const LOCALE_LABELS: Record<Locale, string> = {
  en: "English",
  ja: "日本語",
  "zh-Hans": "简体中文",
  "zh-Hant": "繁體中文",
};
