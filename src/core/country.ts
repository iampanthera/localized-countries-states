import fs from "fs";
import path from "path";
import { defaultLocale } from "../config";

// Define the type for countries data
interface CountryData {
  [code: string]: { name: string };
}

// Read countries data from JSON file
const countriesPath = path.join(process.cwd(), "data", "countries.json");
const countriesData: CountryData = JSON.parse(
  fs.readFileSync(countriesPath, "utf-8")
);

export function getAllCountries(locale?: string) {
  const useLocale = locale || defaultLocale;
  let localizer: Intl.DisplayNames | undefined;
  try {
    localizer = new Intl.DisplayNames([useLocale], { type: "region" });
  } catch {}
  return Object.entries(countriesData).map(([code, { name }]) => ({
    code,
    name: localizer ? localizer.of(code) || name : name,
  }));
}

export function getCountryName(code: string, locale?: string): string {
  const useLocale = locale || defaultLocale;
  let localizer: Intl.DisplayNames | undefined;
  try {
    localizer = new Intl.DisplayNames([useLocale], { type: "region" });
  } catch {}
  const country = countriesData[code];
  if (!country) return "";
  return localizer ? localizer.of(code) || country.name : country.name;
}
