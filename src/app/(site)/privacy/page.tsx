import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Privacy Policy for UiZera Club platform at PSNA CET.",
};

export default function PrivacyPage() {
  return (
    <div className="container max-w-3xl py-24">
      <h1 className="font-display text-4xl font-bold">Privacy Policy</h1>
      <p className="mt-2 text-sm text-muted-foreground">Last updated: July 2026</p>

      <div className="prose prose-sm dark:prose-invert mt-10 max-w-none">
        <h2>1. Information We Collect</h2>
        <p>
          When you sign in with Google, we receive your name, email address, and profile photo.
          We also collect data about your quiz attempts, challenge submissions, certification progress,
          and coin earnings within the platform.
        </p>

        <h2>2. How We Use Your Information</h2>
        <p>Your information is used to:</p>
        <ul>
          <li>Provide access to quizzes, challenges, and certifications</li>
          <li>Maintain the leaderboard and coin system</li>
          <li>Display your profile within the community</li>
          <li>Send relevant announcements about community activities</li>
          <li>Improve the platform experience</li>
        </ul>

        <h2>3. Data Storage</h2>
        <p>
          All data is stored securely in Google Firebase (Firestore) with strict security rules.
          Only administrators can access user data beyond what is publicly displayed on the leaderboard.
        </p>

        <h2>4. Data Sharing</h2>
        <p>
          We do not sell, trade, or share your personal information with third parties.
          Your leaderboard ranking (name, department, coins, badges) is visible to other community members.
        </p>

        <h2>5. Cookies</h2>
        <p>
          We use a session cookie for authentication purposes only. This cookie is httpOnly and
          cannot be accessed by JavaScript. No tracking cookies are used.
        </p>

        <h2>6. Your Rights</h2>
        <p>
          You can request deletion of your account and data by contacting us at{" "}
          <a href="mailto:uizera@psnacet.edu.in">uizera@psnacet.edu.in</a>.
        </p>

        <h2>7. Contact</h2>
        <p>
          For privacy-related questions, contact us at{" "}
          <a href="mailto:uizera@psnacet.edu.in">uizera@psnacet.edu.in</a>.
        </p>
      </div>
    </div>
  );
}
