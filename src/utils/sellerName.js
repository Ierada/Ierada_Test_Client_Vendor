const JUNK = /^(undefined|null)(\s+(undefined|null))*$/i;

export function cleanNamePart(value) {
  const text = String(value ?? "").replace(/\s+/g, " ").trim();
  if (!text || JUNK.test(text)) return "";
  return text;
}

export function titleCaseName(name) {
  return cleanNamePart(name)
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function nameFromEmail(email) {
  const local = String(email || "").split("@")[0] || "";
  const parts = local
    .replace(/[._-]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!parts.length || parts.length > 4) return "";
  if (parts.every((part) => /^\d+$/.test(part))) return "";
  return titleCaseName(parts.join(" "));
}

/** Greeting / sidebar name. Never render "undefined undefined". */
export function sellerDisplayName(user) {
  try {
    const first = cleanNamePart(user?.firstName || user?.first_name);
    const last = cleanNamePart(user?.lastName || user?.last_name);
    const fromParts = titleCaseName([first, last].filter(Boolean).join(" "));
    if (fromParts) return fromParts;
    const name = titleCaseName(cleanNamePart(user?.name));
    if (name) return name;
    const shop = cleanNamePart(
      user?.shopName || user?.shop_name || user?.brand_name || user?.shop,
    );
    if (shop) return shop;
    const fromEmail = nameFromEmail(user?.email);
    if (fromEmail) return fromEmail;
    return "Selling Partner";
  } catch (err) {
    console.error("sellerDisplayName", err);
    return "Selling Partner";
  }
}
