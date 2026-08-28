const RESERVED_SLUGS = new Set([
  "admin",
  "api",
  "app",
  "auth",
  "billing",
  "dashboard",
  "demo",
  "kitchen",
  "login",
  "menu",
  "pricing",
  "register",
  "settings",
  "signup",
  "smartdine",
  "savydine",
  "support",
  "www",
]);

export function slugify(input: string) {
  const ascii = input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);

  return ascii;
}

export function isReservedSlug(slug: string) {
  return RESERVED_SLUGS.has(slug);
}

export function isValidSlug(slug: string) {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) && slug.length >= 3 && slug.length <= 48;
}
