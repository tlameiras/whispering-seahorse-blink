"use client";

import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Edit, Brain, CalendarDays, Hash, ListChecks, Lightbulb } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface Suggestion {
  id: string;
  text: string;
  example?: string;
  ticked: boolean;
}

interface UserStory {
  id: string;
  title: string;
  description: string;
  status: string;
  feature_epic?: string;
  sprint?: string;
  story_points?: number;
  acceptance_criteria: Suggestion[];
  created_at: string;
  updated_at: string;
}

const UserStoryDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [story, setStory] = useState<UserStory | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      navigate("/user-story-manager");
      return;
    }

    const fetchStory = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("user_stories")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        toast.error("Failed to load user story details.");
        console.error("Error fetching story details:", error);
        navigate("/user-story-manager");
      } else if (data) {
        setStory(data as UserStory);
      }
      setLoading(false);
    };
    fetchStory();
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="container mx-auto p-6 max-w-4xl text-center">
        <p>Loading user story details...</p>
      </div>
    );
  }

  if (!story) {
    return (
      <div className="container mx-auto p-6 max-w-4xl text-center">
        <p>User story not found.</p>
        <Button onClick={() => navigate("/user-story-manager")} className="mt-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Manager
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <Button variant="ghost" onClick={() => navigate("/user-story-manager")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Stories
        </Button>
        <div className="space-x-2">
          <Button variant="outline" onClick={() => toast.info("Poker Planning feature coming soon!")} disabled>
            <Brain className="mr-2 h-4 w-4" /> Poker Planning
          </Button>
          <Link to={`/user-story-manager/${story.id}/edit`}>
            <Button>
              <Edit className="mr-2 h-4 w-4" /> Edit Story
            </Button>
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-4xl font-extrabold mb-2">{story.title}</CardTitle>
          <div className="flex items-center space-x-2">
            <Badge variant="secondary">{story.status}</Badge>
            {story.story_points && <Badge variant="outline">{story.story_points} Story Points</Badge>}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="text-xl font-semibold mb-2">Description</h3>
            <p className="text-muted-foreground whitespace-pre-wrap">{story.description}</p>
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-xl font-semibold mb-2">Details</h3>
              <div className="space-y-2 text-muted-foreground">
                {story.feature_epic && (
                  <p className="flex items-center">
                    <Lightbulb className="mr-2 h-4 w-4" /> <strong>Feature/Epic:</strong> {story.feature_epic}
                  </p>
                )}
                {story.sprint && (
                  <p className="flex items-center">
                    <Hash className="mr-2 h-4 w-4" /> <strong>Sprint:</strong> {story.sprint}
                  </p>
                )}
                <p className="flex items-center">
                  <CalendarDays className="mr-2 h-4 w-4" /> <strong>Created:</strong> {format(new Date(story.created_at), "PPP")}
                </p>
                <p className="flex items-center">
                  <CalendarDays className="mr-2 h-4 w-4" /> <strong>Last Updated:</strong> {format(new Date(story.updated_at), "PPP")}
                </p>
              </div>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">Acceptance Criteria</h3>
              {story.acceptance_criteria && story.acceptance_criteria.length > 0 ? (
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  {story.acceptance_criteria.map((criteria, index) => (
                    <li key={criteria.id || index} className={criteria.ticked ? "line-through text-gray-500" : ""}>
                      {criteria.text}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground">No acceptance criteria defined.</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserStoryDetail;