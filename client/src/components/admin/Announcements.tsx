import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { sendAdminActionLog } from "@/lib/discord";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { formatDate } from "@/lib/utils";

interface Announcement {
  id: number;
  title: string;
  content: string;
  category: string;
  isPinned: boolean;
  createdAt: string;
}

export default function Announcements() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("general");
  const [isPinned, setIsPinned] = useState(false);
  
  const [editingId, setEditingId] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // Fetch announcements
  const { data: announcements = [], isLoading } = useQuery({
    queryKey: ['/api/announcements'],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/announcements");
      return res.json();
    },
  });
  
  // Create announcement mutation
  const createMutation = useMutation({
    mutationFn: async (data: Omit<Announcement, 'id' | 'createdAt'>) => {
      const res = await apiRequest("POST", "/api/announcements", data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Announcement Created",
        description: "The announcement has been successfully created",
        variant: "default",
      });
      sendAdminActionLog("Create Announcement", `Created announcement: ${title}`);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ['/api/announcements'] });
    },
    onError: (error) => {
      toast({
        title: "Creation Failed",
        description: `Failed to create announcement: ${error}`,
        variant: "destructive",
      });
    }
  });
  
  // Update announcement mutation
  const updateMutation = useMutation({
    mutationFn: async (data: Partial<Announcement> & { id: number }) => {
      const res = await apiRequest("PATCH", `/api/announcements/${data.id}`, data);
      return res.json();
    },
    onSuccess: (_, variables) => {
      toast({
        title: "Announcement Updated",
        description: "The announcement has been successfully updated",
        variant: "default",
      });
      sendAdminActionLog("Update Announcement", `Updated announcement ID: ${variables.id}`);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ['/api/announcements'] });
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: `Failed to update announcement: ${error}`,
        variant: "destructive",
      });
    }
  });
  
  // Delete announcement mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/announcements/${id}`);
      return res.json();
    },
    onSuccess: (_, id) => {
      toast({
        title: "Announcement Deleted",
        description: "The announcement has been successfully deleted",
        variant: "default",
      });
      sendAdminActionLog("Delete Announcement", `Deleted announcement ID: ${id}`);
      setConfirmDelete(null);
      queryClient.invalidateQueries({ queryKey: ['/api/announcements'] });
    },
    onError: (error) => {
      toast({
        title: "Deletion Failed",
        description: `Failed to delete announcement: ${error}`,
        variant: "destructive",
      });
    }
  });
  
  // Reset form
  const resetForm = () => {
    setTitle("");
    setContent("");
    setCategory("general");
    setIsPinned(false);
    setEditingId(null);
  };
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !content.trim()) {
      toast({
        title: "Missing Fields",
        description: "Please fill out all required fields",
        variant: "destructive",
      });
      return;
    }
    
    if (editingId) {
      updateMutation.mutate({
        id: editingId,
        title,
        content,
        category,
        isPinned,
      });
    } else {
      createMutation.mutate({
        title,
        content,
        category,
        isPinned,
      });
    }
  };
  
  // Handle edit
  const handleEdit = (announcement: Announcement) => {
    setEditingId(announcement.id);
    setTitle(announcement.title);
    setContent(announcement.content);
    setCategory(announcement.category);
    setIsPinned(announcement.isPinned);
    
    // Scroll to form
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };
  
  // Cancel editing
  const cancelEditing = () => {
    resetForm();
  };
  
  // Get category badge style
  const getCategoryBadgeStyle = (category: string) => {
    const styles: Record<string, string> = {
      event: "bg-primary text-black",
      stream: "bg-blue-500",
      important: "bg-red-500",
      general: "bg-purple-500",
    };
    
    return styles[category] || "bg-gray-500";
  };
  
  return (
    <div className="space-y-6 animate-fadeIn">
      <h2 className="text-2xl font-bold mb-6 text-primary">Manage Announcements</h2>
      
      {/* Create/Edit Form */}
      <Card className="glass">
        <CardContent className="pt-6">
          <h3 className="text-lg font-bold mb-4">
            {editingId ? "Edit Announcement" : "Create New Announcement"}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="title" className="text-gray-300">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="bg-zinc-900 border-primary/30 text-white focus:border-primary"
                placeholder="Announcement title"
                disabled={createMutation.isPending || updateMutation.isPending}
              />
            </div>
            
            <div>
              <Label htmlFor="category" className="text-gray-300">Category</Label>
              <Select 
                value={category} 
                onValueChange={setCategory}
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                <SelectTrigger className="bg-zinc-900 border-primary/30 text-white focus:border-primary">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-primary/30">
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="stream">Stream Update</SelectItem>
                  <SelectItem value="event">Special Event</SelectItem>
                  <SelectItem value="important">Important</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="content" className="text-gray-300">Content</Label>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="bg-zinc-900 border-primary/30 text-white focus:border-primary"
                placeholder="Announcement content..."
                rows={4}
                disabled={createMutation.isPending || updateMutation.isPending}
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isPinned"
                checked={isPinned}
                onCheckedChange={(checked) => setIsPinned(checked === true)}
                disabled={createMutation.isPending || updateMutation.isPending}
              />
              <Label htmlFor="isPinned" className="text-gray-300">Pin this announcement</Label>
            </div>
            
            <div className="flex space-x-2">
              <Button
                type="submit"
                className="gold-gradient text-black font-bold hover:opacity-90"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {createMutation.isPending || updateMutation.isPending ? (
                  <span className="flex items-center">
                    <i className="fas fa-circle-notch fa-spin mr-2"></i>
                    {editingId ? "Updating..." : "Creating..."}
                  </span>
                ) : (
                  <span>{editingId ? "Update Announcement" : "Post Announcement"}</span>
                )}
              </Button>
              
              {editingId && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={cancelEditing}
                  className="border-gray-500 text-gray-400 hover:bg-gray-800"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
      
      {/* Existing Announcements */}
      <Card className="glass">
        <CardContent className="pt-6">
          <h3 className="text-lg font-bold mb-4">Existing Announcements</h3>
          
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
            </div>
          ) : announcements.length === 0 ? (
            <div className="bg-zinc-900 rounded-lg p-8 text-center">
              <i className="fas fa-bullhorn text-4xl text-gray-500 mb-4"></i>
              <h4 className="text-xl font-bold text-white mb-2">No Announcements Yet</h4>
              <p className="text-gray-400 mb-4">Create your first announcement to get started</p>
              <Button
                className="gold-gradient text-black font-bold hover:opacity-90"
                onClick={() => document.getElementById("title")?.focus()}
              >
                Create Announcement
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {announcements.map((announcement: Announcement) => (
                <div key={announcement.id} className="p-4 bg-zinc-900 rounded-lg border border-primary/30 hover-gold">
                  <div className="flex justify-between mb-2">
                    <div className="flex items-center">
                      {announcement.isPinned && (
                        <span className="text-primary mr-2"><i className="fas fa-thumbtack"></i></span>
                      )}
                      <span className="font-bold">{announcement.title}</span>
                    </div>
                    <Badge className={getCategoryBadgeStyle(announcement.category)}>
                      {announcement.category}
                    </Badge>
                  </div>
                  <p className="text-gray-300 text-sm mb-3">{announcement.content}</p>
                  <div className="flex justify-between items-center text-xs text-gray-400">
                    <span>Posted: {formatDate(announcement.createdAt)}</span>
                    <div className="space-x-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-blue-400 hover:text-blue-300 h-7 px-2"
                        onClick={() => handleEdit(announcement)}
                      >
                        <i className="fas fa-edit mr-1"></i> Edit
                      </Button>
                      
                      {confirmDelete === announcement.id ? (
                        <span className="inline-flex items-center">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-500 hover:text-red-400 h-7 px-2"
                            onClick={() => deleteMutation.mutate(announcement.id)}
                            disabled={deleteMutation.isPending}
                          >
                            {deleteMutation.isPending ? (
                              <i className="fas fa-circle-notch fa-spin mr-1"></i>
                            ) : (
                              <i className="fas fa-check mr-1"></i>
                            )}
                            Confirm
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-gray-400 hover:text-gray-300 h-7 px-2"
                            onClick={() => setConfirmDelete(null)}
                            disabled={deleteMutation.isPending}
                          >
                            <i className="fas fa-times mr-1"></i> Cancel
                          </Button>
                        </span>
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-400 hover:text-red-300 h-7 px-2"
                          onClick={() => setConfirmDelete(announcement.id)}
                        >
                          <i className="fas fa-trash mr-1"></i> Delete
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
