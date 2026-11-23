import { createFileRoute } from "@tanstack/react-router";
import { RecordsPage } from "@/components/erp/RecordsPage";
export const Route = createFileRoute("/representatives")({
  head: () => ({
    meta: [
      { title: "Sales representatives — BuildCore ERP" },
      {
        name: "description",
        content: "Manage sales representatives in your BuildCore ERP workspace.",
      },
      { property: "og:title", content: "Sales representatives — BuildCore ERP" },
      {
        property: "og:description",
        content: "Manage sales representatives in your BuildCore ERP workspace.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Page,
});
function Page() {
  return <RecordsPage module="representatives" />;
}
