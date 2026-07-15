/**
 * ═══════════════════════════════════════════════════════════════════
 *  STORELINK WEBSITE CONTENT — EDIT YOUR WEBSITE'S WORDS HERE
 * ═══════════════════════════════════════════════════════════════════
 *  Every headline, paragraph, feature, FAQ and button label on the
 *  public website lives in this ONE file. Change the text between the
 *  quotes, save, and the website updates. No code knowledge needed —
 *  just don't delete the quotes or commas around the text.
 * ═══════════════════════════════════════════════════════════════════
 */

export const SITE = {
  name: "StoreLink",
  tagline: "Your shop. Your link. Orders on autopilot.",
  description:
    "The all-in-one shop platform for Pakistani sellers — a beautiful store link, Cash-on-Delivery orders, protection from fake orders, and real profit books. Free to start.",
  whatsappDisplay: "WhatsApp us",
};

/* ── HOMEPAGE ──────────────────────────────────────────────────── */
export const HOME = {
  heroKicker: "Made in Pakistan, for Pakistani sellers 🇵🇰",
  heroTitle1: "Your shop. Your link.",
  heroTitle2: "Orders on autopilot.",
  heroSub:
    "Stop running your business from DM screenshots. StoreLink gives you a beautiful shop link, takes Cash-on-Delivery orders while you sleep, warns you about fake orders before you ship, and shows your real profit — all from your phone.",
  heroCtaPrimary: "Start free — 2 minutes",
  heroCtaDemo: "▶ Try the live demo",
  heroTrust: "Free 14-day trial · No card needed · Your data stays yours",

  // The 10-second explainer: a stranger understands the product from these 3 lines.
  explainSteps: [
    { emoji: "🏪", title: "Get your shop link", text: "storelink.pk/your-shop — every product, price and photo in one beautiful page. Paste it in your Instagram bio and WhatsApp status." },
    { emoji: "📦", title: "Orders come to you", text: "Buyers order with Cash on Delivery in 30 seconds — no app, no account. You get every order organised with the buyer's details, ready to ship." },
    { emoji: "💰", title: "Keep more money", text: "Fake-order warnings before you ship, referrals that bring new buyers, and a khata that shows your real monthly profit." },
  ],

  problemTitle: "Sound familiar?",
  problems: [
    "Orders buried in DMs and screenshots — you lose track and lose sales",
    "Parcels refused at the door — courier fees burned both ways",
    "\"Price?\" \"Size?\" \"COD hai?\" — the same questions, 50 times a day",
    "No idea if the business actually made profit this month",
  ],
  problemPunch: "StoreLink was built to kill each of these — one by one.",

  socialProofTitle: "Live from the platform",

  featuresTitle: "Everything a serious seller needs",
  featuresSub: "Not a website builder. A selling machine — every feature exists to get you more orders or protect your money.",

  founding: {
    title: "🏆 Founding member offer",
    body: "The first 100 paying shops lock the Basic plan at Rs 1,999/month for life (instead of Rs 2,500) — our thank-you to the sellers who believe early.",
  },

  finalCtaTitle: "Your shop could be live in the next 2 minutes",
  finalCtaSub: "Free to start. No card. If it doesn't get you orders, it costs you nothing.",
  finalCtaButton: "Open my shop free →",
};

