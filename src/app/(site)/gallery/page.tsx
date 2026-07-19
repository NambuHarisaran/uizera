import type { Metadata } from "next";
import { GalleryContent } from "./gallery-content";

export const metadata: Metadata = {
  title: "Gallery",
  description: "Photo gallery from UiZera Club events, workshops, and community moments at PSNA CET.",
};

export default function GalleryPage() {
  return <GalleryContent />;
}
