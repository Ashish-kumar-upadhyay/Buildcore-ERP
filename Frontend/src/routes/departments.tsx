import { createFileRoute } from "@tanstack/react-router";
import { RecordsPage } from "@/components/erp/RecordsPage";
export const Route = createFileRoute("/departments")({
  head: () => ({
    meta: [
      { title: "Departments — BuildCore ERP" },
      { name: "description", content: "Manage departments in your BuildCore ERP workspace." },
      { property: "og:title", content: "Departments — BuildCore ERP" },
      {
        property: "og:description",
        content: "Manage departments in your BuildCore ERP workspace.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Page,
});
function Page() {
  return <RecordsPage module="departments" />;
}
