import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Bell, CheckCheck, Boxes, Users, TrendingUp, Trash2, Inbox } from "lucide-react";
import { motion } from "framer-motion";
import { AppShell, Pill } from "@/components/erp/AppShell";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";

type Note = {
  id: string;
  title: string;
  user: string;
  date: string;
  status: string;
  category: string;
};
export const Route = createFileRoute("/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications — BuildCore ERP" },
      { name: "description", content: "Inventory alerts, team updates and sales notifications." },
      { property: "og:title", content: "Notifications — BuildCore ERP" },
      {
        property: "og:description",
        content: "Inventory alerts, team updates and sales notifications.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Notifications,
});
function Notifications() {
  const [items, setItems] = useState<Note[]>([]);
  const [filter, setFilter] = useState("All");
  useEffect(() => {
    let live = true;
    api<{ rows: Note[] }>("/records/notifications")
      .then((data) => {
        if (live) setItems(data.rows);
      })
      .catch((error: unknown) => {
        toast.error(error instanceof Error ? error.message : "Unable to load notifications");
      });
    return () => {
      live = false;
    };
  }, []);
  const shown = items.filter((i) => filter === "All" || i["status"] === filter);
  return (
    <AppShell
      title="Notifications"
      subtitle={`${items.filter((i) => i["status"] === "Unread").length} unread updates`}
      actions={
        <Button
          className="erp-primary"
          onClick={() => {
            void (async () => {
              try {
                const data = await api<{ rows: Note[] }>("/notifications/read-all", { method: "POST" });
                setItems(data.rows);
              } catch (error) {
                toast.error(error instanceof Error ? error.message : "Unable to update notifications");
              }
            })();
          }}
        >
          <CheckCheck />
          Mark all read
        </Button>
      }
    >
      <div className="mb-5 flex gap-2">
        {["All", "Unread", "Read"].map((s) => (
          <Button
            key={s}
            variant={filter === s ? "default" : "outline"}
            onClick={() => setFilter(s)}
          >
            {s}
          </Button>
        ))}
      </div>
      <div className="erp-notifications">
        {shown.map((i) => {
          const Icon =
            i["category"] === "Inventory" ? Boxes : i["category"] === "HR" ? Users : TrendingUp;
          return (
            <motion.article layout key={i.id} className="erp-notification">
              <div className="erp-notification-icon">
                <Icon />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-semibold">{i["title"]}</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  {i["user"]} · {i["date"]}
                </p>
              </div>
              <Pill tone={i["status"] === "Unread" ? "primary" : "muted"}>{i["status"]}</Pill>
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Mark ${i.id} read`}
                title="Mark read"
                disabled={i["status"] === "Read"}
                onClick={() => {
                  void (async () => {
                    try {
                      const data = await api<{ row: Note }>(`/records/notifications/${i.id}/status`, {
                        method: "PATCH",
                        body: JSON.stringify({ status: "Read" }),
                      });
                      setItems((old) => old.map((n) => (n.id === i.id ? data.row : n)));
                    } catch (error) {
                      toast.error(error instanceof Error ? error.message : "Unable to update notification");
                    }
                  })();
                }}
              >
                <CheckCheck />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Delete ${i.id}`}
                title="Delete notification"
                onClick={() => {
                  void (async () => {
                    try {
                      await api(`/records/notifications/${i.id}`, { method: "DELETE" });
                      setItems((old) => old.filter((n) => n.id !== i.id));
                    } catch (error) {
                      toast.error(error instanceof Error ? error.message : "Unable to delete notification");
                    }
                  })();
                }}
              >
                <Trash2 />
              </Button>
            </motion.article>
          );
        })}
        {!shown.length && (
          <div className="erp-empty">
            <Inbox />
            <h3>All caught up</h3>
            <p>No notifications here.</p>
          </div>
        )}
      </div>
    </AppShell>
  );
}
