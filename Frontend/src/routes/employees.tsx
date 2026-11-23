import { createFileRoute } from "@tanstack/react-router";
import { RecordsPage } from "@/components/erp/RecordsPage";
export const Route = createFileRoute("/employees")({
  head: () => ({
    meta: [
      { title: "Employees — BuildCore ERP" },
      { name: "description", content: "Manage employees in your BuildCore ERP workspace." },
      { property: "og:title", content: "Employees — BuildCore ERP" },
      { property: "og:description", content: "Manage employees in your BuildCore ERP workspace." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Page,
});
function Page() {
  return <RecordsPage module="employees" />;
}
