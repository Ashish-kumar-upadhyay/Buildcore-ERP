import { createFileRoute } from "@tanstack/react-router";
import { RecordsPage } from "@/components/erp/RecordsPage";
export const Route = createFileRoute("/purchases")({
  head: () => ({
    meta: [
      { title: "Purchase orders — BuildCore ERP" },
      { name: "description", content: "Manage purchase orders in your BuildCore ERP workspace." },
      { property: "og:title", content: "Purchase orders — BuildCore ERP" },
      {
        property: "og:description",
        content: "Manage purchase orders in your BuildCore ERP workspace.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Page,
});
function Page() {
  return <RecordsPage module="purchases" />;
}
