import type { Metadata } from "next";
import { LegalLayout, LegalSections, type LegalSection } from "@/components/marketing/legal-layout";

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description: "The terms that govern your use of StoreLink.",
};

const SECTIONS: LegalSection[] = [
  { h: "Agreement to these terms", p: [
    "These Terms & Conditions (\"Terms\") govern your use of StoreLink (the \"Platform\"), operated by [YOUR COMPANY LEGAL NAME] (\"we\", \"us\"). By creating an account or using the Platform, you agree to these Terms. If you do not agree, please do not use the Platform.",
  ]},
  { h: "1. What StoreLink is", p: [
    "StoreLink is a tool that lets a business (a \"seller\") create an online storefront, list products, and take orders — including Cash on Delivery and, for verified sellers, online payment. Orders placed in a seller's store are sent to that seller to fulfil.",
    "We provide the software. We are not the seller, and we are not a party to the sale between a seller and a shopper.",
  ]},
  { h: "2. Your account", p: [
    "You must give accurate information and keep your login PIN confidential. You are responsible for activity that happens under your account. Tell us promptly if you believe your account has been used without your permission.",
  ]},
  { h: "3. Seller responsibilities", p: ["If you use the Platform as a seller, you agree to:"], ul: [
    "List only products you are legally allowed to sell, with accurate descriptions, prices, and stock.",
    "Fulfil the orders you accept, and handle returns, refunds, and customer service for your own shop.",
    "Follow all laws that apply to your business, including consumer protection, tax, and advertising rules.",
    "Handle your customers' personal information lawfully, and use it only to fulfil their orders.",
    "Not use the Platform to mislead customers or to sell prohibited or illegal goods.",
  ]},
  { h: "4. Prohibited products and conduct", p: [
    "You may not use the Platform to offer or promote illegal goods or services; counterfeit or stolen items; weapons, drugs, or other restricted items; adult or explicit content; anything that infringes someone else's intellectual property; or anything fraudulent, harmful, or against Pakistani law.",
    "You may not attempt to disrupt, hack, overload, or misuse the Platform.",
  ]},
  { h: "5. Seller verification", p: [
    "To accept online payments, a seller must complete identity verification, which may include providing a CNIC and a selfie. We may approve, reject, or revoke verification at our discretion, and may suspend online payments if we suspect fraud.",
    "Verification helps protect shoppers but is not a guarantee about any seller or their products.",
  ]},
  { h: "6. Fees and subscription", p: [
    "Paid plans require a monthly subscription fee, shown on the pricing page. Paid plans are billed monthly in advance. Your free trial lasts 14 days; to continue on a paid plan after the trial ends, contact us to arrange payment. Fees are non-refundable except where required by law, and we may change fees with reasonable notice.",
    "Except where the law requires otherwise, fees are non-refundable. We may change plans or pricing with reasonable notice.",
  ]},
  { h: "7. Payments and Cash on Delivery", p: [
    "For Cash on Delivery, payment is collected by the seller or their courier on delivery — we are not involved in that payment. For online payments, the shopper pays the seller's provided account directly; we do not hold, process, or guarantee those funds.",
    "Any dispute about payment, delivery, or a product is between the shopper and the seller.",
  ]},
  { h: "8. Content and ownership", p: [
    "Sellers keep ownership of the content they upload, such as shop name, product information, and images. By uploading content, you grant us a licence to host, display, and use it to operate and promote the Platform. You confirm you have the right to use any content you upload.",
  ]},
  { h: "9. Availability and changes", p: [
    "We work to keep the Platform available, but we do not guarantee it will be uninterrupted or error-free. We may add, change, or remove features.",
  ]},
  { h: "10. Disclaimers", p: [
    "The Platform is provided \"as is\" and \"as available\", without warranties of any kind to the extent the law allows. We do not guarantee any particular sales, results, or that the Platform will meet every need.",
  ]},
  { h: "11. Limitation of liability", p: [
    "To the extent the law allows, we are not liable for indirect, incidental, or consequential losses, or for any loss arising from a transaction between a seller and a shopper, from a seller's products or conduct, or from your use of the Platform.",
    "Where our liability cannot be excluded, it is limited to the amount you paid us for the Platform in the three months before the claim.",
  ]},
  { h: "12. Suspension and termination", p: [
    "We may suspend or close an account that breaks these Terms or the law, or to protect the Platform or its users. You may stop using the Platform and close your account at any time.",
  ]},
  { h: "13. Governing law", p: [
    "These Terms are governed by the laws of Pakistan, and any dispute is subject to the courts of [CITY], Pakistan.",
  ]},
  { h: "14. Changes to these terms", p: [
    "We may update these Terms from time to time. We will update the \"Last updated\" date above, and continued use of the Platform after changes means you accept them.",
  ]},
  { h: "15. Contact us", p: [
    "Questions about these Terms? Contact us at [YOUR CONTACT EMAIL].",
  ]},
];

export default function TermsPage() {
  return (
    <LegalLayout title="Terms & Conditions" updated="20 June 2026">
      <LegalSections sections={SECTIONS} />
    </LegalLayout>
  );
}
