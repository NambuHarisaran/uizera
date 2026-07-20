"use client";

import { useState } from "react";
import { Coins, Send } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/shared/spinner";
import type { CoinSource } from "@/types";

export default function AdminCoinsPage() {
  const [uid, setUid] = useState("");
  const [amount, setAmount] = useState(50);
  const [source, setSource] = useState<CoinSource>("special_activity");
  const [reason, setReason] = useState("");
  const [awarding, setAwarding] = useState(false);

  const handleAward = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uid || !amount || !reason) {
      toast.error("User UID, amount, and reason are required.");
      return;
    }

    setAwarding(true);
    try {
      const res = await fetch("/api/admin/coins/award", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid,
          amount: Number(amount),
          source,
          reason,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error ?? "Failed to award coins.");
      }

      toast.success(`Successfully awarded ${amount} coins!`);
      setUid("");
      setReason("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error awarding coins.");
    } finally {
      setAwarding(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Award Coins</h1>
        <p className="text-muted-foreground">
          Manually award or adjust coins for students with audit logging.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-amber-500" />
            Manual Coin Transaction
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAward} className="space-y-4">
            <div>
              <Label>Student UID *</Label>
              <Input
                value={uid}
                onChange={(e) => setUid(e.target.value)}
                placeholder="User UID (from User Management)"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Amount</Label>
                <Input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                />
                <p className="mt-1 text-xs text-muted-foreground">Positive to award, negative to deduct.</p>
              </div>

              <div>
                <Label>Source / Category</Label>
                <Select value={source} onValueChange={(v) => setSource(v as CoinSource)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="course_completion">Course Completion</SelectItem>
                    <SelectItem value="weekly_task">Weekly Task</SelectItem>
                    <SelectItem value="special_activity">Special Activity</SelectItem>
                    <SelectItem value="community_contribution">Community Contribution</SelectItem>
                    <SelectItem value="certification">Certification</SelectItem>
                    <SelectItem value="admin_adjustment">Admin Adjustment</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Reason / Note *</Label>
              <Textarea
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Detailed reason for this coin transaction (saved to audit logs)..."
              />
            </div>

            <Button type="submit" disabled={awarding} className="w-full gap-2">
              {awarding ? <Spinner className="text-white" /> : <Send className="h-4 w-4" />}
              Execute Transaction
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
