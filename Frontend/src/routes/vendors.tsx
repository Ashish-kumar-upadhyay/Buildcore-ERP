import { createFileRoute } from "@tanstack/react-router";
import { RecordsPage } from "@/components/erp/RecordsPage";
export const Route = createFileRoute("/vendors")({
  head: () => ({
    meta: [
      { title: "Vendors — BuildCore ERP" },
      { name: "description", content: "Manage vendors in your BuildCore ERP workspace." },
      { property: "og:title", content: "Vendors — BuildCore ERP" },
      { property: "og:description", content: "Manage vendors in your BuildCore ERP workspace." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Page,
});
function Page() {
  return <RecordsPage module="vendors" />;
}
