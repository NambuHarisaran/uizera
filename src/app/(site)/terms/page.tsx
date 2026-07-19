import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms of Service for UI Zera Club platform at PSNA CET.",
};

export default function TermsPage() {
  return (
    <div className="container max-w-3xl py-24">
      <h1 className="font-display text-4xl font-bold">Terms of Service</h1>
      <p className="mt-2 text-sm text-muted-foreground">Last updated: July 2026</p>

      <div className="prose prose-sm dark:prose-invert mt-10 max-w-none">
        <h2>1. Acceptance</h2>
        <p>
          By accessing or using the UI Zera Club platform, you agree to these terms. If you
          do not agree, please do not use the platform.
        </p>

        <h2>2. Eligibility</h2>
        <p>
          This platform is intended for students and faculty of PSNA College of Engineering
          &amp; Technology. You must use a valid Google account to sign in.
        </p>

        <h2>3. User Conduct</h2>
        <p>You agree to:</p>
        <ul>
          <li>Use the platform for legitimate educational purposes only</li>
          <li>Not attempt to manipulate coins, leaderboard rankings, or quiz results</li>
          <li>Not submit fraudulent challenge submissions or certification reports</li>
          <li>Not attempt to access admin features without authorization</li>
          <li>Respect other community members</li>
        </ul>

        <h2>4. Coin System</h2>
        <p>
          Coins are an internal metric for tracking participation. They have no monetary value
          and cannot be exchanged, transferred, or redeemed outside the platform. Administrators
          reserve the right to adjust coin balances.
        </p>

        <h2>5. Content</h2>
        <p>
          By submitting content (challenge submissions, profile information), you grant UI Zera Club
          the right to display it within the platform. You retain ownership of your submissions.
        </p>

        <h2>6. Account Termination</h2>
        <p>
          Administrators may disable accounts that violate these terms or engage in abusive behavior.
        </p>

        <h2>7. Disclaimer</h2>
        <p>
          This platform is provided &ldquo;as is&rdquo; without warranties of any kind. UI Zera Club
          is a student community and not affiliated with UiPath Inc.
        </p>

        <h2>8. Changes</h2>
        <p>
          We may update these terms from time to time. Continued use of the platform constitutes
          acceptance of any changes.
        </p>

        <h2>9. Contact</h2>
        <p>
          For questions about these terms, contact us at{" "}
          <a href="mailto:uizera@psnacet.edu.in">uizera@psnacet.edu.in</a>.
        </p>
      </div>
    </div>
  );
}
