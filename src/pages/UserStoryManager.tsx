"use client";

import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Filter, ArrowUpNarrowWide, ArrowDownNarrowWide, ExternalLink, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface UserStory {
  id: string;
  title: string;
  description: string;
  status: string;
  feature_epic?: string;
  sprint?: string;
  story_points?: number;
  created_at: string;
  updated_at: string;
}

const UserStoryManager: React.FC = () => {
  const navigate = useNavigate();
  const [stories, setStories] = useState<UserStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterFeatureEpic, setFilterFeatureEpic] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const fetchStories = async () => {
    setLoading(true);
    const user = await supabase.auth.getUser();
    if (!user.data.user) {
      toast.error("You must be logged in to view user stories.");
      setLoading(false);
      return;
    }

    let query = supabase
      .from("user_stories")
      .select("*")
      .eq("user_id", user.data.user.id);

    if (filterStatus !== "all") {
      query = query.eq("status", filterStatus);
    }
    if (filterFeatureEpic) {
      query = query.ilike("feature_epic", `%${filterFeatureEpic}%`);
    }

    query = query.order(sortBy, { ascending: sortOrder === "asc" });

    const { data, error } = await query;

    if (error) {
      toast.error("Failed to fetch user stories.");
      console.error("Error fetching stories:", error);
    } else {
      setStories(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchStories();
  }, [filterStatus, filterFeatureEpic, sortBy, sortOrder]);

  const handleDeleteStory = async (storyId: string) => {
    setLoading(true);
    const { error } = await supabase
      .from("user_stories")
      .delete()
      .eq("id", storyId);

    if (error) {
      toast.error("Failed to delete user story.");
      console.error("Error deleting story:", error);
    } else {
      toast.success("User story deleted successfully!");
      fetchStories(); // Re-fetch stories after deletion
    }
    setLoading(false);
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">User Story Manager</h1>
        <div className="space-x-4">
          <Button onClick={() => navigate("/user-story-manager/new")}>
            <Plus className="mr-2 h-4 w-4" /> Create New Story
          </Button>
          <Button variant="outline" disabled>
            <ExternalLink className="mr-2 h-4 w-4" /> Import from JIRA
          </Button>
        </div>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="mr-2 h-5 w-5" /> Filters & Sorting
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <div>
            <label htmlFor="filter-status" className="block text-sm font-medium text-muted-foreground mb-1">
              Status
            </label>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger id="filter-status" className="bg-card">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="Draft">Draft</SelectItem>
                <SelectItem value="Ready">Ready</SelectItem>
                <SelectItem value="In Progress">In Progress</SelectItem>
                <SelectItem value="Done">Done</SelectItem>
                <SelectItem value="Archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label htmlFor="filter-feature" className="block text-sm font-medium text-muted-foreground mb-1">
              Feature/Epic
            </label>
            <Input
              id="filter-feature"
              placeholder="Filter by Feature/Epic"
              value={filterFeatureEpic}
              onChange={(e) => setFilterFeatureEpic(e.target.value)}
              className="bg-card"
            />
          </div>
          <div>
            <label htmlFor="sort-by" className="block text-sm font-medium text-muted-foreground mb-1">
              Sort By
            </label>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger id="sort-by" className="bg-card">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created_at">Creation Date</SelectItem>
                <SelectItem value="title">Title</SelectItem>
                <SelectItem value="status">Status</SelectItem>
                <SelectItem value="story_points">Story Points</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label htmlFor="sort-order" className="block text-sm font-medium text-muted-foreground mb-1">
              Order
            </label>
            <Select value={sortOrder} onValueChange={(value: "asc" | "desc") => setSortOrder(value)}>
              <SelectTrigger id="sort-order" className="bg-card">
                <SelectValue placeholder="Sort order" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="desc">
                  <ArrowDownNarrowWide className="inline-block mr-2 h-4 w-4" /> Descending
                </SelectItem>
                <SelectItem value="asc">
                  <ArrowUpNarrowWide className="inline-block mr-2 h-4 w-4" /> Ascending
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <p className="text-center text-lg">Loading user stories...</p>
      ) : stories.length === 0 ? (
        <p className="text-center text-lg">No user stories found. Create one to get started!</p>
      ) : (
        <div className="overflow-x-auto border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Feature/Epic</TableHead>
                <TableHead>Sprint</TableHead>
                <TableHead className="text-right">Points</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stories.map((story) => (
                <TableRow key={story.id}>
                  <TableCell className="font-medium">
                    <Link to={`/user-story-manager/${story.id}`} className="hover:underline text-primary">
                      {story.title}
                    </Link>
                  </TableCell>
                  <TableCell>{story.status}</TableCell>
                  <TableCell>{story.feature_epic || "N/A"}</TableCell>
                  <TableCell>{story.sprint || "N/A"}</TableCell>
                  <TableCell className="text-right">{story.story_points || "-"}</TableCell>
                  <TableCell className="text-right">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete your user story
                            and remove its data from our servers.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeleteStory(story.id)}>Continue</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default UserStoryManager;