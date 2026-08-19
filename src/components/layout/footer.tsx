import Link from "next/link";
import { Logo } from "@/components/layout/logo";
import { Instagram, Linkedin, Mail, MapPin } from "lucide-react";
import { SITE } from "@/lib/constants";

const footerLinks = {
  Community: [
    { href: "/about", label: "About" },
    { href: "/team", label: "Team" },
    { href: "/events", label: "Events" },
    { href: "/gallery", label: "Gallery" },
    { href: "/announcements", label: "Announcements" },
  ],
  Learn: [
    { href: "/quiz", label: "Quizzes" },
    { href: "/challenges", label: "Weekly Challenges" },
    { href: "/certifications", label: "30-Day Certifications" },
    { href: "/resources", label: "Resources" },
    { href: "/leaderboard", label: "Leaderboard" },
  ],
  Legal: [
    { href: "/privacy", label: "Privacy Policy" },
    { href: "/terms", label: "Terms of Service" },
    { href: "/contact", label: "Contact" },
  ],
};

export function Footer() {
  return (
    <footer className="border-t bg-card/50">
      <div className="container py-14">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2.5 font-display text-lg font-bold group">
              <Logo
                width={140}
                height={46}
                imgClassName="h-9 w-auto object-contain transition-transform duration-200 group-hover:scale-105"
              />
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">
              {SITE.description}
            </p>
            <div className="mt-5 flex items-center gap-3">
              <a
                href={SITE.social.instagram}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="rounded-lg border p-2 text-muted-foreground transition-colors hover:border-brand-500/50 hover:text-brand-500"
              >
                <Instagram className="h-4 w-4" />
              </a>
              <a
                href={SITE.social.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
                className="rounded-lg border p-2 text-muted-foreground transition-colors hover:border-brand-500/50 hover:text-brand-500"
              >
                <Linkedin className="h-4 w-4" />
              </a>
            </div>
          </div>

          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h3 className="mb-4 text-sm font-semibold">{title}</h3>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t pt-8 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-2">
            <span className="flex items-center gap-2">
              <MapPin className="h-4 w-4 shrink-0" />
              {SITE.college}, {SITE.location}
            </span>
            <a
              href={`mailto:${SITE.email}`}
              className="flex items-center gap-2 transition-colors hover:text-foreground"
            >
              <Mail className="h-4 w-4 shrink-0" />
              {SITE.email}
            </a>
          </div>
          <p>
            © {new Date().getFullYear()} {SITE.name} — {SITE.college}. All rights
            reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
