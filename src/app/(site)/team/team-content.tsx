"use client";

import { motion } from "framer-motion";
import {
  Award,
  Crown,
  GraduationCap,
  Linkedin,
  Mail,
  Sparkles,
  Trophy,
  UserCheck,
  Users,
} from "lucide-react";
import { SectionHeading } from "@/components/shared/section-heading";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/shared/spinner";
import { EmptyState } from "@/components/shared/empty-state";
import { useTeam } from "@/lib/hooks";
import { initials } from "@/lib/utils";
import type { TeamMember, TeamSection } from "@/types";

const sectionOrder: { key: TeamSection; label: string; icon: typeof Users }[] = [
  { key: "faculty", label: "Faculty In-Charge", icon: GraduationCap },
  { key: "hod", label: "Head of Department", icon: Award },
  { key: "sdc", label: "Student Developer Champion (2025-26)", icon: Crown },
  { key: "core", label: "Core Team", icon: Sparkles },
  { key: "coordinators", label: "Student Coordinators", icon: UserCheck },
  { key: "members", label: "Community Members", icon: Users },
];

/** Display order for role categories inside the core team. Unknown roles go last. */
const ROLE_ORDER = [
  "Technical Team",
  "Cinematography",
  "Social Media",
  "Content Creator",
  "PRO",
  "Graphical Designer",
  "Event Manager",
];

const ROLE_COLORS: Record<string, string> = {
  "Technical Team": "bg-blue-500/10 text-blue-500 border-blue-500/20",
  Cinematography: "bg-rose-500/10 text-rose-500 border-rose-500/20",
  "Social Media": "bg-pink-500/10 text-pink-500 border-pink-500/20",
  "Content Creator": "bg-purple-500/10 text-purple-400 border-purple-500/20",
  PRO: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  "Graphical Designer": "bg-amber-500/10 text-amber-500 border-amber-500/20",
  "Event Manager": "bg-violet-500/10 text-violet-500 border-violet-500/20",
};

function groupByRole(members: TeamMember[]): [string, TeamMember[]][] {
  const map = new Map<string, TeamMember[]>();
  for (const m of members) {
    const list = map.get(m.role) ?? [];
    list.push(m);
    map.set(m.role, list);
  }
  return [...map.entries()].sort(([a], [b]) => {
    const ia = ROLE_ORDER.indexOf(a);
    const ib = ROLE_ORDER.indexOf(b);
    return (ia === -1 ? ROLE_ORDER.length : ia) - (ib === -1 ? ROLE_ORDER.length : ib);
  });
}

function MemberCard({ member, highlight = false }: { member: TeamMember; highlight?: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.4 }}
      className={
        highlight
          ? "group relative mx-auto flex w-full max-w-md flex-col items-center rounded-3xl border-2 border-amber-500/80 bg-gradient-to-b from-amber-500/15 via-card to-card p-8 text-center shadow-2xl shadow-amber-500/20 transition-all duration-300 hover:scale-[1.02]"
          : "group flex flex-col items-center rounded-2xl border bg-card p-6 text-center transition-all duration-300 hover:border-brand-500/40 hover:shadow-lg hover:shadow-brand-500/5 justify-between"
      }
    >
      {highlight && (
        <span className="absolute -top-4 flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-1 font-mono text-xs font-black uppercase tracking-wider text-black shadow-md">
          <Crown className="h-3.5 w-3.5" />
          SDC Lead Champion
        </span>
      )}

      <div className="flex flex-col items-center w-full">
        <div className="relative mb-4">
          <Avatar
            className={
              highlight
                ? "h-28 w-28 border-4 border-amber-400 ring-4 ring-amber-500/30 shadow-xl"
                : "h-20 w-20 border-2 border-brand-500/20 transition-all duration-300 group-hover:border-brand-500/50 group-hover:shadow-md"
            }
          >
            <AvatarImage src={member.photo ?? undefined} alt={member.name} />
            <AvatarFallback className="bg-uipath-orange/15 font-display text-xl text-uipath-orange font-bold">
              {initials(member.name)}
            </AvatarFallback>
          </Avatar>
        </div>

        <h3 className="w-full truncate font-display text-base sm:text-lg font-bold text-foreground" title={member.name}>
          {member.name}
        </h3>

        <div className="mt-1.5 flex flex-wrap items-center justify-center gap-1">
          <span
            className={`inline-block rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${
              ROLE_COLORS[member.role] || "bg-brand-500/10 text-brand-500 border-brand-500/20"
            }`}
          >
            {member.role}
          </span>
        </div>

        {member.department && (
          <p className="mt-1 w-full truncate text-xs text-muted-foreground font-medium">{member.department}</p>
        )}

        {member.bio && (
          <p className="mt-3 line-clamp-3 text-xs leading-relaxed text-muted-foreground">
            {member.bio}
          </p>
        )}
      </div>

      <div className="mt-5 flex gap-2">
        {member.linkedin && (
          <a
            href={member.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-9 w-9 items-center justify-center rounded-xl border p-2 text-muted-foreground transition-all hover:border-brand-500/50 hover:text-brand-500 hover:bg-brand-500/5"
            aria-label={`${member.name} LinkedIn`}
            title="LinkedIn Profile"
          >
            <Linkedin className="h-4 w-4" />
          </a>
        )}
        {member.email && (
          <a
            href={`mailto:${member.email}`}
            className="flex h-9 w-9 items-center justify-center rounded-xl border p-2 text-muted-foreground transition-all hover:border-brand-500/50 hover:text-brand-500 hover:bg-brand-500/5"
            aria-label={`Email ${member.name}`}
            title="Send Email"
          >
            <Mail className="h-4 w-4" />
          </a>
        )}
      </div>
    </motion.div>
  );
}

