import { createFileRoute } from "@tanstack/react-router";
import { RecordsPage } from "@/components/erp/RecordsPage";
export const Route = createFileRoute("/leads")({
  head: () => ({
    meta: [
      { title: "Leads — BuildCore ERP" },
      { name: "description", content: "Manage leads in your BuildCore ERP workspace." },
      { property: "og:title", content: "Leads — BuildCore ERP" },
      { property: "og:description", content: "Manage leads in your BuildCore ERP workspace." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Page,
});
function Page() {
  return <RecordsPage module="leads" />;
}
