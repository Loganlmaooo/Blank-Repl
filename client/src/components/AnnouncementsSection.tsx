import { useEffect, useState } from "react";
import { Announcement } from "@/shared/schema";
import { apiRequest } from "@/lib/queryClient";

export default function AnnouncementsSection() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const res = await apiRequest("GET", "/api/announcements");
        const data = await res.json();
        // Only show non-default announcements
        const realAnnouncements = data.filter((a: Announcement) => !a.isDefault);
        setAnnouncements(realAnnouncements);
      } catch (error) {
        console.error("Error fetching announcements:", error);
      }
    };

    fetchAnnouncements();
  }, []);

  if (announcements.length === 0) {
    return null;
  }

  return (
    <section id="announcements" className="py-20">
      <div className="container mx-auto px-4">
        <h2 className="text-4xl font-bold text-center mb-12 text-primary">Announcements</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {announcements.map((announcement) => (
            <div 
              key={announcement.id}
              className="bg-zinc-900/50 border border-primary/10 rounded-lg p-6 hover:border-primary/20 transition-colors"
            >
              <h3 className="text-xl font-bold mb-2 text-primary">{announcement.title}</h3>
              <p className="text-gray-300">{announcement.content}</p>
              <div className="mt-4 flex items-center justify-between text-sm text-gray-400">
                <span>{new Date(announcement.createdAt).toLocaleDateString()}</span>
                <span className="capitalize">{announcement.category}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}