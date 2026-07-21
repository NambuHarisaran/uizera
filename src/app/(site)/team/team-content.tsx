"use client";

import { motion } from "framer-motion";
import { Linkedin, Mail, Trophy, Users } from "lucide-react";
import { SectionHeading } from "@/components/shared/section-heading";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Spinner } from "@/components/shared/spinner";
import { EmptyState } from "@/components/shared/empty-state";
import { useTeam } from "@/lib/hooks";
import { initials } from "@/lib/utils";
import type { TeamMember, TeamSection } from "@/types";

const sectionOrder: { key: TeamSection; label: string }[] = [
  { key: "faculty", label: "Faculty In-Charge" },
  { key: "hod", label: "Head of Department" },
  { key: "sdc", label: "Student Developer Champion (2025-26)" },
  { key: "core", label: "Core Team" },
  { key: "coordinators", label: "Student Coordinators" },
  { key: "members", label: "Community Members" },
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
          ? "group relative mx-auto flex w-full max-w-sm flex-col items-center border-2 border-uipath-gold bg-card p-8 text-center shadow-lg transition-all duration-300 hover:shadow-xl"
          : "group flex flex-col items-center rounded-2xl border bg-card p-6 text-center transition-all duration-300 hover:border-brand-500/30 hover:shadow-lg hover:shadow-brand-500/5"
      }
    >
      {highlight && (
        <span className="absolute -top-4 flex items-center gap-1.5 bg-uipath-gold px-3 py-1 font-mono text-[11px] font-bold uppercase tracking-wider text-black">
          <Trophy className="h-3.5 w-3.5" />
          Champion
        </span>
      )}
      <Avatar
        className={
          highlight
            ? "mb-4 h-24 w-24 border-2 border-uipath-gold/60"
            : "mb-4 h-20 w-20 border-2 border-brand-500/20 transition-all duration-300 group-hover:border-brand-500/40 group-hover:shadow-lg group-hover:shadow-brand-500/10"
        }
      >
        <AvatarImage src={member.photo ?? undefined} alt={member.name} />
        <AvatarFallback className="bg-uipath-orange/15 font-display text-lg text-uipath-orange">
          {initials(member.name)}
        </AvatarFallback>
      </Avatar>

      <h3 className="w-full truncate font-display text-base font-semibold" title={member.name}>
        {member.name}
      </h3>
      <p className="mt-0.5 w-full truncate text-sm text-brand-500" title={member.role}>
        {member.role}
      </p>
      {member.department && (
        <p className="mt-0.5 w-full truncate text-xs text-muted-foreground">{member.department}</p>
      )}
      {member.bio && (
        <p className="mt-3 line-clamp-3 text-xs leading-relaxed text-muted-foreground">
          {member.bio}
        </p>
      )}

      <div className="mt-4 flex gap-2">
        {member.linkedin && (
          <a
            href={member.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg border p-2 text-muted-foreground transition-colors hover:border-brand-500/50 hover:text-brand-500"
            aria-label={`${member.name} LinkedIn`}
          >
            <Linkedin className="h-4 w-4" />
          </a>
        )}
        {member.email && (
          <a
            href={`mailto:${member.email}`}
            className="rounded-lg border p-2 text-muted-foreground transition-colors hover:border-brand-500/50 hover:text-brand-500"
            aria-label={`Email ${member.name}`}
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

  return (
    <div className="pb-24">
      {/* Hero */}
      <section className="hero-glow relative overflow-hidden py-24">
        <div className="bg-grid pointer-events-none absolute inset-0 opacity-20" />
        <div className="container relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mx-auto max-w-3xl text-center"
          >
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand-500/30 bg-brand-500/10 px-4 py-1.5 text-sm font-medium text-brand-600 dark:text-brand-400">
              <Users className="h-4 w-4" />
              Our Team
            </div>
            <h1 className="font-display text-4xl font-bold sm:text-5xl">
              The People Behind <span className="text-gradient">UiZera</span>
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Meet the faculty, coordinators, and core members who make this community thrive.
            </p>
          </motion.div>
        </div>
      </section>

      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <Spinner className="h-8 w-8" />
        </div>
      ) : (
        <div className="container space-y-20 py-16">
          {sectionOrder.map(({ key, label }) => {
            const members = grouped.get(key) ?? [];
            if (members.length === 0) return null;
            if (key === "core") {
              return (
                <section key={key}>
                  <SectionHeading title={label} />
                  <div className="mt-10 space-y-14">
                    {groupByRole(members).map(([role, roleMembers]) => (
                      <div key={role}>
                        <div className="mb-6 flex items-center gap-3">
                          <span className="h-3 w-3 bg-uipath-orange" />
                          <h3 className="font-display text-xl font-bold">{role}</h3>
                          <span className="font-mono text-xs font-semibold text-muted-foreground">
                            {String(roleMembers.length).padStart(2, "0")}
                          </span>
                          <span className="h-px flex-1 bg-border" />
                        </div>
                        <div
                          className={`grid gap-6 ${roleMembers.length <= 2
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
              <section key={key}>
                <SectionHeading title={label} />
                <div
                  className={`mt-10 grid gap-6 ${key === "sdc"
                      ? "mx-auto max-w-sm"
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
              title="No team members yet"
              description="Team members will appear here once added by an admin."
            />
          )}
        </div>
      )}
    </div>
  );
}
