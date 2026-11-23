import { createFileRoute } from "@tanstack/react-router";
import { RecordsPage } from "@/components/erp/RecordsPage";
export const Route = createFileRoute("/quotations")({
  head: () => ({
    meta: [
      { title: "Quotations — BuildCore ERP" },
      { name: "description", content: "Manage quotations in your BuildCore ERP workspace." },
      { property: "og:title", content: "Quotations — BuildCore ERP" },
      { property: "og:description", content: "Manage quotations in your BuildCore ERP workspace." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Page,
});
function Page() {
  return <RecordsPage module="quotations" />;
}
