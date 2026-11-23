import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export function Field({
  label,
  className,
  ...p
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className={cn("text-xs text-muted-foreground", className)}>
      {label}
      <input
        required
        min={0}
        {...p}
        className="mt-1.5 h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none focus:border-primary/60"
      />
    </label>
  );
}
export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  const dark =
    typeof document !== "undefined" && document.querySelector(".erp-page.login-night") !== null;
  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!value) onClose();
      }}
    >
      <DialogContent
        aria-describedby={undefined}
        className={cn("erp-page erp-dialog", dark && "login-night")}
      >
        <DialogTitle className="mb-3 pr-6">{title}</DialogTitle>
        {children}
      </DialogContent>
    </Dialog>
  );
}
