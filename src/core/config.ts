let defaultLocale: string | undefined;

export function init(locale?: string): void {
  defaultLocale = locale;
}

export function getDefaultLocale(): string | undefined {
  return defaultLocale;
}
