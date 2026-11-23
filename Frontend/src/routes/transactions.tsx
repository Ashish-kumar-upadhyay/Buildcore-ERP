import { createFileRoute } from "@tanstack/react-router";
import { RecordsPage } from "@/components/erp/RecordsPage";
export const Route = createFileRoute("/transactions")({
  head: () => ({
    meta: [
      { title: "Stock history — BuildCore ERP" },
      { name: "description", content: "Manage stock history in your BuildCore ERP workspace." },
      { property: "og:title", content: "Stock history — BuildCore ERP" },
      {
        property: "og:description",
        content: "Manage stock history in your BuildCore ERP workspace.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Page,
});
function Page() {
  return <RecordsPage module="transactions" />;
}
