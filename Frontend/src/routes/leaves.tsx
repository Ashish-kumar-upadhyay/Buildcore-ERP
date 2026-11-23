import { createFileRoute } from "@tanstack/react-router";
import { RecordsPage } from "@/components/erp/RecordsPage";
export const Route = createFileRoute("/leaves")({
  head: () => ({
    meta: [
      { title: "Leave requests — BuildCore ERP" },
      { name: "description", content: "Manage leave requests in your BuildCore ERP workspace." },
      { property: "og:title", content: "Leave requests — BuildCore ERP" },
      {
        property: "og:description",
        content: "Manage leave requests in your BuildCore ERP workspace.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Page,
});
function Page() {
  return <RecordsPage module="leaves" />;
}
