import type { Metadata } from "next";
import { LegalLayout, LegalSections, type LegalSection } from "@/components/marketing/legal-layout";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How StoreLink collects, uses, and protects personal information.",
};

const SECTIONS: LegalSection[] = [
  { h: "Who we are", p: [
    "This Privacy Policy explains how [YOUR COMPANY LEGAL NAME] (\"we\", \"us\", or \"StoreLink\") collects, uses, and protects personal information when you use StoreLink (the \"Platform\") — the service that lets businesses in Pakistan create an online shop, take orders, and manage them.",
    "By using the Platform you agree to this policy. If you do not agree, please do not use the Platform.",
    "StoreLink serves two kinds of people: sellers (business owners who create a shop) and shoppers (customers who buy from a seller's shop). This policy covers both. When you buy from a seller's store, the seller handles your order and uses your details to fulfil it — we provide the tools, and the seller deals directly with you.",
  ]},
  { h: "Information we collect", p: ["We collect the following, depending on how you use the Platform:"], ul: [
    "Seller account details: your name, email address, phone or WhatsApp number, and a login PIN (stored in a scrambled, hashed form — we cannot see your actual PIN).",
    "Shop details you enter: shop name, description, logo, banner, products, prices, delivery settings, and discount codes.",
    "Seller verification details (only if you choose to verify in order to accept online payments): your CNIC number, a photo of your CNIC, and a selfie. We use these only to confirm you are a real person and to reduce fraud.",
    "Payout details you provide (for example Easypaisa, JazzCash, or a bank account name and number) so customers can pay you.",
    "Shopper order details: name, phone number, delivery address, city, an optional email address, and the items ordered. This is used to place and fulfil the order and is shared with the seller you bought from.",
    "Technical data: an essential login session cookie, a cookie that remembers your language choice (English or Urdu), and standard server logs.",
  ]},
  { h: "How we use information", p: ["We use personal information to:"], ul: [
    "Run the Platform — create shops, show storefronts, and take and manage orders.",
    "Send each order to the relevant seller (including through a WhatsApp link or message) so it can be fulfilled.",
    "Verify seller identity (CNIC and selfie) to enable online payments and build buyer trust.",
    "Provide support and respond to your messages.",
    "Keep the Platform secure and prevent fraud and abuse.",
    "Improve the Platform.",
  ]},
  { h: "Sensitive verification data (CNIC and selfie)", p: [
    "Because CNIC and selfie images are sensitive, we treat them with extra care. They are used only to verify identity, are accessible only to authorised Platform staff who review verification requests, and are stored using access controls.",
    "You can ask us to delete these images after verification by contacting us. We may keep a minimal record that verification took place.",
  ]},
  { h: "When we share information", p: ["We do not sell your personal information. We share it only:"], ul: [
    "With the seller you bought from, so they can fulfil your order (for shopper order details).",
    "With service providers who help us run the Platform — for example our hosting and database provider, cloud storage, and email delivery. They process data only on our instructions.",
    "For legal reasons — to comply with the law, a court order, or to protect rights, safety, and the Platform.",
  ]},
  { h: "Storage and security", p: [
    "Information is stored on secure servers provided by our infrastructure partners. We use measures such as encryption of data in transit (HTTPS), hashed login PINs, and access controls.",
    "No method of storage or transmission is completely secure, so we cannot guarantee absolute security, but we work to protect your information.",
  ]},
  { h: "How long we keep it", p: [
    "We keep personal information for as long as your account is active or as needed to provide the Platform, resolve disputes, and meet legal obligations. You can ask us to delete your account and associated data.",
  ]},
  { h: "Your choices and rights", p: [
    "You can ask to access, correct, or delete your personal information, or to close your account, by contacting us at [YOUR CONTACT EMAIL]. Sellers can edit most of their information directly in the dashboard.",
    "If you are a shopper and want an order or your details changed or removed, contact the seller you bought from, or contact us.",
  ]},
  { h: "Cookies", p: [
    "We use only essential cookies: a session cookie to keep you logged in, and a cookie to remember your language choice. We do not use advertising cookies.",
  ]},
  { h: "Children", p: [
    "The Platform is intended for businesses and adults (18 and over). It is not directed at children, and we do not knowingly collect information from anyone under 18.",
  ]},
  { h: "Changes to this policy", p: [
    "We may update this policy from time to time. We will change the \"Last updated\" date above, and we may notify you of significant changes within the Platform.",
  ]},
  { h: "Contact us", p: [
    "If you have questions about this policy or your information, contact us at [YOUR CONTACT EMAIL]. The Platform is operated by [YOUR COMPANY LEGAL NAME], [CITY], Pakistan.",
  ]},
];

export default function PrivacyPage() {
  return (
    <LegalLayout title="Privacy Policy" updated="20 June 2026">
      <LegalSections sections={SECTIONS} />
    </LegalLayout>
  );
}