export function TeamContent() {
  const { data, isLoading } = useTeam();

  const grouped = new Map<TeamSection, TeamMember[]>();
  for (const s of sectionOrder) grouped.set(s.key, []);
  if (data?.items) {
    for (const m of data.items) {
      const bucket = grouped.get(m.section);
      if (bucket) bucket.push(m);
    }
    for (const bucket of grouped.values()) {
      bucket.sort((a, b) => a.order - b.order);
    }
  }

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="pb-24">
      {/* Hero */}
      <section className="hero-glow relative overflow-hidden py-20 border-b">
        <div className="bg-grid pointer-events-none absolute inset-0 opacity-20" />
        <div className="container relative">
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mx-auto max-w-3xl text-center"
          >
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-brand-500/30 bg-brand-500/10 px-4 py-1.5 text-sm font-semibold text-brand-600 dark:text-brand-400">
              <Users className="h-4 w-4" />
              Community Leadership
            </div>
            <h1 className="font-display text-4xl font-extrabold sm:text-5xl tracking-tight">
              The People Behind <span className="text-gradient">UiZera</span>
            </h1>
            <p className="mt-3 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
              Meet our faculty patrons, student developer champion, core team members, and student coordinators driving RPA innovation at PSNA CET.
            </p>
          </motion.div>
        </div>
      </section>

      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <Spinner className="h-10 w-10 text-brand-500" />
        </div>
      ) : (
        <div className="container space-y-20 py-12 max-w-6xl">
          {/* Quick Jump Bar */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            {sectionOrder.map(({ key, label }) => {
              const members = grouped.get(key) ?? [];
              if (members.length === 0) return null;
              return (
                <Button
                  key={key}
                  variant="outline"
                  size="sm"
                  onClick={() => scrollToSection(key)}
                  className="text-xs rounded-xl"
                >
                  {label} ({members.length})
                </Button>
              );
            })}
          </div>

          {sectionOrder.map(({ key, label, icon: Icon }) => {
            const members = grouped.get(key) ?? [];
            if (members.length === 0) return null;

            if (key === "core") {
              return (
                <section key={key} id={key} className="space-y-10 scroll-mt-24">
                  <div className="flex items-center justify-between border-b pb-4">
                    <SectionHeading title={label} />
                    <Badge variant="outline" className="font-mono text-xs text-brand-500">
                      {members.length} Members
                    </Badge>
                  </div>

                  <div className="space-y-12">
                    {groupByRole(members).map(([role, roleMembers]) => (
                      <div key={role} className="space-y-4">
                        <div className="flex items-center gap-3">
                          <span className="h-2.5 w-2.5 rounded-full bg-brand-500" />
                          <h3 className="font-display text-lg font-bold text-foreground">{role}</h3>
                          <span className="font-mono text-xs font-semibold text-muted-foreground">
                            ({String(roleMembers.length).padStart(2, "0")})
                          </span>
                          <span className="h-px flex-1 bg-border" />
                        </div>
                        <div
                          className={`grid gap-5 ${
                            roleMembers.length <= 2
                              ? "sm:grid-cols-2 lg:grid-cols-3"
                              : "sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                          }`}
                        >
                          {roleMembers.map((m) => (
                            <MemberCard key={m.id} member={m} />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              );
            }

            return (
              <section key={key} id={key} className="space-y-8 scroll-mt-24">
                <div className="flex items-center justify-between border-b pb-4">
                  <SectionHeading title={label} />
                  <Badge variant="outline" className="font-mono text-xs text-brand-500">
                    {members.length} {members.length === 1 ? "Leader" : "Leaders"}
                  </Badge>
                </div>

                <div
                  className={`grid gap-6 ${
                    key === "sdc"
                      ? "mx-auto max-w-md"
                      : members.length <= 2
                      ? "mx-auto max-w-xl sm:grid-cols-2"
                      : "sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                  }`}
                >
                  {members.map((m) => (
                    <MemberCard key={m.id} member={m} highlight={key === "sdc"} />
                  ))}
                </div>
              </section>
            );
          })}

          {(!data?.items || data.items.length === 0) && (
            <EmptyState
              icon={Users}
              title="No team members listed yet"
              description="Team member profiles will appear here once added by community administrators."
            />
          )}
        </div>
      )}
    </div>
  );
}