/* ── FEATURE GROUPS (used on /features and homepage) ───────────── */
export const FEATURE_GROUPS = [
  {
    title: "Get more orders",
    emoji: "🚀",
    features: [
      { name: "Your own shop link", text: "10 storefront designs, your logo and colors, every product with photos, sizes and stock — live at storelink.pk/your-name." },
      { name: "30-second COD checkout", text: "Buyers order with Cash on Delivery without making an account. Less friction = more completed orders." },
      { name: "The Bazaar", text: "Every verified shop is listed in our public directory and on Google landing pages by category and city — buyers find YOU." },
      { name: "Referral rewards", text: "Your buyers share a link; their friends get a discount, they get credit. Your customers become your sales team." },
      { name: "Reseller network", text: "Let others sell your products for commission — tracked automatically, paid on delivery." },
      { name: "Share cards + captions", text: "One tap makes a beautiful product image and a ready caption with hashtags for Instagram, Facebook and WhatsApp." },
      { name: "Flash sales & drops", text: "Countdown timers, scheduled product drops, festival kits — urgency that actually sells." },
    ],
  },
  {
    title: "Run the shop from your phone",
    emoji: "📱",
    features: [
      { name: "Orders in one place", text: "Every order with buyer details, status, tracking and one-tap WhatsApp updates — no more screenshots." },
      { name: "Paste a WhatsApp order", text: "Copy a buyer's message, paste it, and StoreLink reads out the name, address and phone into a proper order." },
      { name: "Stock that can't oversell", text: "Sizes and variants with per-variant stock, low-stock warnings, automatic 'sold out' — even during rush hours." },
      { name: "Staff logins", text: "Give a helper their own login for daily work — they can never touch your money, your plan, or delete the shop." },
      { name: "Packing slips & COD chase list", text: "Print-ready slips, and a daily list of parcels to confirm so nothing ships blind." },
    ],
  },
  {
    title: "Protect and grow your money",
    emoji: "🛡️",
    features: [
      { name: "Fake-order protection", text: "Every order shows the buyer's delivery history across ALL StoreLink shops. Serial parcel-refusers get flagged BEFORE you ship." },
      { name: "Khata — real profit books", text: "Sales minus product costs minus expenses = your real monthly profit. Not a guess. Not a feeling. A number." },
      { name: "Profit reports", text: "Best sellers, profit per product, delivered revenue — know what to restock and what to drop." },
      { name: "Win-back list", text: "One tap messages old customers who haven't ordered in a while — the cheapest sales you'll ever make." },
      { name: "Verified seller badge", text: "Pass verification, get a badge for your Instagram bio and a public verify page to silence doubtful buyers." },
    ],
  },
];

/* ── HOW IT WORKS ──────────────────────────────────────────────── */
export const HOW = {
  title: "From zero to first order",
  sub: "No developer. No design skills. No laptop needed.",
  steps: [
    { n: "1", title: "Sign up in 2 minutes", text: "Pick your shop name and link. We even pre-load sample products for your industry so you're never staring at an empty page — just tap, edit, publish." },
    { n: "2", title: "Add your products", text: "Photos, price, sizes, stock. Our tips are built into every field — products with 2+ photos and honest descriptions get far more orders." },
    { n: "3", title: "Share your link everywhere", text: "Instagram bio, WhatsApp status, Facebook groups. One-tap share cards with ready captions make posting effortless." },
    { n: "4", title: "Orders arrive — even while you sleep", text: "Buyers order with COD in 30 seconds. You confirm on WhatsApp, ship with your courier, mark delivered. Your khata updates itself." },
  ],
  afterTitle: "And you're never alone",
  afterText: "Real humans (the founders, actually) welcome every new seller on WhatsApp. Stuck on anything? We'll add your first product WITH you.",
};

