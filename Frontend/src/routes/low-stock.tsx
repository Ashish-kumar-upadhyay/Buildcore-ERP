import { createFileRoute } from "@tanstack/react-router";
import { RecordsPage } from "@/components/erp/RecordsPage";
export const Route = createFileRoute("/low-stock")({
  head: () => ({
    meta: [
      { title: "Low-stock alerts — BuildCore ERP" },
      { name: "description", content: "Manage low-stock alerts in your BuildCore ERP workspace." },
      { property: "og:title", content: "Low-stock alerts — BuildCore ERP" },
      {
        property: "og:description",
        content: "Manage low-stock alerts in your BuildCore ERP workspace.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Page,
});
function Page() {
  return <RecordsPage module="low-stock" />;
}
