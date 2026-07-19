"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Shield, ShieldAlert, UserCheck, UserX } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/shared/spinner";
import { useAdminUsers } from "@/lib/hooks";
import { useAuth } from "@/components/providers/auth-provider";
import { formatCoins, initials } from "@/lib/utils";
import type { AppUser, Role } from "@/types";

export default function AdminUsersPage() {
  const { user: currentUser } = useAuth();
  const { data, isLoading, refetch } = useAdminUsers();
  const [search, setSearch] = useState("");
  const [updatingUid, setUpdatingUid] = useState<string | null>(null);

  const users = data?.users ?? [];

  const filteredUsers = users.filter((u) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      u.displayName?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.department?.toLowerCase().includes(q) ||
      u.regNo?.toLowerCase().includes(q)
    );
  });

  const handleRoleChange = async (uid: string, newRole: Role) => {
    setUpdatingUid(uid);
    try {
      const res = await fetch(`/api/admin/users/${uid}/role`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? "Failed to update role.");
      }
      toast.success("User role updated!");
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error updating role.");
    } finally {
      setUpdatingUid(null);
    }
  };

  const handleStatusToggle = async (uid: string, currentDisabled: boolean) => {
    setUpdatingUid(uid);
    try {
      const res = await fetch(`/api/admin/users/${uid}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ disabled: !currentDisabled }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? "Failed to update status.");
      }
      toast.success(currentDisabled ? "User account enabled" : "User account disabled");
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error updating user status.");
    } finally {
      setUpdatingUid(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">User Management</h1>
        <p className="text-muted-foreground">
          View member accounts, update roles, or disable/enable access.
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>All Users ({filteredUsers.length})</CardTitle>
          <div className="relative max-w-xs flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Spinner className="h-8 w-8" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Dept / Year</TableHead>
                    <TableHead>Coins</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((u) => {
                    const isSelf = u.uid === currentUser?.uid;
                    const isSuperAdmin = u.role === "super_admin";
                    const isBusy = updatingUid === u.uid;

                    return (
                      <TableRow key={u.uid}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9">
                              <AvatarImage src={u.photoURL ?? undefined} alt={u.displayName} />
                              <AvatarFallback>{initials(u.displayName)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-sm">{u.displayName}</p>
                              <p className="text-xs text-muted-foreground">{u.email}</p>
                            </div>
                          </div>
                        </TableCell>

                        <TableCell className="text-sm">
                          {u.department ? (
                            <span>
                              {u.department} {u.year ? `· Year ${u.year}` : ""}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>

                        <TableCell className="text-sm font-semibold text-amber-500">
                          {formatCoins(u.coins ?? 0)}
                        </TableCell>

                        <TableCell>
                          {isSuperAdmin ? (
                            <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/30">
                              <Shield className="mr-1 h-3 w-3" /> Super Admin
                            </Badge>
                          ) : (
                            <Select
                              disabled={isSelf || isBusy}
                              value={u.role}
                              onValueChange={(val) => handleRoleChange(u.uid, val as Role)}
                            >
                              <SelectTrigger className="h-8 w-28 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="student">Student</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        </TableCell>

                        <TableCell>
                          {u.disabled ? (
                            <Badge variant="destructive">Disabled</Badge>
                          ) : (
                            <Badge variant="outline" className="text-emerald-600 border-emerald-500/30">
                              Active
                            </Badge>
                          )}
                        </TableCell>

                        <TableCell className="text-right">
                          {!isSelf && !isSuperAdmin && (
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={isBusy}
                              onClick={() => handleStatusToggle(u.uid, u.disabled)}
                              className={u.disabled ? "text-emerald-600" : "text-destructive"}
                            >
                              {u.disabled ? (
                                <>
                                  <UserCheck className="mr-1.5 h-4 w-4" /> Enable
                                </>
                              ) : (
                                <>
                                  <UserX className="mr-1.5 h-4 w-4" /> Disable
                                </>
                              )}
                            </Button>
                          )}
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
