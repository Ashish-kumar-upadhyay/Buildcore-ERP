import { createFileRoute } from "@tanstack/react-router";
import { RecordsPage } from "@/components/erp/RecordsPage";
export const Route = createFileRoute("/attendance")({
  head: () => ({
    meta: [
      { title: "Attendance — BuildCore ERP" },
      { name: "description", content: "Manage attendance in your BuildCore ERP workspace." },
      { property: "og:title", content: "Attendance — BuildCore ERP" },
      { property: "og:description", content: "Manage attendance in your BuildCore ERP workspace." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Page,
});
function Page() {
  return <RecordsPage module="attendance" />;
}
