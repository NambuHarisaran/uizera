import type { Metadata } from "next";
import { ContactContent } from "./contact-content";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with UI Zera Club at PSNA CET. Send us a message, find us on social media, or visit the campus.",
};

export default function ContactPage() {
  return <ContactContent />;
}
