import type { Metadata } from "next";
import { ResourcesContent } from "./resources-content";

export const metadata: Metadata = {
  title: "Resources",
  description: "Curated learning resources for UiPath, RPA, automation, and AI — videos, docs, and guides.",
};

export default function ResourcesPage() {
  return <ResourcesContent />;
}
