"use client";

import { useEffect, useState } from "react";
import {
  Award,
  Check,
  CheckCircle,
  CheckCircle2,
  Clock,
  ExternalLink,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  UserCheck,
  Users,
  X,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Spinner } from "@/components/shared/spinner";
import { EmptyState } from "@/components/shared/empty-state";
import { useCertProgram } from "@/lib/hooks";
import { initials } from "@/lib/utils";

interface PendingCertItem {
  uid: string;
  dayId: string;
  dayNumber: number;
  dayTitle: string;
  coins: number;
  xp: number;
  user: {
    displayName: string;
    email: string;
    photoURL?: string | null;
    department?: string | null;
    year?: string | null;
    regNo?: string | null;
  };
  submissionLink?: string | null;
  completedAt?: number | null;
}

export default function AdminCertificationsPage() {
  const { data, isLoading, refetch } = useCertProgram();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Day Form State
  const [day, setDay] = useState(1);
  const [certName, setCertName] = useState("");
  const [description, setDescription] = useState("");
  const [link, setLink] = useState("");
  const [coins, setCoins] = useState(50);

  // Pending Verifications Queue State
  const [pending, setPending] = useState<PendingCertItem[]>([]);
  const [loadingPending, setLoadingPending] = useState(true);
  const [actioningUid, setActioningUid] = useState<string | null>(null);
  const [verifyingAll, setVerifyingAll] = useState(false);
  const [searchPending, setSearchPending] = useState("");

  // Student manual fallback verification form state
  const [verifyDayId, setVerifyDayId] = useState("day-01");
  const [uidsText, setUidsText] = useState("");
  const [verifying, setVerifying] = useState(false);

  const days = data?.days ?? [];

  const fetchPending = async () => {
    setLoadingPending(true);
    try {
      const res = await fetch("/api/admin/certifications/verify");
      const body = await res.json().catch(() => null);
      if (res.ok && body?.data?.pending) {
        setPending(body.data.pending);
      }
    } catch {
      // Ignore
    } finally {
      setLoadingPending(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const handleVerifySingle = async (item: PendingCertItem, status: "completed" | "rejected") => {
    setActioningUid(`${item.uid}_${item.dayId}`);
    try {
      const res = await fetch("/api/admin/certifications/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dayId: item.dayId,
          uids: [item.uid],
          status,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? "Verification failed.");
      }

      toast.success(
        status === "completed"
          ? `Verified ${item.user.displayName} for Day ${item.dayNumber} (+${item.coins} Coins awarded)!`
          : `Submission from ${item.user.displayName} was rejected.`
      );
      setPending((prev) => prev.filter((p) => !(p.uid === item.uid && p.dayId === item.dayId)));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Action failed.");
    } finally {
      setActioningUid(null);
    }
  };

  const handleVerifyAll = async () => {
    if (pending.length === 0) return;
    if (!confirm(`Are you sure you want to verify all ${pending.length} pending submissions and award coins?`)) {
      return;
    }

    setVerifyingAll(true);
    try {
      // Group by dayId
      const byDay: Record<string, string[]> = {};
      for (const p of pending) {
        if (!byDay[p.dayId]) byDay[p.dayId] = [];
        byDay[p.dayId]!.push(p.uid);
      }

      for (const [dayId, uids] of Object.entries(byDay)) {
        await fetch("/api/admin/certifications/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            dayId,
            uids,
            status: "completed",
          }),
        });
      }

      toast.success(`Successfully verified all ${pending.length} student submissions!`);
      setPending([]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error verifying all students.");
    } finally {
      setVerifyingAll(false);
    }
  };

  const handleSaveDay = async () => {
    if (!certName || !link) {
      toast.error("Certification name and course link are required.");
      return;
    }

    setSaving(true);
    try {
      const dayStr = String(day).padStart(2, "0");
      const dayId = `day-${dayStr}`;

      const res = await fetch("/api/admin/certifications/days", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dayId,
          day: Number(day),
          certName,
          description,
          link,
          coins: Number(coins),
          unlockDate: Date.now(),
        }),
      });

      if (!res.ok) throw new Error("Failed to save certification day.");
      toast.success("Certification day configured!");
      setOpen(false);
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error saving cert day.");
    } finally {
      setSaving(false);
    }
  };

  const handleManualVerify = async () => {
    const uids = uidsText
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);

    if (uids.length === 0) {
      toast.error("Please enter at least one Student UID.");
      return;
    }

    setVerifying(true);
    try {
      const res = await fetch("/api/admin/certifications/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dayId: verifyDayId,
          uids,
          status: "completed",
        }),
      });

      if (!res.ok) throw new Error("Verification failed.");
      toast.success(`Verified ${uids.length} student(s) for ${verifyDayId}!`);
      setUidsText("");
      fetchPending();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error verifying students.");
    } finally {
      setVerifying(false);
    }
  };

  const filteredPending = pending.filter((item) => {
    if (!searchPending.trim()) return true;
    const q = searchPending.toLowerCase();
    return (
      item.user.displayName.toLowerCase().includes(q) ||
      item.user.email.toLowerCase().includes(q) ||
      (item.user.regNo && item.user.regNo.toLowerCase().includes(q)) ||
      item.dayTitle.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">30-Day Certification Program</h1>
          <p className="text-muted-foreground text-sm">
            Review student progress, award completion coins, and configure daily milestones.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchPending}
            disabled={loadingPending}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loadingPending ? "animate-spin" : ""}`} /> Refresh Queue
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2 bg-brand-500 hover:bg-brand-600">
                <Plus className="h-4 w-4" /> Add / Edit Day
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Configure Certification Day</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label>Day Number (1-30)</Label>
                    <Input
                      type="number"
                      min={1}
                      max={30}
                      value={day}
                      onChange={(e) => setDay(Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <Label>Coins Reward</Label>
                    <Input
                      type="number"
                      min={1}
                      max={500}
                      value={coins}
                      onChange={(e) => setCoins(Number(e.target.value))}
                    />
                  </div>
                </div>

                <div>
                  <Label>Certificate / Course Name *</Label>
                  <Input
                    value={certName}
                    onChange={(e) => setCertName(e.target.value)}
                    placeholder="e.g. UiPath Academy - Automation Explorer"
                  />
                </div>

                <div>
                  <Label>Official Course Link *</Label>
                  <Input
                    value={link}
                    onChange={(e) => setLink(e.target.value)}
                    placeholder="https://academy.uipath.com/..."
                  />
                </div>

                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={2}
                    placeholder="Brief objective of this day's certification..."
                  />
                </div>

                <Button onClick={handleSaveDay} disabled={saving} className="w-full gap-2">
                  {saving ? <Spinner className="text-white" /> : <Sparkles className="h-4 w-4" />}
                  Save Day Configuration
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="queue" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="queue" className="flex items-center gap-2">
            <span>Review Queue</span>
            {pending.length > 0 && (
              <Badge className="h-5 rounded-full px-1.5 text-[10px] bg-uipath-orange text-white">
                {pending.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="days">Configured Days ({days.length})</TabsTrigger>
          <TabsTrigger value="manual">Bulk UID Tool</TabsTrigger>
        </TabsList>

        {/* ── 1. Pending Verifications Queue ──────────────────────────────── */}
        <TabsContent value="queue" className="space-y-4">
          <Card className="border-2 border-brand-500/20 shadow-sm">
            <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4">
              <div>
                <CardTitle className="flex items-center gap-2 text-xl font-bold">
                  <UserCheck className="h-5 w-5 text-emerald-500" />
                  Pending Student Submissions ({pending.length})
                </CardTitle>
                <CardDescription className="text-xs">
                  Review reported milestones. Click &ldquo;Verify&rdquo; to atomically award coins and record the completion.
                </CardDescription>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <div className="relative w-full sm:w-60">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Search by student or day..."
                    value={searchPending}
                    onChange={(e) => setSearchPending(e.target.value)}
                    className="h-8 pl-8 text-xs rounded-xl"
                  />
                </div>
                {pending.length > 1 && (
                  <Button
                    size="sm"
                    onClick={handleVerifyAll}
                    disabled={verifyingAll}
                    className="h-8 gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
                  >
                    {verifyingAll ? <Spinner className="h-3 w-3" /> : <CheckCircle className="h-3.5 w-3.5" />}
                    Verify All ({pending.length})
                  </Button>
                )}
              </div>
            </CardHeader>

            <CardContent>
              {loadingPending ? (
                <div className="flex justify-center py-12">
                  <Spinner className="h-8 w-8 text-brand-500" />
                </div>
              ) : pending.length === 0 ? (
                <div className="py-12 text-center space-y-3">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600">
                    <CheckCircle2 className="h-6 w-6" />
                  </div>
                  <h3 className="font-bold text-base">All Caught Up! 🎉</h3>
                  <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                    There are no pending certification reports waiting for verification. When students complete a day sprint, they will show up here.
                  </p>
                </div>
              ) : filteredPending.length === 0 ? (
                <p className="py-8 text-center text-xs text-muted-foreground">
                  No submissions match &ldquo;{searchPending}&rdquo;.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student</TableHead>
                        <TableHead>Milestone Day</TableHead>
                        <TableHead>Department / Year</TableHead>
                        <TableHead>Reward</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPending.map((item) => {
                        const isActioning = actioningUid === `${item.uid}_${item.dayId}`;
                        return (
                          <TableRow key={`${item.uid}_${item.dayId}`}>
                            <TableCell className="max-w-[14rem]">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <Avatar className="h-8 w-8 shrink-0">
                                  <AvatarImage src={item.user.photoURL ?? undefined} alt={item.user.displayName} />
                                  <AvatarFallback className="text-xs font-bold">
                                    {initials(item.user.displayName)}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="min-w-0">
                                  <p className="truncate font-semibold text-xs sm:text-sm text-foreground">
                                    {item.user.displayName}
                                  </p>
                                  <p className="truncate text-[11px] text-muted-foreground">
                                    {item.user.email}
                                  </p>
                                </div>
                              </div>
                            </TableCell>

                            <TableCell>
                              <div className="space-y-0.5">
                                <Badge className="bg-brand-500/15 text-brand-600 dark:text-brand-400 border-brand-500/30 font-bold text-xs">
                                  Day {item.dayNumber || item.dayId}
                                </Badge>
                                <p className="text-xs font-medium truncate max-w-[14rem]">
                                  {item.dayTitle}
                                </p>
                              </div>
                            </TableCell>

                            <TableCell className="text-xs">
                              {item.user.department ? (
                                <span>
                                  {item.user.department} {item.user.year ? `· Year ${item.user.year}` : ""}
                                </span>
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                              {item.user.regNo && (
                                <p className="text-[10px] font-mono text-muted-foreground">
                                  {item.user.regNo}
                                </p>
                              )}
                            </TableCell>

                            <TableCell>
                              <span className="font-mono font-bold text-xs text-amber-500">
                                +{item.coins} Coins
                              </span>
                            </TableCell>

                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <Button
                                  size="sm"
                                  disabled={isActioning || verifyingAll}
                                  onClick={() => handleVerifySingle(item, "completed")}
                                  className="h-8 gap-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl"
                                >
                                  {isActioning ? (
                                    <Spinner className="h-3 w-3 text-white" />
                                  ) : (
                                    <Check className="h-3.5 w-3.5" />
                                  )}
                                  Verify
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  disabled={isActioning || verifyingAll}
                                  onClick={() => handleVerifySingle(item, "rejected")}
                                  className="h-8 text-destructive hover:bg-destructive/10 text-xs rounded-xl"
                                  title="Reject submission"
                                >
                                  <X className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── 2. Configured Program Days ──────────────────────────────────── */}
        <TabsContent value="days">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-lg">Program Days ({days.length}/30)</CardTitle>
                <CardDescription className="text-xs">
                  Daily courses and milestones unlocked for students.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-12">
                  <Spinner className="h-8 w-8" />
                </div>
              ) : days.length === 0 ? (
                <EmptyState icon={Award} title="No days configured yet" description="Add a day to get started." />
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Day</TableHead>
                        <TableHead>Certificate / Course</TableHead>
                        <TableHead>Coins</TableHead>
                        <TableHead className="text-right">Course Link</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {days.map((d) => (
                        <TableRow key={d.id}>
                          <TableCell className="font-bold">Day {d.day}</TableCell>
                          <TableCell className="max-w-[16rem]">
                            <div className="truncate font-semibold text-sm" title={d.certName}>{d.certName}</div>
                            <div className="text-xs text-muted-foreground line-clamp-1">
                              {d.description}
                            </div>
                          </TableCell>
                          <TableCell className="font-semibold text-amber-500">
                            +{d.coins}
                          </TableCell>
                          <TableCell className="text-right">
                            <a
                              href={d.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-brand-500 hover:underline font-semibold"
                            >
                              <span>View</span>
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── 3. Bulk Manual UID Verification Tool (Advanced Fallback) ─────── */}
        <TabsContent value="manual">
          <Card className="max-w-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base font-bold">
                <CheckCircle className="h-5 w-5 text-emerald-500" />
                Batch Manual Verification
              </CardTitle>
              <CardDescription className="text-xs">
                Use this if you have an external list of student UIDs to verify at once.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Day ID (e.g. day-01, day-07)</Label>
                <Input
                  value={verifyDayId}
                  onChange={(e) => setVerifyDayId(e.target.value)}
                  placeholder="e.g. day-01"
                />
              </div>
              <div>
                <Label>Student UIDs (One per line)</Label>
                <Textarea
                  rows={5}
                  value={uidsText}
                  onChange={(e) => setUidsText(e.target.value)}
                  placeholder="Paste student UIDs here..."
                />
              </div>
              <Button onClick={handleManualVerify} disabled={verifying} className="w-full gap-2 font-bold">
                {verifying ? <Spinner className="text-white" /> : <Award className="h-4 w-4" />}
                Verify Completion & Award Coins
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
