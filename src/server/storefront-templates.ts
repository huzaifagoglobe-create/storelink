export type TemplateId =
  | "classic"
  | "bold"
  | "minimal"
  | "playful"
  | "list"
  | "magazine"
  | "boutique"
  | "luxe"
  | "studio"
  | "vibrant";

/**
 * Each template is a COMPLETE design system: header style, hero, product grid,
 * card look, button shape, product-page layout and footer mood — so two shops
 * on different templates genuinely look like different websites.
 */
export interface TemplateConfig {
  id: TemplateId;
  label: string;
  description: string;
  surface: "light" | "tint";
  headingFont: "sans" | "serif";
  radius: "sq" | "md" | "round";
  header: "left" | "center" | "bold" | "dark";
  hero: "banner" | "full" | "minimal" | "centered" | "gradient";
  grid: "g2" | "g2gap" | "list" | "magazine";
  card: "card" | "flat" | "overlay" | "row";
  /** Product page structure. */
  productLayout: "split" | "gallery" | "showcase";
  /** CTA button shape across the store. */
  buttonStyle: "solid" | "pill" | "sharp";
  /** Footer mood. */
  footer: "rich" | "minimal";
}

export const TEMPLATES: TemplateConfig[] = [
  { id: "classic",  label: "Classic",  description: "Clean and familiar — banner on top, neat product grid.",              surface: "light", headingFont: "sans",  radius: "md",    header: "left",   hero: "banner",   grid: "g2",       card: "card",    productLayout: "split",    buttonStyle: "solid", footer: "rich" },
  { id: "bold",     label: "Bold",     description: "Big imagery and large type. Full-width hero, photo-first cards.",     surface: "light", headingFont: "sans",  radius: "md",    header: "bold",   hero: "full",     grid: "g2",       card: "overlay", productLayout: "showcase", buttonStyle: "solid", footer: "rich" },
  { id: "minimal",  label: "Minimal",  description: "Whitespace and serif headings. Quiet, premium, understated.",         surface: "light", headingFont: "serif", radius: "sq",    header: "left",   hero: "minimal",  grid: "g2gap",    card: "flat",    productLayout: "gallery",  buttonStyle: "sharp", footer: "minimal" },
  { id: "playful",  label: "Playful",  description: "Soft tinted background with very rounded cards. Friendly feel.",      surface: "tint",  headingFont: "sans",  radius: "round", header: "left",   hero: "banner",   grid: "g2",       card: "card",    productLayout: "split",    buttonStyle: "pill",  footer: "rich" },
  { id: "list",     label: "List",     description: "One product per row with a thumbnail. Best for big catalogues.",      surface: "light", headingFont: "sans",  radius: "md",    header: "left",   hero: "minimal",  grid: "list",     card: "row",     productLayout: "split",    buttonStyle: "solid", footer: "minimal" },
  { id: "magazine", label: "Magazine", description: "A large featured product, then a grid. Editorial and eye-catching.", surface: "light", headingFont: "serif", radius: "md",    header: "left",   hero: "banner",   grid: "magazine", card: "card",    productLayout: "gallery",  buttonStyle: "solid", footer: "rich" },
  { id: "boutique", label: "Boutique", description: "Centred logo, serif type and elegant centred product cards.",         surface: "tint",  headingFont: "serif", radius: "sq",    header: "center", hero: "centered", grid: "g2gap",    card: "flat",    productLayout: "gallery",  buttonStyle: "sharp", footer: "minimal" },
  { id: "luxe",     label: "Luxe",     description: "Dark header, serif type, generous space — high-end brand energy.",    surface: "light", headingFont: "serif", radius: "md",    header: "dark",   hero: "minimal",  grid: "g2gap",    card: "flat",    productLayout: "showcase", buttonStyle: "sharp", footer: "rich" },
  { id: "studio",   label: "Studio",   description: "Sharp edges, dark header and overlay cards. Modern and editorial.",   surface: "light", headingFont: "sans",  radius: "sq",    header: "dark",   hero: "full",     grid: "g2",       card: "overlay", productLayout: "gallery",  buttonStyle: "sharp", footer: "minimal" },
  { id: "vibrant",  label: "Vibrant",  description: "Colour-gradient hero, pill buttons and round cards. Full of energy.", surface: "tint",  headingFont: "sans",  radius: "round", header: "bold",   hero: "gradient", grid: "g2",       card: "card",    productLayout: "split",    buttonStyle: "pill",  footer: "rich" },
];

export const TEMPLATE_IDS: TemplateId[] = TEMPLATES.map((t) => t.id);

export function getTemplate(id: string | null | undefined): TemplateConfig {
  return TEMPLATES.find((t) => t.id === id) ?? TEMPLATES[0];
}

// Class helpers — every class name appears verbatim so Tailwind keeps them.
export function radiusClass(r: TemplateConfig["radius"]): string {
  return r === "sq" ? "rounded-none" : r === "round" ? "rounded-3xl" : "rounded-xl";
}
export function headingFontClass(f: TemplateConfig["headingFont"]): string {
  return f === "serif" ? "font-serif" : "";
}
export function pageTintClass(s: TemplateConfig["surface"]): string {
  return s === "tint" ? "bg-[#F1F5F2]" : "";
}
/** CTA shape per template: solid = rounded-xl, pill = fully round, sharp = square. */
export function buttonShapeClass(b: TemplateConfig["buttonStyle"]): string {
  return b === "pill" ? "rounded-full" : b === "sharp" ? "rounded-none" : "rounded-xl";
}
