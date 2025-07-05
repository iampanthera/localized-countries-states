import { setDefaultLocale, defaultLocale } from "./config";
import { getAllCountries, getCountryName } from "./core/country";
import { getStatesOfCountry } from "./core/state";

export function init(locale: string) {
  setDefaultLocale(locale);
}

export { getAllCountries, getCountryName, getStatesOfCountry };
