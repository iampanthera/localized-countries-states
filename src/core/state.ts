import fs from "fs";
import path from "path";

export function getStatesOfCountry(
  countryCode: string
): { code: string; name: string }[] {
  try {
    const filePath = path.join(
      __dirname,
      "../../data/states",
      `${countryCode}.json`
    );
    const raw = fs.readFileSync(filePath, "utf-8");
    const states = JSON.parse(raw);
    return Object.entries(states).map(([code, name]) => ({
      code,
      name: name as string,
    }));
  } catch {
    return [];
  }
}
