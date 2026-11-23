import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion, useReducedMotion } from "framer-motion";
import { useState } from "react";
import { ArrowRight, Building2, Mail, LockKeyhole, Eye, EyeOff, Sun, Moon, CalendarCheck2, ChartNoAxesColumnIncreasing, Construction, Layers3, Boxes } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import team from "@/assets/download.png";
import { api, login, roleAccounts } from "@/lib/api";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [
    { title: "Sign in — BuildCore ERP" },
    { name: "description", content: "Welcome back to your BuildCore ERP workspace." },
    { property: "og:title", content: "Sign in — BuildCore ERP" },
    { property: "og:description", content: "Welcome back to your BuildCore ERP workspace." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: Login,
});

function Login() {
  const nav = useNavigate();
  const reduced = useReducedMotion();
  const [dark, setDark] = useState(false);
  const [visible, setVisible] = useState(false);
  const [dialog, setDialog] = useState<string | null>(null);
  const [day, setDay] = useState(26);
  const [role, setRole] = useState("Admin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const enter = async (accountEmail: string, accountPassword: string) => {
    setBusy(true);
    try {
      const user = await login(accountEmail, accountPassword);
      if (user.role === "Manager") {
        await nav({ to: "/notifications", search: { tab: "requests" } });
      } else {
        await nav({ to: "/dashboard" });
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to sign in");
    } finally {
      setBusy(false);
    }
  };
  const float = reduced ? {} : { y: [0, -6, 0] };

  return (
    <div className={`login-page ${dark ? "login-night" : ""}`}>
      <motion.div className="login-frame" initial={reduced ? false : { opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.65 }}>
        <section className="login-form-side">
          <a href="/" className="login-brand" aria-label="BuildCore ERP home">
            <Building2 aria-hidden="true" />
            <div><p>BUILDCORE <span>ERP</span></p><small>Smart Construction. Smarter Management.</small></div>
          </a>

          <motion.form className="login-form" initial={reduced ? false : { opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.6 }} onSubmit={(e) => { e.preventDefault(); void enter(email, password); }}>
            <div className="login-welcome"><h1>Welcome <span>Back</span></h1><p>Sign in to your BUILDCORE ERP account</p></div>
            <label className="login-input"><Mail aria-hidden="true" /><input aria-label="Employee ID or email address" type="text" placeholder="Enter employee ID or email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} /></label>
            <label className="login-input"><LockKeyhole aria-hidden="true" /><input aria-label="Password" type={visible ? "text" : "password"} placeholder="Enter your password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} /><Button type="button" variant="ghost" size="icon" className="login-eye" aria-label={visible ? "Hide password" : "Show password"} onClick={() => setVisible(!visible)}>{visible ? <Eye /> : <EyeOff />}</Button></label>
            <div className="login-options"><label><input type="checkbox" defaultChecked />Remember me</label><Button type="button" variant="link" onClick={() => setDialog("password")}>Forgot password?</Button></div>
            <Button type="submit" className="login-submit" disabled={busy}><ArrowRight /><span>Sign In</span></Button>
            <div className="login-divider"><span />or continue with<span /></div>
            <div className="login-socials">
              <Button type="button" variant="outline" aria-label="Continue with Google" onClick={() => setDialog("Google")}><span className="google-mark">G</span></Button>
              <Button type="button" variant="outline" aria-label="Continue with GitHub" onClick={() => setDialog("GitHub")}><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 .8a11.3 11.3 0 0 0-3.57 22c.56.1.77-.24.77-.54v-2.1c-3.13.68-3.79-1.33-3.79-1.33-.51-1.3-1.25-1.65-1.25-1.65-1.02-.7.08-.68.08-.68 1.13.08 1.73 1.16 1.73 1.16 1 1.72 2.64 1.23 3.28.94.1-.73.39-1.23.71-1.51-2.5-.29-5.14-1.25-5.14-5.59 0-1.23.44-2.24 1.16-3.03-.12-.28-.5-1.44.11-3 0 0 .95-.3 3.11 1.16a10.8 10.8 0 0 1 5.66 0c2.16-1.46 3.1-1.16 3.1-1.16.62 1.56.24 2.72.12 3 .72.79 1.16 1.8 1.16 3.03 0 4.35-2.64 5.3-5.15 5.58.4.35.76 1.04.76 2.09v3.1c0 .3.2.65.78.54A11.3 11.3 0 0 0 12 .8Z" /></svg></Button>
              <Button type="button" variant="outline" aria-label="Continue with Microsoft" onClick={() => setDialog("Microsoft")}><span className="microsoft-mark" aria-hidden="true"><i /><i /><i /><i /></span></Button>
            </div>
            <p className="login-contact">Don’t have an account? <Button type="button" variant="link" onClick={() => setDialog("admin")}>Contact Admin</Button></p>
          </motion.form>
          <svg className="login-wave" viewBox="0 0 560 160" preserveAspectRatio="none" aria-hidden="true"><path d="M0 0C120 10 120 100 260 125S460 160 560 160H0Z" /><path d="M0 95C75 55 110 130 180 160H0Z" /></svg>
        </section>

        <section className="login-photo-side" aria-label="Construction team workspace">
          <img className="login-team-photo" src={team} alt="Construction colleagues reviewing architectural plans with a laptop and safety helmet" />
          <div className="login-theme" aria-label="Appearance"><Button variant="ghost" size="icon" aria-label="Light theme" aria-pressed={!dark} onClick={() => setDark(false)}><Sun /></Button><Button variant="ghost" size="icon" aria-label="Dark theme" aria-pressed={dark} onClick={() => setDark(true)}><Moon /></Button></div>
          <motion.div className="login-task" animate={float} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}><span className="login-note-icon"><CalendarCheck2 /></span><div><strong>Task Review With Team</strong><small>09:30 AM – 10:00 AM</small></div><i /></motion.div>
          <div className="login-materials" aria-hidden="true"><span><Construction /></span><span><Boxes /></span><span><Layers3 /></span></div>
          <div className="login-calendar" aria-label="Meeting calendar">{["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((name, i) => <Button key={name} type="button" variant="ghost" aria-label={`${name} ${22 + i}`} aria-pressed={day === 22 + i} onClick={() => setDay(22 + i)}><small>{name}</small><span>{22 + i}</span></Button>)}</div>
          <motion.div className="login-meeting" animate={float} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}><span className="login-note-icon"><ChartNoAxesColumnIncreasing /></span><div><strong>{day === 26 ? "Daily Meeting" : "Team Check-in"}</strong><small>12:00 PM – 01:00 PM</small><div className="login-attendees"><span>IA</span><span>SK</span><span>AM</span><span>+3</span></div></div><i /></motion.div>
        </section>
      </motion.div>
      <Dialog open={dialog !== null} onOpenChange={(open) => { if (!open) setDialog(null); }}><DialogContent className={`login-dialog login-page ${dark ? "login-night" : ""}`}><DialogTitle>{dialog === "password" ? "Reset your password" : dialog === "admin" ? "Contact your administrator" : `Continue with ${dialog ?? "your account"}`}</DialogTitle><DialogDescription>{dialog === "password" ? "A reset token is issued for the email on the sign-in form. It expires in 30 minutes." : dialog === "admin" ? "Send an access request for the workspace role below." : "Social sign-in opens the matching workspace account."}</DialogDescription><label className="text-sm">Workspace role<select className="login-role" value={role} onChange={(e) => setRole(e.target.value)}>{["Admin", "Sub-admin", "HR Manager", "Inventory Manager", "Sales Manager", "Employee", "Sales Rep"].map((r) => <option key={r}>{r}</option>)}</select></label><Button className="login-submit" disabled={busy} onClick={() => {
        void (async () => {
          if (dialog === "password") {
            if (!email.includes("@")) {
              toast.error("Enter your work email on the sign-in form first");
              return;
            }
            try {
              const result = await api<{ message: string; resetToken?: string }>("/auth/forgot", { method: "POST", body: JSON.stringify({ email }) });
              toast.success(result.resetToken ? `${result.message} Token: ${result.resetToken}` : result.message);
              setDialog(null);
            } catch (error) {
              toast.error(error instanceof Error ? error.message : "Unable to reset password");
            }
            return;
          }
          if (dialog === "admin") {
            if (!email.includes("@")) {
              toast.error("Enter your work email on the sign-in form first");
              return;
            }
            try {
              const result = await api<{ message: string }>("/auth/access-request", { method: "POST", body: JSON.stringify({ email, role }) });
              toast.success(result.message);
              setDialog(null);
            } catch (error) {
              toast.error(error instanceof Error ? error.message : "Unable to send the request");
            }
            return;
          }
          const account = roleAccounts[role];
          if (!account) return;
          await enter(account.email, account.password);
          setDialog(null);
        })();
      }}>Preview as {role}<ArrowRight /></Button></DialogContent></Dialog>
    </div>
  );
}