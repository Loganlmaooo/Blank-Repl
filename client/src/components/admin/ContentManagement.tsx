
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { apiRequest } from "@/lib/queryClient";

export default function ContentManagement() {
  const { toast } = useToast();
  const [selectedBackup, setSelectedBackup] = useState<File | null>(null);

  const handleBackupDownload = async () => {
    try {
      const response = await apiRequest("GET", "/api/admin/backup/download");
      const blob = new Blob([JSON.stringify(response, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup_${new Date().toISOString()}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Backup Created",
        description: "Content backup has been downloaded successfully",
      });
    } catch (error) {
      toast({
        title: "Backup Failed",
        description: "Failed to create content backup",
        variant: "destructive",
      });
    }
  };

  const handleRestore = async () => {
    if (!selectedBackup) return;

    try {
      const formData = new FormData();
      formData.append('backup', selectedBackup);

      await apiRequest("POST", "/api/admin/backup/restore", formData);
      
      toast({
        title: "Restore Successful",
        description: "Content has been restored from backup",
      });
    } catch (error) {
      toast({
        title: "Restore Failed",
        description: "Failed to restore from backup",
        variant: "destructive",
      });
    }
  };

  const handleBulkOperation = async (operation: string) => {
    try {
      await apiRequest("POST", `/api/admin/content/${operation}`);
      toast({
        title: "Operation Successful",
        description: `Bulk ${operation} completed successfully`,
      });
    } catch (error) {
      toast({
        title: "Operation Failed",
        description: `Failed to perform bulk ${operation}`,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Content Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Backup & Restore</h3>
              <div className="flex space-x-2">
                <Button onClick={handleBackupDownload}>
                  Download Backup
                </Button>
                <div className="space-y-2">
                  <Input
                    type="file"
                    accept=".json"
                    onChange={(e) => setSelectedBackup(e.target.files?.[0] || null)}
                  />
                  <Button 
                    onClick={handleRestore}
                    disabled={!selectedBackup}
                  >
                    Restore from Backup
                  </Button>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Bulk Operations</h3>
              <div className="flex space-x-2">
                <Button onClick={() => handleBulkOperation('publish')}>
                  Publish All
                </Button>
                <Button onClick={() => handleBulkOperation('unpublish')}>
                  Unpublish All
                </Button>
                <Button onClick={() => handleBulkOperation('archive')}>
                  Archive All
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
