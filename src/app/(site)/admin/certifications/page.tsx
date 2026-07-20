"use client";

import { useState } from "react";
import { Award, CheckCircle, Plus } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Spinner } from "@/components/shared/spinner";
import { EmptyState } from "@/components/shared/empty-state";
import { useCertProgram } from "@/lib/hooks";

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

  // Student verification form state
  const [verifyDayId, setVerifyDayId] = useState("day-01");
  const [uidsText, setUidsText] = useState("");
  const [verifying, setVerifying] = useState(false);

  const days = data?.days ?? [];

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

  const handleVerifyStudents = async () => {
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
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error verifying students.");
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">30-Day Certification Program</h1>
        <p className="text-muted-foreground">
          Configure daily milestones and verify student completion.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Bulk Verify Panel */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-emerald-500" />
              Verify Student Completion
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Day ID</Label>
              <Input
                value={verifyDayId}
                onChange={(e) => setVerifyDayId(e.target.value)}
                placeholder="e.g. day-01"
              />
            </div>
            <div>
              <Label>Student UIDs (One per line)</Label>
              <Textarea
                rows={6}
                value={uidsText}
                onChange={(e) => setUidsText(e.target.value)}
                placeholder="Paste UID list here..."
              />
            </div>
            <Button onClick={handleVerifyStudents} disabled={verifying} className="w-full gap-2">
              {verifying ? <Spinner className="text-white" /> : <Award className="h-4 w-4" />}
              Verify Completion & Award Coins
            </Button>
          </CardContent>
        </Card>

        {/* Days Table */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Program Days ({days.length}/30)</CardTitle>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-2">
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
                        value={day}
                        onChange={(e) => setDay(Number(e.target.value))}
                      />
                    </div>
                    <div>
                      <Label>Coins Reward</Label>
                      <Input
                        type="number"
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
                    />
                  </div>

                  <Button onClick={handleSaveDay} disabled={saving} className="w-full">
                    {saving ? <Spinner className="text-white" /> : "Save Day Configuration"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
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
                      <TableHead>Certificate</TableHead>
                      <TableHead>Coins</TableHead>
                      <TableHead className="text-right">Link</TableHead>
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
                          {d.coins}
                        </TableCell>
                        <TableCell className="text-right">
                          <a
                            href={d.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-brand-500 hover:underline"
                          >
                            View Course
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
      </div>
    </div>
  );
}
