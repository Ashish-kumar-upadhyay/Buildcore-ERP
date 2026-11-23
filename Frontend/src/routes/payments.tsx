import { createFileRoute } from "@tanstack/react-router";
import { RecordsPage } from "@/components/erp/RecordsPage";
export const Route = createFileRoute("/payments")({
  head: () => ({
    meta: [
      { title: "Customer payments — BuildCore ERP" },
      { name: "description", content: "Manage customer payments in your BuildCore ERP workspace." },
      { property: "og:title", content: "Customer payments — BuildCore ERP" },
      {
        property: "og:description",
        content: "Manage customer payments in your BuildCore ERP workspace.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Page,
});
function Page() {
  return <RecordsPage module="payments" />;
}
