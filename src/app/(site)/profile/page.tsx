import type { Metadata } from "next";
import { ProfileContent } from "./profile-content";

export const metadata: Metadata = {
  title: "Profile",
  description: "View and edit your UiZera Club profile, badges, and activity.",
};

export default function ProfilePage() {
  return <ProfileContent />;
}
