import { createFileRoute } from "@tanstack/react-router";
import { RecordsPage } from "@/components/erp/RecordsPage";
export const Route = createFileRoute("/expenses")({
  head: () => ({
    meta: [
      { title: "Expenses — BuildCore ERP" },
      { name: "description", content: "Manage expenses in your BuildCore ERP workspace." },
      { property: "og:title", content: "Expenses — BuildCore ERP" },
      { property: "og:description", content: "Manage expenses in your BuildCore ERP workspace." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Page,
});
function Page() {
  return <RecordsPage module="expenses" />;
}
