import type { Metadata } from "next";
import { CertificationsContent } from "./certifications-content";

export const metadata: Metadata = {
  title: "30-Day Certification Program",
  description: "Track your 30-day UiPath certification sprint — one certification per day for an entire month.",
};

export default function CertificationsPage() {
  return <CertificationsContent />;
}
