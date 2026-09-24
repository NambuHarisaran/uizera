"use client";

import { useEffect, useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { Coins, Search, Send, User, UserCheck, X } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/shared/spinner";
import { useAdminUsers } from "@/lib/hooks";
import { formatCoins, initials } from "@/lib/utils";
import type { AppUser, CoinSource } from "@/types";

const AMOUNT_PRESETS = [25, 50, 100, 200, 500];

export default function AdminCoinsPage() {
  const searchParams = useSearchParams();
  const preselectedUid = searchParams.get("uid") || "";

  const { data: usersData, isLoading: loadingUsers, refetch } = useAdminUsers();
  const users = usersData?.users ?? [];

  const [selectedUser, setSelectedUser] = useState<AppUser | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [amount, setAmount] = useState(50);
  const [source, setSource] = useState<CoinSource>("special_activity");
  const [reason, setReason] = useState("");
  const [awarding, setAwarding] = useState(false);

  // Preselect user if ?uid= is passed in URL
  useEffect(() => {
    if (preselectedUid && users.length > 0 && !selectedUser) {
      const match = users.find((u) => u.uid === preselectedUid);
      if (match) setSelectedUser(match);
    }
  }, [preselectedUid, users, selectedUser]);

  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return users
      .filter(
        (u) =>
          u.displayName?.toLowerCase().includes(q) ||
          u.email?.toLowerCase().includes(q) ||
          (u.regNo && u.regNo.toLowerCase().includes(q))
      )
      .slice(0, 6);
  }, [users, searchQuery]);

  const handleSelectUser = (u: AppUser) => {
    setSelectedUser(u);
    setSearchQuery("");
  };

  const handleAward = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser?.uid) {
      toast.error("Please search and select a student first.");
      return;
    }
    if (!amount || isNaN(amount)) {
      toast.error("Please enter a valid coin amount.");
      return;
    }
    if (!reason.trim()) {
      toast.error("Please provide a reason for the coin transaction.");
      return;
    }

    setAwarding(true);
    try {
      const res = await fetch("/api/admin/coins/award", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid: selectedUser.uid,
          amount: Number(amount),
          source,
          reason: reason.trim(),
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error ?? "Failed to award coins.");
      }

      const isPositive = Number(amount) >= 0;
      toast.success(
        isPositive
          ? `Awarded +${amount} coins to ${selectedUser.displayName}!`
          : `Deducted ${Math.abs(amount)} coins from ${selectedUser.displayName}!`
      );
      setReason("");
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error executing coin transaction.");
    } finally {
      setAwarding(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Award / Adjust Coins</h1>
        <p className="text-muted-foreground text-sm">
          Search for a student to award bonus coins, challenge prizes, or record manual balance adjustments.
        </p>
      </div>

      <Card className="border-2 border-brand-500/20 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl font-bold">
            <Coins className="h-5 w-5 text-amber-500" />
            Manual Coin Ledger Transaction
          </CardTitle>
          <CardDescription className="text-xs">
            Every transaction is recorded in the append-only audit ledger with your admin identity.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAward} className="space-y-5">
            {/* Student Picker */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Target Student *</Label>
              {selectedUser ? (
                <div className="flex items-center justify-between rounded-2xl border-2 border-brand-500/40 bg-brand-500/5 p-3.5 shadow-xs">
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar className="h-10 w-10 shrink-0 border border-brand-500/30">
                      <AvatarImage src={selectedUser.photoURL ?? undefined} alt={selectedUser.displayName} />
                      <AvatarFallback className="font-bold text-xs">
                        {initials(selectedUser.displayName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="truncate font-bold text-sm text-foreground">
                        {selectedUser.displayName}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {selectedUser.email}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <span className="font-mono text-xs font-bold text-amber-500">
                        {formatCoins(selectedUser.coins ?? 0)}
                      </span>
                      <p className="text-[10px] text-muted-foreground">Current Balance</p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedUser(null)}
                      className="h-8 w-8 p-0 rounded-full hover:bg-destructive/10 hover:text-destructive"
                      title="Choose a different student"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={loadingUsers ? "Loading users..." : "Search by student name, email, or reg no..."}
                    className="pl-9 rounded-xl"
                  />

                  {filteredUsers.length > 0 && (
                    <div className="absolute top-full z-20 mt-1 w-full rounded-2xl border bg-background/95 backdrop-blur-xl p-1.5 shadow-xl">
                      {filteredUsers.map((u) => (
                        <button
                          key={u.uid}
                          type="button"
                          onClick={() => handleSelectUser(u)}
                          className="flex w-full items-center justify-between rounded-xl p-2.5 text-left text-sm transition-colors hover:bg-accent cursor-pointer"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <Avatar className="h-7 w-7 shrink-0">
                              <AvatarImage src={u.photoURL ?? undefined} alt={u.displayName} />
                              <AvatarFallback className="text-[10px] font-bold">
                                {initials(u.displayName)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="truncate font-semibold text-xs text-foreground">
                                {u.displayName}
                              </p>
                              <p className="truncate text-[11px] text-muted-foreground">
                                {u.email}
                              </p>
                            </div>
                          </div>
                          <span className="font-mono text-xs font-bold text-amber-500 shrink-0 ml-2">
                            {formatCoins(u.coins ?? 0)}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Amount & Presets */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold">Coins Amount *</Label>
                <div className="flex items-center gap-1.5">
                  {AMOUNT_PRESETS.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setAmount(p)}
                      className={`rounded-lg px-2 py-0.5 text-xs font-bold transition-all ${
                        amount === p
                          ? "bg-amber-500 text-white shadow-xs"
                          : "border bg-card hover:bg-accent text-muted-foreground"
                      }`}
                    >
                      +{p}
                    </button>
                  ))}
                </div>
              </div>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="font-mono font-bold text-base"
              />
              <p className="text-[11px] text-muted-foreground">
                Enter a positive number to award coins, or a negative number to deduct.
              </p>
            </div>

            {/* Source Category */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Source / Category *</Label>
              <Select value={source} onValueChange={(v) => setSource(v as CoinSource)}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="special_activity">Special Activity / Workshop</SelectItem>
                  <SelectItem value="weekly_task">Weekly Challenge Reward</SelectItem>
                  <SelectItem value="course_completion">Course / Milestone Completion</SelectItem>
                  <SelectItem value="community_contribution">Community Contribution</SelectItem>
                  <SelectItem value="certification">Certification Verification</SelectItem>
                  <SelectItem value="admin_adjustment">Manual Admin Adjustment</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Reason */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Audit Reason / Note *</Label>
              <Textarea
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Explain why these coins are being awarded (visible to student in their coin history)..."
                className="rounded-xl text-sm"
              />
            </div>

            <Button
              type="submit"
              disabled={awarding || !selectedUser}
              className="w-full gap-2 bg-brand-500 hover:bg-brand-600 font-bold h-11 rounded-xl shadow-md shadow-brand-500/20"
            >
              {awarding ? <Spinner className="text-white" /> : <Send className="h-4 w-4" />}
              {amount >= 0 ? `Award +${amount} Coins` : `Deduct ${Math.abs(amount)} Coins`}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
