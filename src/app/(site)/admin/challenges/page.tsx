"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Check, Plus, Target, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Spinner } from "@/components/shared/spinner";
import { EmptyState } from "@/components/shared/empty-state";
import { useAdminChallenges } from "@/lib/hooks";
import { formatCoins, toDate } from "@/lib/utils";
import type { Challenge, ChallengeStatus } from "@/types";

export default function AdminChallengesPage() {
  const { data, isLoading, refetch } = useAdminChallenges();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [week, setWeek] = useState(1);
  const [description, setDescription] = useState("");
  const [instructions, setInstructions] = useState("");
  const [coins, setCoins] = useState(100);
  const [xp, setXp] = useState(150);
  const [status, setStatus] = useState<ChallengeStatus>("open");
  const [deadline, setDeadline] = useState("");

  const challenges = data?.challenges ?? [];

  const handleCreateChallenge = async () => {
    if (!title || !deadline) {
      toast.error("Title and deadline are required.");
      return;
    }

    setSaving(true);
    try {
      const body = {
        title,
        week: Number(week),
        description,
        instructions,
        resources: [],
        coins: Number(coins),
        xp: Number(xp),
        status,
        deadline: new Date(deadline).getTime(),
      };

      const res = await fetch("/api/admin/challenges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error ?? "Failed to create challenge.");
      }

      toast.success("Challenge created successfully!");
      setOpen(false);
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error creating challenge.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this challenge?")) return;
    try {
      const res = await fetch(`/api/admin/challenges/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete.");
      toast.success("Challenge deleted.");
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error deleting challenge.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">Weekly Challenges</h1>
          <p className="text-muted-foreground">
            Manage weekly assignment tasks and review student submissions.
          </p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" /> Create Challenge
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create Weekly Challenge</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <Label>Week Number</Label>
                  <Input
                    type="number"
                    value={week}
                    onChange={(e) => setWeek(Number(e.target.value))}
                  />
                </div>
                <div>
                  <Label>Coins</Label>
                  <Input
                    type="number"
                    value={coins}
                    onChange={(e) => setCoins(Number(e.target.value))}
                  />
                </div>
                <div>
                  <Label>XP Reward</Label>
                  <Input
                    type="number"
                    value={xp}
                    onChange={(e) => setXp(Number(e.target.value))}
                  />
                </div>
              </div>

              <div>
                <Label>Title *</Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Build an Excel Automation Robot"
                />
              </div>

              <div>
                <Label>Description</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief overview..."
                  rows={2}
                />
              </div>

              <div>
                <Label>Detailed Instructions</Label>
                <Textarea
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  placeholder="Step-by-step submission guidelines..."
                  rows={3}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>Status</Label>
                  <Select value={status} onValueChange={(v) => setStatus(v as ChallengeStatus)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Deadline *</Label>
                  <Input
                    type="datetime-local"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                  />
                </div>
              </div>

              <Button onClick={handleCreateChallenge} disabled={saving} className="w-full gap-2">
                {saving ? <Spinner className="text-white" /> : <Target className="h-4 w-4" />}
                Save Challenge
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Challenges ({challenges.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Spinner className="h-8 w-8" />
            </div>
          ) : challenges.length === 0 ? (
            <EmptyState icon={Target} title="No challenges yet" description="Create one to get started." />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Week</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Coins</TableHead>
                    <TableHead>Deadline</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {challenges.map((c) => {
                    const dl = toDate(c.deadline);
                    return (
                      <TableRow key={c.id}>
                        <TableCell className="font-semibold">Week {c.week}</TableCell>
                        <TableCell className="max-w-[16rem]">
                          <div className="truncate font-semibold text-sm" title={c.title}>{c.title}</div>
                          <div className="text-xs text-muted-foreground line-clamp-1">
                            {c.description}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{c.status}</Badge>
                        </TableCell>
                        <TableCell className="font-semibold text-amber-500">
                          {formatCoins(c.coins)}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {dl ? format(dl, "PP p") : "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            aria-label={`Delete challenge ${c.title}`}
                            onClick={() => handleDelete(c.id)}
                            className="text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
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
    </div>
  );
}