/* ── FAQ (also powers the AI-answer/AEO schema) ────────────────── */
export const FAQS = [
  { q: "What is StoreLink?", a: "StoreLink is an all-in-one shop platform for Pakistani sellers. You get your own shop link (like storelink.pk/your-shop) where buyers can see your products and order with Cash on Delivery — plus order management, fake-order protection, profit books, and marketing tools, all from your phone." },
  { q: "How much does StoreLink cost?", a: "It's free to start with a 14-day trial — no card needed. Paid plans start at Rs 2,500/month (Basic), with Pro at Rs 5,500 and Premium at Rs 9,999 for bigger shops. The first 100 paying shops lock Basic at Rs 1,999/month for life." },
  { q: "Do I need a website or technical skills?", a: "No. StoreLink IS your website. If you can use WhatsApp, you can run a StoreLink shop. Signup takes 2 minutes and we pre-load sample products so you just edit instead of starting from zero." },
  { q: "Does StoreLink support Cash on Delivery?", a: "Yes — COD is the heart of StoreLink. Buyers order in 30 seconds without any account or prepayment, and you get the order with all their details ready for your courier." },
  { q: "How does fake-order protection work?", a: "Every order shows you the buyer's delivery history across all StoreLink shops. If a phone number has refused parcels at other shops before, you see a warning BEFORE you ship — so you confirm on WhatsApp first instead of burning courier fees both ways." },
  { q: "Can buyers find my shop, or do I bring all traffic myself?", a: "Both. You share your link on social media, AND verified shops get listed in the StoreLink Bazaar — our public directory with Google landing pages by category and city. Buyers searching for shops in your city can find you." },
  { q: "Who owns my data and customers?", a: "You do. Your products, orders, and customer details are yours. Export or leave any time — no lock-in." },
  { q: "What happens after my free trial ends?", a: "Your shop pauses until you pick a plan — nothing is deleted. Renewal is manual and human: we message you on WhatsApp, you pay by bank transfer or JazzCash, and your plan is active within minutes." },
  { q: "Can my staff manage orders without my password?", a: "Yes. You can create up to 5 staff logins. Staff can run daily work — orders, products, khata — but can never change your plan, manage the team, or delete the shop." },
  { q: "Is StoreLink better than selling from Instagram DMs?", a: "Instagram is where buyers FIND you — StoreLink is where they ORDER. DMs mean lost messages, no records, and endless 'price?' questions. A shop link answers everything and takes the order at 2am while you sleep. Keep posting on Instagram; put your StoreLink in the bio." },
];

/* ── ABOUT ─────────────────────────────────────────────────────── */
export const ABOUT = {
  title: "Why StoreLink exists",
  paragraphs: [
    "Pakistan has hundreds of thousands of sellers running real businesses out of Instagram DMs and WhatsApp chats — talented people selling lawn suits, electronics, home-cooked food, and handmade art with nothing but a phone and hustle.",
    "But the tools were never built for them. Global platforms want credit cards in a Cash-on-Delivery country. Website builders want designers and developers. And nothing — nothing — protects a small seller from the fake orders that quietly burn thousands of rupees in courier fees every month.",
    "StoreLink is our answer: a platform that speaks this market's language. COD-first, phone-first, simple enough for anyone who can use WhatsApp — and serious enough to run a growing business: real inventory, real profit books, real protection.",
    "We're a small team, and we like it that way. Every new seller gets a personal welcome from a founder. Every feature exists because a seller needed it, not because a slide deck did. If StoreLink doesn't get you more orders and protect your money, we haven't done our job.",
  ],
  valuesTitle: "What we believe",
  values: [
    { title: "COD is not a bug", text: "It's how Pakistan buys. We build for it instead of pretending it away." },
    { title: "Your phone is the office", text: "Everything works on a mobile screen, one thumb, slow internet." },
    { title: "Honesty converts", text: "Transparent pricing, honest comparisons, no fake scarcity, no dark patterns." },
    { title: "Sellers own everything", text: "Your data, your customers, your money. Leave any time — we'd rather earn your stay." },
  ],
};

/* ── CONTACT ───────────────────────────────────────────────────── */
export const CONTACT = {
  title: "Talk to a human",
  sub: "No ticket numbers, no bots. Message us on WhatsApp and a founder replies — usually within the hour.",
  reasons: [
    { emoji: "🆕", title: "Getting started", text: "We'll set up your shop WITH you in 10 minutes — free." },
    { emoji: "🛠️", title: "Need help", text: "Stuck on anything, from products to couriers — just ask." },
    { emoji: "🤝", title: "Partnerships", text: "Couriers, influencers, seller communities — let's talk." },
  ],
};
