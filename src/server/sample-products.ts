import type { ProductInput } from "./types";

/**
 * Sample DRAFT products seeded at signup so no seller ever faces a blank
 * dashboard — editing something beats creating from nothing. They're
 * inactive (never shown to buyers) and clearly named "(sample)".
 */
type Sample = Omit<ProductInput, "isActive">;

const P = (name: string, price: number, description: string, category: string): Sample => ({
  name,
  price,
  description,
  category,
  stock: 10,
  imageUrls: [],
  compareAtPrice: null,
  costPrice: null,
  options: [],
  tag: null,
});

export const SAMPLE_PRODUCTS: Record<string, Sample[]> = {
  Fashion: [
    P("Lawn Suit 3pc (sample — tap to edit)", 3499, "Replace this with your own product: add photos, your price, and sizes. Delete anything you don't need.", "Suits"),
    P("Embroidered Kurti (sample)", 2199, "Tip: products with 2+ photos and sizes get far more orders.", "Kurtis"),
    P("Chiffon Dupatta (sample)", 999, "Short, honest descriptions sell best — what it is, the fabric, and the fit.", "Accessories"),
  ],
  Electronics: [
    P("Wireless Earbuds (sample — tap to edit)", 2999, "Replace with your own product: add real photos and your warranty note.", "Audio"),
    P("Phone Cover (sample)", 599, "Tip: list the phone models it fits right in the name.", "Accessories"),
    P("Smart Watch (sample)", 5499, "Mention box contents and warranty — buyers ask these first.", "Wearables"),
  ],
  "Food / Home Kitchen": [
    P("Chicken Biryani — Family Pack (sample)", 1299, "Replace with your own dish: portion size, spice level, delivery areas.", "Rice"),
    P("Homemade Sauces Box (sample)", 899, "Tip: mention preparation time and delivery days.", "Condiments"),
    P("Brownie Box of 6 (sample)", 999, "Photos of the real product build the most trust for food.", "Desserts"),
  ],
  "Baby & Toys": [
    P("Baby Romper Set (sample — tap to edit)", 1499, "Replace with your own: add age sizes (0-3m, 3-6m…) as options.", "Clothing"),
    P("Educational Puzzle (sample)", 799, "Mention the age range in the name — parents search by it.", "Toys"),
    P("Feeding Bottle Set (sample)", 1199, "Note the brand and material — safety details sell.", "Feeding"),
  ],
  Pharmacy: [
    P("Vitamin C 1000mg (sample — tap to edit)", 850, "Replace with your products. Include pack size and expiry practice.", "Vitamins"),
    P("First Aid Kit (sample)", 1450, "List the contents — buyers compare kits by what's inside.", "First aid"),
    P("Skin Care Cream (sample)", 650, "Mention if it needs a prescription.", "Skin care"),
  ],
  Arts: [
    P("Hand-painted Canvas (sample)", 2500, "Replace with your art: size in inches and framing options matter.", "Paintings"),
    P("Calligraphy Frame (sample)", 1800, "Offer custom text as an option — personalisation sells.", "Calligraphy"),
    P("Craft Gift Box (sample)", 1200, "Show what's inside with 2-3 photos.", "Gifts"),
  ],
  "Home & Lifestyle": [
    P("Cotton Bedsheet Set (sample)", 2799, "Replace with yours: bed size and thread count in the name.", "Bedding"),
    P("Scented Candles Pack (sample)", 999, "List the scents — buyers pick by fragrance.", "Decor"),
    P("Kitchen Organizer (sample)", 1499, "Dimensions in the description save you DM questions.", "Kitchen"),
  ],
  Retail: [
    P("Your First Product (sample — tap to edit)", 999, "Replace this with a real product: photos, price, honest description.", "General"),
    P("Your Second Product (sample)", 1499, "Tip: 5-10 products is the sweet spot to launch with.", "General"),
    P("Bundle Deal (sample)", 2499, "Bundles raise your average order value.", "Deals"),
  ],
  Other: [
    P("Your First Product (sample — tap to edit)", 999, "Replace this with a real product: add photos, your price, and a short honest description. Delete anything you don't need.", "General"),
    P("Your Second Product (sample)", 1499, "Tip: products with 2+ photos get far more orders.", "General"),
    P("Your Best Seller (sample)", 1999, "Put your most-loved item first — it sets the tone for the whole shop.", "General"),
  ],
};
