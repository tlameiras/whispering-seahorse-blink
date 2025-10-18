"use client";

import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import StoryAssistant from "@/components/StoryAssistant";
import { ArrowLeft } from "lucide-react";

interface Suggestion {
  id: string;
  text: string;
  example?: string;
  ticked: boolean;
}

const formSchema = z.object({
  title: z.string().min(1, "Title is required."),
  description: z.string().min(1, "Description is required."),
  status: z.string().min(1, "Status is required."),
  feature_epic: z.string().optional(),
  sprint: z.string().optional(),
  story_points: z.preprocess(
    (val) => (val === "" ? null : Number(val)),
    z.number().int().min(0).optional().nullable(),
  ),
  acceptance_criteria: z.array(z.object({
    id: z.string(),
    text: z.string(),
    example: z.string().optional(),
    ticked: z.boolean(),
  })).optional(),
});

type UserStoryFormValues = z.infer<typeof formSchema>;

const UserStoryForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = !!id;

  const form = useForm<UserStoryFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      status: "Draft",
      feature_epic: "",
      sprint: "",
      story_points: null,
      acceptance_criteria: [],
    },
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isEditing) {
      setLoading(true);
      const fetchStory = async () => {
        const { data, error } = await supabase
          .from("user_stories")
          .select("*")
          .eq("id", id)
          .single();

        if (error) {
          toast.error("Failed to load user story.");
          console.error("Error fetching story:", error);
          navigate("/user-story-manager");
        } else if (data) {
          form.reset({
            ...data,
            story_points: data.story_points || null,
            acceptance_criteria: data.acceptance_criteria || [],
          });
        }
        setLoading(false);
      };
      fetchStory();
    }
  }, [id, isEditing, navigate, form]);

  const onSubmit = async (values: UserStoryFormValues) => {
    setLoading(true);
    const user = await supabase.auth.getUser();
    if (!user.data.user) {
      toast.error("You must be logged in to save a story.");
      setLoading(false);
      return;
    }

    const payload = {
      ...values,
      user_id: user.data.user.id,
      story_points: values.story_points === null ? undefined : values.story_points, // Supabase handles null for optional int
    };

    if (isEditing) {
      const { error } = await supabase
        .from("user_stories")
        .update(payload)
        .eq("id", id);

      if (error) {
        toast.error("Failed to update user story.");
        console.error("Error updating story:", error);
      } else {
        toast.success("User story updated successfully!");
        navigate(`/user-story-manager/${id}`);
      }
    } else {
      const { error } = await supabase
        .from("user_stories")
        .insert(payload);

      if (error) {
        toast.error("Failed to create user story.");
        console.error("Error creating story:", error);
      } else {
        toast.success("User story created successfully!");
        navigate("/user-story-manager");
      }
    }
    setLoading(false);
  };

  const handleStoryAssistantUpdate = (newStory: string, newAcceptanceCriteria: Suggestion[]) => {
    form.setValue("description", newStory);
    form.setValue("acceptance_criteria", newAcceptanceCriteria);
  };

  const handleStoryPointsUpdate = (points: number) => {
    form.setValue("story_points", points);
  };

  if (loading && isEditing) {
    return (
      <div className="container mx-auto p-6 max-w-4xl text-center">
        <p>Loading story...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="flex items-center mb-6">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mr-2">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-bold">{isEditing ? "Edit User Story" : "Create New User Story"}</h1>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 lg:grid lg:grid-cols-2 lg:gap-8">
          <div className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="As a user, I want..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe the user story in detail..."
                      rows={10}
                      className="bg-[var(--textarea-bg-intermediate)]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="bg-card">
                        <SelectValue placeholder="Select a status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Draft">Draft</SelectItem>
                      <SelectItem value="Ready">Ready</SelectItem>
                      <SelectItem value="In Progress">In Progress</SelectItem>
                      <SelectItem value="Done">Done</SelectItem>
                      <SelectItem value="Archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="feature_epic"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Feature/Epic</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., User Authentication" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="sprint"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sprint</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Sprint 1" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="story_points"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Story Points</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="e.g., 5" {...field} value={field.value === null ? "" : field.value} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : isEditing ? "Update Story" : "Create Story"}
            </Button>
          </div>
          <div className="space-y-6">
            <StoryAssistant
              storyText={form.watch("description")}
              acceptanceCriteria={form.watch("acceptance_criteria") || []}
              onStoryUpdate={handleStoryAssistantUpdate}
              onStoryPointsUpdate={handleStoryPointsUpdate}
            />
          </div>
        </form>
      </Form>
    </div>
  );
};

export default UserStoryForm;