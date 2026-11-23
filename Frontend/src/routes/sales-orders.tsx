import { createFileRoute } from "@tanstack/react-router";
import { RecordsPage } from "@/components/erp/RecordsPage";
export const Route = createFileRoute("/sales-orders")({
  head: () => ({
    meta: [
      { title: "Sales orders — BuildCore ERP" },
      { name: "description", content: "Manage sales orders in your BuildCore ERP workspace." },
      { property: "og:title", content: "Sales orders — BuildCore ERP" },
      {
        property: "og:description",
        content: "Manage sales orders in your BuildCore ERP workspace.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Page,
});
function Page() {
  return <RecordsPage module="sales-orders" />;
}
