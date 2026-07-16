export interface Country {
  /** ISO 3166-1 alpha-2 code, e.g. "US". */
  code: string;
  /** Localized display name. */
  name: string;
}

export interface State {
  /** Full ISO 3166-2 code, e.g. "US-CA". */
  code: string;
  /** ISO 3166-1 alpha-2 code of the country, e.g. "US". */
  countryCode: string;
  /** Localized display name. */
  name: string;
}
