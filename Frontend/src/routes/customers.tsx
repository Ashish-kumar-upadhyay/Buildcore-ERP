import { createFileRoute } from "@tanstack/react-router";
import { RecordsPage } from "@/components/erp/RecordsPage";
export const Route = createFileRoute("/customers")({
  head: () => ({
    meta: [
      { title: "Customers — BuildCore ERP" },
      { name: "description", content: "Manage customers in your BuildCore ERP workspace." },
      { property: "og:title", content: "Customers — BuildCore ERP" },
      { property: "og:description", content: "Manage customers in your BuildCore ERP workspace." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Page,
});
function Page() {
  return <RecordsPage module="customers" />;
}
