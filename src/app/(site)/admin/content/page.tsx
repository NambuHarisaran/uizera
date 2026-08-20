"use client";

import { useState } from "react";
import { Camera, Calendar, FileText, Plus, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Spinner } from "@/components/shared/spinner";
import { EmptyState } from "@/components/shared/empty-state";
import { useEvents, useResources, useTeam, useGallery } from "@/lib/hooks";

export default function AdminContentPage() {
  const [tab, setTab] = useState("events");
  const { data: eventsData, isLoading: eventsLoading, refetch: refetchEvents } = useEvents();
  const { data: resourcesData, isLoading: resourcesLoading, refetch: refetchResources } = useResources();
  const { data: teamData, isLoading: teamLoading, refetch: refetchTeam } = useTeam();
  const { data: galleryData, isLoading: galleryLoading, refetch: refetchGallery } = useGallery();

  // Event modal state
  const [eventOpen, setEventOpen] = useState(false);
  const [eventTitle, setEventTitle] = useState("");
  const [eventDesc, setEventDesc] = useState("");
  const [eventVenue, setEventVenue] = useState("");

  const handleCreateEvent = async () => {
    try {
      const res = await fetch("/api/admin/content/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data: {
            title: eventTitle,
            description: eventDesc,
            date: Date.now(),
            venue: eventVenue || "PSNACET Campus",
            published: true,
            speakers: [],
          },
        }),
      });
      if (!res.ok) throw new Error("Failed to create event");
      toast.success("Event created!");
      setEventOpen(false);
      setEventTitle("");
      setEventDesc("");
      setEventVenue("");
      refetchEvents();

    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error creating event.");
    }
  };

  const handleDeleteItem = async (collection: string, id: string) => {
    if (!confirm("Delete this item?")) return;
    try {
      const res = await fetch(`/api/admin/content/${collection}?id=${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete.");
      toast.success("Item deleted.");
      if (collection === "events") refetchEvents();
      if (collection === "resources") refetchResources();
      if (collection === "team") refetchTeam();
      if (collection === "gallery") refetchGallery();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error deleting item.");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Content Management</h1>
        <p className="text-muted-foreground">
          Manage public site content including events, learning resources, team profiles, and gallery.
        </p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="events">Events</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
          <TabsTrigger value="team">Team Members</TabsTrigger>
          <TabsTrigger value="gallery">Gallery</TabsTrigger>
        </TabsList>

        <TabsContent value="events" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Events</CardTitle>
              <Dialog open={eventOpen} onOpenChange={setEventOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-2">
                    <Plus className="h-4 w-4" /> Add Event
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Event</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-2">
                    <div>
                      <Label>Title</Label>
                      <Input
                        value={eventTitle}
                        onChange={(e) => setEventTitle(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Venue</Label>
                      <Input
                        value={eventVenue}
                        onChange={(e) => setEventVenue(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Description</Label>
                      <Textarea
                        value={eventDesc}
                        onChange={(e) => setEventDesc(e.target.value)}
                        rows={3}
                      />
                    </div>
                    <Button onClick={handleCreateEvent} className="w-full">
                      Create Event
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {eventsLoading ? (
                <div className="flex justify-center py-12">
                  <Spinner className="h-8 w-8" />
                </div>
              ) : !eventsData?.events?.length ? (
                <EmptyState icon={Calendar} title="No events yet" description="Add one to get started." />
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Venue</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {eventsData.events.map((e: any) => (
                        <TableRow key={e.id}>
                          <TableCell className="max-w-[16rem] truncate font-semibold" title={e.title}>
                            {e.title}
                          </TableCell>
                          <TableCell className="max-w-[10rem] truncate">{e.venue || "—"}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              aria-label={`Delete event ${e.title}`}
                              onClick={() => handleDeleteItem("events", e.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
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

        <TabsContent value="resources" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Resources</CardTitle>
            </CardHeader>
            <CardContent>
              {resourcesLoading ? (
                <div className="flex justify-center py-12">
                  <Spinner className="h-8 w-8" />
                </div>
              ) : !resourcesData?.items?.length ? (
                <EmptyState icon={FileText} title="No resources yet" description="Add one to get started." />
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {resourcesData.items.map((r: any) => (
                        <TableRow key={r.id}>
                          <TableCell className="max-w-[16rem] truncate font-semibold" title={r.title}>
                            {r.title}
                          </TableCell>
                          <TableCell className="max-w-[10rem] truncate">{r.category}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              aria-label={`Delete resource ${r.title}`}
                              onClick={() => handleDeleteItem("resources", r.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
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

        <TabsContent value="team" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Team Members</CardTitle>
            </CardHeader>
            <CardContent>
              {teamLoading ? (
                <div className="flex justify-center py-12">
                  <Spinner className="h-8 w-8" />
                </div>
              ) : !teamData?.items?.length ? (
                <EmptyState icon={Users} title="No team members yet" description="Add one to get started." />
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Section</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {teamData.items.map((m: any) => (
                        <TableRow key={m.id}>
                          <TableCell className="max-w-[12rem] truncate font-semibold" title={m.name}>
                            {m.name}
                          </TableCell>
                          <TableCell className="max-w-[10rem] truncate">{m.role}</TableCell>
                          <TableCell>{m.section}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              aria-label={`Delete team member ${m.name}`}
                              onClick={() => handleDeleteItem("team", m.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
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

        <TabsContent value="gallery" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Gallery Images</CardTitle>
            </CardHeader>
            <CardContent>
              {galleryLoading ? (
                <div className="flex justify-center py-12">
                  <Spinner className="h-8 w-8" />
                </div>
              ) : !galleryData?.items?.length ? (
                <EmptyState icon={Camera} title="No gallery images yet" description="Add one to get started." />
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Caption</TableHead>
                        <TableHead>Event</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {galleryData.items.map((g: any) => (
                        <TableRow key={g.id}>
                          <TableCell className="max-w-[16rem] truncate font-semibold" title={g.caption || "Image"}>
                            {g.caption || "Image"}
                          </TableCell>
                          <TableCell className="max-w-[10rem] truncate">{g.event || "—"}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              aria-label={`Delete gallery image ${g.caption || "Image"}`}
                              onClick={() => handleDeleteItem("gallery", g.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
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
      </Tabs>
    </div>
  );
}
