import type { Locale } from "@/i18n/routing";

type LocalizedString = Partial<Record<Locale, string>>;

/** Decodes a JSON i18n blob and returns the best-fit localized string. */
function pickLocalized(
  i18nJson: string | null | undefined,
  fallback: string,
  locale: Locale,
): string {
  if (!i18nJson) return fallback;
  let parsed: LocalizedString = {};
  try {
    parsed = JSON.parse(i18nJson) as LocalizedString;
  } catch {
    return fallback;
  }
  return parsed[locale] ?? parsed.en ?? fallback;
}

export function localizedPokemonName(
  p: { name: string; nameI18n: string },
  locale: Locale,
): string {
  return pickLocalized(p.nameI18n, p.name, locale);
}

export function localizedMoveName(
  m: { name: string; nameI18n: string },
  locale: Locale,
): string {
  return pickLocalized(m.nameI18n, m.name, locale);
}

export function localizedMoveEffect(
  m: { effectText: string; effectI18n: string },
  locale: Locale,
): string {
  return pickLocalized(m.effectI18n, m.effectText, locale);
}

export function localizedAbilityName(
  a: { name: string; nameI18n: string },
  locale: Locale,
): string {
  return pickLocalized(a.nameI18n, a.name, locale);
}

export function localizedAbilityShortDesc(
  a: { shortDesc: string; shortDescI18n: string },
  locale: Locale,
): string {
  return pickLocalized(a.shortDescI18n, a.shortDesc, locale);
}

export function localizedAbilityLongDesc(
  a: { longDesc: string; longDescI18n: string },
  locale: Locale,
): string {
  return pickLocalized(a.longDescI18n, a.longDesc, locale);
}

export function localizedItemName(
  i: { name: string; nameI18n: string },
  locale: Locale,
): string {
  return pickLocalized(i.nameI18n, i.name, locale);
}

export function localizedItemDesc(
  i: { description: string; descI18n: string },
  locale: Locale,
): string {
  return pickLocalized(i.descI18n, i.description, locale);
}

export function localizedItemLongDesc(
  i: { description: string; descI18n: string; descLongI18n: string },
  locale: Locale,
): string {
  return pickLocalized(i.descLongI18n, "", locale)
    || pickLocalized(i.descI18n, i.description, locale);
}

export function localizedMoveLongEffect(
  m: { effectText: string; effectI18n: string; effectLongI18n: string },
  locale: Locale,
): string {
  return pickLocalized(m.effectLongI18n, "", locale)
    || pickLocalized(m.effectI18n, m.effectText, locale);
}
