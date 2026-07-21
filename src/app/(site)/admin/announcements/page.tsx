"use client";

import { useState } from "react";
import { Megaphone, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Spinner } from "@/components/shared/spinner";
import { useAnnouncements } from "@/lib/hooks";

export default function AdminAnnouncementsPage() {
  const { data, isLoading, refetch } = useAnnouncements();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [priority, setPriority] = useState<"normal" | "important" | "urgent">("normal");
  const [pinned, setPinned] = useState(false);

  const announcements = data?.items ?? [];

  const handleCreate = async () => {
    if (!title || !body) {
      toast.error("Title and body are required.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/admin/content/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data: {
            title,
            body,
            priority,
            pinned,
            published: true,
          },
        }),
      });

      if (!res.ok) throw new Error("Failed to post announcement.");
      toast.success("Announcement posted!");
      setOpen(false);
      setTitle("");
      setBody("");
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error posting announcement.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this announcement?")) return;
    try {
      const res = await fetch(`/api/admin/content/announcements`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error("Failed to delete.");
      toast.success("Announcement deleted.");
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error deleting announcement.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">Announcements</h1>
          <p className="text-muted-foreground">
            Post and manage site announcements for all community members.
          </p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" /> Post Announcement
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Post Announcement</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div>
                <Label>Title *</Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. 30-Day Certification Sprint Started!"
                />
              </div>

              <div>
                <Label>Priority</Label>
                <Select
                  value={priority}
                  onValueChange={(v) => setPriority(v as "normal" | "important" | "urgent")}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Normal (Info)</SelectItem>
                    <SelectItem value="important">Important</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="pinned"
                  checked={pinned}
                  onCheckedChange={(c) => setPinned(Boolean(c))}
                />
                <Label htmlFor="pinned">Pin to top of announcements list</Label>
              </div>

              <div>
                <Label>Announcement Message *</Label>
                <Textarea
                  rows={4}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Write message..."
                />
              </div>

              <Button onClick={handleCreate} disabled={saving} className="w-full gap-2">
                {saving ? <Spinner className="text-white" /> : <Megaphone className="h-4 w-4" />}
                Publish Announcement
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Announcements ({announcements.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Spinner className="h-8 w-8" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Pinned</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {announcements.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell>
                      <div className="font-semibold text-sm">{a.title}</div>
                      <div className="text-xs text-muted-foreground line-clamp-1">{a.body}</div>
                    </TableCell>
                    <TableCell className="capitalize text-sm">{a.priority}</TableCell>
                    <TableCell className="text-sm">{a.pinned ? "Yes" : "No"}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(a.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
