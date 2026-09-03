import type { Metadata } from "next";
import { PolicyDocument } from "@/components/customer/policy-document";

export const metadata: Metadata = { title: "Terms & Conditions - Maqbool Islamic Products" };

export default function TermsPage() {
  return <PolicyDocument title="Terms & Conditions" summary="These terms explain the rules for using the Maqbool Islamic Products storefront, placing orders, and interacting with our services." sections={[
    { title: "Using this website", paragraphs: ["By browsing or using this website, you agree to use it lawfully and provide accurate information when creating an account or placing an order. If you do not agree with these terms, please stop using the website."] },
    { title: "Products and availability", paragraphs: ["We aim to describe and photograph every product accurately. Natural materials, handcrafted finishes, display settings, and packaging batches may cause small variations. Product availability and purchase limits may change without notice."] },
    { title: "Pricing and orders", paragraphs: ["Prices are displayed in the currency of your selected market. Tax and delivery charges are calculated using that market’s configured rules. An order is accepted only when we confirm it."], bullets: ["Coupons cannot be exchanged for cash.", "Only one eligible coupon may be used per order.", "Shipping, tax, and COD charges are shown before order placement.", "Online payments are processed securely by Razorpay and are confirmed only after payment verification."] },
    { title: "Payment", paragraphs: ["Available payment methods are shown at checkout. For real transactions, a payment is complete only after confirmation by the payment provider. Never share an OTP, PIN, CVV, or banking password with anyone claiming to represent Maqbool."] },
    { title: "Intellectual property", paragraphs: ["Storefront text, brand elements, product photography, graphics, and original content belong to Maqbool Islamic Products or their respective licensors. They may not be copied or commercially reused without written permission."] },
    { title: "Liability and changes", paragraphs: ["To the extent permitted by law, we are not responsible for indirect losses caused by misuse, service interruption, or circumstances beyond reasonable control. We may update these terms as our services or legal requirements change."] },
  ]} />;
}
