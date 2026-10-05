const INDIC_SCRIPT =
  /[\u0900-\u097F\u0980-\u09FF\u0A00-\u0A7F\u0A80-\u0AFF\u0B00-\u0B7F\u0B80-\u0BFF\u0C00-\u0C7F\u0C80-\u0CFF\u0D00-\u0D7F\u0D80-\u0DFF]/;
const PLUS_CODE = /\b[A-Z0-9]{4,8}\+[A-Z0-9]{2,3}\b/i;

export function isEnglishLocationText(value) {
  const text = String(value ?? "").trim();
  if (!text) return true;
  return !INDIC_SCRIPT.test(text);
}

export function stripPlusCode(value) {
  return String(value ?? "")
    .replace(PLUS_CODE, "")
    .replace(/\s+,/g, ",")
    .replace(/,\s*,/g, ",")
    .replace(/^[\s,]+|[\s,]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function englishLocationError(city, state, address) {
  if (
    !isEnglishLocationText(city || "") ||
    !isEnglishLocationText(state || "") ||
    !isEnglishLocationText(address || "")
  ) {
    return "Location must be captured in English. Hindi or other regional text makes shipping labels blank.";
  }
  if ((city && !stripPlusCode(city)) || (state && !stripPlusCode(state))) {
    return "This pin returned a map plus-code, not a city. Search the place in English and pick a full address.";
  }
  return "";
}

export function pickEnglishGeocodeResult(results) {
  const list = Array.isArray(results) ? results : [];
  const ranked = list
    .map((result) => {
      const components = result?.address_components || [];
      const get = (types) => {
        const hit = components.find((comp) =>
          (comp.types || []).some((type) => types.includes(type)),
        );
        if (!hit) return "";
        const longName = String(hit.long_name || "").trim();
        const shortName = String(hit.short_name || "").trim();
        if (isEnglishLocationText(longName)) return longName;
        if (isEnglishLocationText(shortName)) return shortName;
        return "";
      };
      const city = stripPlusCode(
        get(["locality", "administrative_area_level_2", "postal_town"]) ||
          get(["sublocality_level_1", "sublocality", "neighborhood"]),
      );
      const state = stripPlusCode(get(["administrative_area_level_1"]));
      const zipCode = get(["postal_code"]).replace(/\s/g, "");
      const fullAddress = stripPlusCode(result?.formatted_address || "");
      const types = result?.types || [];
      let score = 0;
      if (types.includes("plus_code") && types.length <= 1) score -= 80;
      if (zipCode) score += 10;
      if (city) score += 6;
      if (state) score += 4;
      if (fullAddress) score += 2;
      if (!isEnglishLocationText(`${city} ${state} ${fullAddress}`)) score -= 60;
      return {
        score,
        data: {
          fullAddress,
          city,
          state,
          country: get(["country"]) || "India",
          zipCode,
          street: stripPlusCode(get(["street_number", "route"])),
        },
      };
    })
    .filter(({ data }) => data.city || data.state || data.fullAddress)
    .filter(({ data }) =>
      isEnglishLocationText(`${data.city} ${data.state} ${data.fullAddress}`),
    )
    .sort((a, b) => b.score - a.score);
  return ranked[0]?.data || null;
}
