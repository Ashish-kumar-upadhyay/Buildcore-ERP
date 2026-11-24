import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  motion,
  useReducedMotion,
  useInView,
  AnimatePresence,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";
import { useEffect, useRef, useState, type MouseEvent } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Boxes,
  Users,
  TrendingUp,
  ShieldCheck,
  Truck,
  BarChart3,
  Building2,
  Sun,
  Moon,
  Check,
  Menu,
  X,
  Activity,
  Sparkles,
  ChevronDown,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import constructionHero from "@/assets/construction-hero.jpg";
import { readSession } from "@/lib/api";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "BuildCore ERP — Your building materials workspace" },
      {
        name: "description",
        content: "Inventory, people and sales in one workspace for building materials suppliers.",
      },
      { property: "og:title", content: "BuildCore ERP — Your building materials workspace" },
      {
        property: "og:description",
        content: "Inventory, people and sales in one workspace for building materials suppliers.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

const modules = [
  {
    icon: Boxes,
    title: "Inventory",
    description: "Every bag, bar and brick. Keep your stock in sight, from arrival to dispatch.",
    to: "/inventory",
    tag: "01 / MATERIALS",
  },
  {
    icon: Users,
    title: "People & HR",
    description: "Keep your team connected with attendance, leave and expenses in one place.",
    to: "/hrms",
    tag: "02 / PEOPLE",
  },
  {
    icon: TrendingUp,
    title: "Sales",
    description: "Move business forward. Follow leads and orders from first call to delivery.",
    to: "/sales",
    tag: "03 / BUSINESS",
  },
] as const;

const workflow = [
  {
    icon: Building2,
    title: "Plan & purchase",
    detail: "Create purchase orders using saved vendors and materials.",
  },
  {
    icon: Boxes,
    title: "Receive & track",
    detail: "Record full or partial receipts and keep stock history in sync.",
  },
  {
    icon: Truck,
    title: "Fulfil orders",
    detail: "Follow sales from confirmation through dispatch and delivery.",
  },
  {
    icon: BarChart3,
    title: "See the whole picture",
    detail: "Bring inventory, team activity and business performance together.",
  },
] as const;

const stats = [
  { icon: Boxes, value: 300, suffix: "+", label: "SKUs tracked" },
  { icon: TrendingUp, value: 17, suffix: "%", label: "Higher sales" },
  { icon: Users, value: 24, suffix: "/7", label: "Team & orders" },
] as const;

const liveMetrics = [
  { icon: Boxes, label: "Stock", value: "14.2L", change: "+12%" },
  { icon: Truck, label: "Orders", value: "32", change: "+8%" },
  { icon: Users, label: "Team", value: "18", change: "Active" },
  { icon: TrendingUp, label: "Sales", value: "₹8.7L", change: "+17%" },
] as const;

function CountUp({ to, suffix }: { to: number; suffix: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const reduced = useReducedMotion();
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const [val, setVal] = useState(0);

  useEffect(() => {
    if (!inView) return;
    if (reduced) {
      setVal(to);
      return;
    }
    const start = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / 1200);
      const eased = 1 - (1 - progress) ** 3;
      setVal(Math.round(to * eased));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [inView, reduced, to]);

  return (
    <span ref={ref}>
      {val}
      {suffix}
    </span>
  );
}

function Home() {
  const reduced = useReducedMotion();
  const nav = useNavigate();
  const [dark, setDark] = useState(false);
  const [menu, setMenu] = useState(false);
  const pointerX = useMotionValue(50);
  const pointerY = useMotionValue(40);
  const glowX = useSpring(pointerX, { stiffness: 70, damping: 24, mass: 0.8 });
  const glowY = useSpring(pointerY, { stiffness: 70, damping: 24, mass: 0.8 });
  const spotlightX = useTransform(glowX, (value) => `${value}%`);
  const spotlightY = useTransform(glowY, (value) => `${value}%`);

  const openDashboard = (event: MouseEvent<HTMLAnchorElement>) => {
    if (readSession()) return;
    event.preventDefault();
    toast.error("Please login first to explore the dashboard");
    void nav({ to: "/login" });
  };

  const moveGlow = (event: MouseEvent<HTMLElement>) => {
    if (reduced) return;
    const rect = event.currentTarget.getBoundingClientRect();
    pointerX.set(((event.clientX - rect.left) / rect.width) * 100);
    pointerY.set(((event.clientY - rect.top) / rect.height) * 100);
  };

  const rise = {
    initial: reduced ? false : { opacity: 0, y: 28 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-80px" },
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const },
  };

  return (
    <div className={`home-page ${dark ? "login-night" : ""}`}>
      <header className="home-header home-header-sticky">
        <Link to="/" className="login-brand home-brand">
          <Building2 />
          <div>
            <p>
              BUILDCORE <span>ERP</span>
            </p>
            <small>Smart Construction. Smarter Management.</small>
          </div>
        </Link>
        <nav className="home-links" aria-label="Main navigation">
          {["Workspace", "Overview", "Features", "About"].map((item) => (
            <a key={item} href={`#${item.toLowerCase()}`}>
              {item}
            </a>
          ))}
        </nav>
        <div className="home-header-actions">
          <div className="home-theme">
            <Button variant="ghost" size="icon" aria-label="Light theme" aria-pressed={!dark} onClick={() => setDark(false)}>
              <Sun />
            </Button>
            <Button variant="ghost" size="icon" aria-label="Dark theme" aria-pressed={dark} onClick={() => setDark(true)}>
              <Moon />
            </Button>
          </div>
          <Button asChild variant="outline" className="home-secondary home-header-signin">
            <Link to="/login">Sign in</Link>
          </Button>
          <Button asChild className="home-primary home-header-cta">
            <Link to="/login">
              Start workspace
              <ArrowRight />
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="home-menu-toggle"
            aria-label={menu ? "Close menu" : "Open menu"}
            onClick={() => setMenu(!menu)}
          >
            {menu ? <X /> : <Menu />}
          </Button>
        </div>
      </header>

      <AnimatePresence>
        {menu && (
          <motion.nav
            className="home-mobile-menu"
            aria-label="Mobile navigation"
            initial={reduced ? false : { opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduced ? undefined : { opacity: 0, y: -12 }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
          >
            {["Workspace", "Overview", "Features", "About", "Sign in"].map((item) => (
              <a key={item} href={item === "Sign in" ? "/login" : `#${item.toLowerCase()}`} onClick={() => setMenu(false)}>
                {item}
                <ArrowUpRight />
              </a>
            ))}
          </motion.nav>
        )}
      </AnimatePresence>

      <main>
        <section className="home-hero home-hero-saas" onMouseMove={moveGlow}>
          <div className="home-aurora" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
          <div className="home-grid" aria-hidden="true" />
          <motion.div
            className="home-spotlight"
            aria-hidden="true"
            style={{ left: spotlightX, top: spotlightY }}
          />

          <div className="home-hero-grid">
            <motion.div
              className="home-hero-content"
              initial={reduced ? false : { opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
            >
              <p className="home-eyebrow home-pill">
                <Sparkles />
                RUN YOUR CONSTRUCTION BUSINESS
              </p>
              <h1>
                One workspace.
                <br />
                <span className="home-gradient-text">Complete control.</span>
              </h1>
              <p className="home-hero-copy">
                Manage materials, people, stock and sales in one simple workspace—from purchase to
                delivery.
              </p>
              <div className="home-hero-actions">
                <motion.div
                  whileHover={reduced ? undefined : { y: -2 }}
                  whileTap={reduced ? undefined : { scale: 0.98 }}
                  transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                >
                  <Button asChild className="home-primary">
                    <Link to="/login">
                      Start workspace
                      <ArrowRight />
                    </Link>
                  </Button>
                </motion.div>
                <motion.div
                  whileHover={reduced ? undefined : { y: -2 }}
                  whileTap={reduced ? undefined : { scale: 0.98 }}
                  transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                >
                  <Button asChild variant="outline" className="home-secondary">
                    <Link to="/dashboard" onClick={openDashboard}>
                      Explore dashboard
                      <ArrowUpRight />
                    </Link>
                  </Button>
                </motion.div>
              </div>
              <div className="home-hero-stats" aria-label="Workspace highlights">
                {stats.map((item) => (
                  <article key={item.label}>
                    <item.icon aria-hidden="true" />
                    <div>
                      <strong>
                        <CountUp to={item.value} suffix={item.suffix} />
                      </strong>
                      <p>{item.label}</p>
                    </div>
                  </article>
                ))}
              </div>
            </motion.div>

            <motion.div
              className="home-stage"
              initial={reduced ? false : { opacity: 0, y: 36, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.95, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
            >
              <motion.div
                className="home-construction-art"
                animate={reduced ? undefined : { y: [0, -4, 0] }}
                transition={{ duration: 8, delay: 0.8, repeat: Infinity, ease: "easeInOut" }}
              >
                <img
                  src={constructionHero}
                  alt="Tower crane lifting materials over a building under construction"
                />
              </motion.div>
              <motion.div
                className="home-stage-chip home-stage-chip-inventory"
                initial={reduced ? false : { opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.38, duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
              >
                <span>
                  <Boxes />
                </span>
                <div>
                  <strong>Inventory</strong>
                  <small>Stock visibility</small>
                </div>
                <ArrowUpRight />
              </motion.div>
              <motion.div
                className="home-stage-chip home-stage-chip-people"
                initial={reduced ? false : { opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5, duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
              >
                <span>
                  <Users />
                </span>
                <div>
                  <strong>People &amp; HR</strong>
                  <small>Team operations</small>
                </div>
              </motion.div>
              <motion.div
                className="home-stage-chip home-stage-chip-sales"
                initial={reduced ? false : { opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.62, duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
              >
                <span>
                  <TrendingUp />
                </span>
                <div>
                  <strong>Sales</strong>
                  <small>Order to delivery</small>
                </div>
              </motion.div>
              <motion.div
                className="home-live-overview"
                role="group"
                aria-label="Live operations overview"
                initial={reduced ? false : { opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.48, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="home-live-heading">
                  <strong>
                    <Activity />
                    Live overview
                  </strong>
                  <span>
                    This month
                    <ChevronDown />
                  </span>
                </div>
                <div className="home-live-grid">
                  {liveMetrics.map((metric) => (
                    <div className="home-live-metric" key={metric.label}>
                      <metric.icon aria-hidden="true" />
                      <div>
                        <small>{metric.label}</small>
                        <strong>{metric.value}</strong>
                        <p>{metric.change}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          </div>
        </section>

        <div className="home-material-band" aria-label="Building materials">
          <div className="animate-marquee">
            {[0, 1].map((copy) => (
              <div key={copy} aria-hidden={copy === 1}>
                {["CEMENT", "TMT STEEL", "RIVER SAND", "AAC BLOCKS", "AGGREGATE", "RED BRICKS"].map((name) => (
                  <span key={name}>
                    {name}
                    <i>✦</i>
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>

        <section id="workspace" className="home-workspace">
          <motion.div className="home-section-heading" {...rise}>
            <div>
              <p className="home-eyebrow">EVERYTHING IN ITS PLACE</p>
              <h2>
                One workspace.
                <br />
                <span>Built for your everyday.</span>
              </h2>
            </div>
            <p>
              Less switching. More doing.
              <br />
              Your next task is right here.
            </p>
          </motion.div>

          <div id="features" className="home-modules">
            {modules.map((module, index) => (
              <motion.article
                key={module.title}
                className="home-module"
                initial={reduced ? false : { opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ delay: index * 0.08, duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
                whileHover={reduced ? undefined : { y: -8 }}
              >
                <div className="home-module-top">
                  <span className="home-module-icon">
                    <module.icon />
                  </span>
                  <small>{module.tag}</small>
                </div>
                <h3>{module.title}</h3>
                <p>{module.description}</p>
                <Button asChild variant="ghost" className="home-module-link">
                  <Link to={module.to}>
                    Open {module.title}
                    <ArrowUpRight />
                  </Link>
                </Button>
              </motion.article>
            ))}
          </div>
        </section>

        <section id="overview" className="home-overview">
          <motion.div {...rise}>
            <p className="home-eyebrow">THE BIG PICTURE</p>
            <h2>
              A clearer view.
              <br />
              A better working day.
            </h2>
            <Button asChild className="home-primary">
              <Link to="/dashboard" onClick={openDashboard}>
                View overview
                <ArrowRight />
              </Link>
            </Button>
          </motion.div>

          <div className="home-overview-items">
            {[
              { icon: BarChart3, title: "Business at a glance", detail: "Sales, stock value and activity in one dashboard." },
              { icon: Truck, title: "From order to delivery", detail: "Follow every order through dispatch and arrival." },
              { icon: ShieldCheck, title: "A place for every team", detail: "Inventory, HR and sales, working side by side." },
            ].map((item, index) => (
              <motion.div
                key={item.title}
                className="home-overview-row"
                initial={reduced ? false : { opacity: 0, x: 16 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.08, duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
              >
                <item.icon />
                <div>
                  <h3>{item.title}</h3>
                  <p>{item.detail}</p>
                </div>
                <Check />
              </motion.div>
            ))}
          </div>
        </section>

        <section id="about" className="home-about">
          <motion.div className="home-about-intro" {...rise}>
            <div>
              <p className="home-eyebrow">ABOUT BUILDCORE ERP</p>
              <h2>
                From the first purchase
                <br />
                <span>to the final delivery.</span>
              </h2>
              <p className="home-about-copy">
                BuildCore ERP connects the everyday work behind a building-materials business:
                purchasing, stock, sales and people operations in one clear workflow.
              </p>
            </div>
            <div className="home-about-note">
              <span>
                <ShieldCheck />
              </span>
              <div>
                <strong>One connected workspace</strong>
                <small>Clear hand-offs. A more confident day.</small>
              </div>
            </div>
          </motion.div>

          <div className="home-workflow">
            {workflow.map((step, index) => (
              <motion.article
                key={step.title}
                className="home-workflow-step"
                initial={reduced ? false : { opacity: 0, y: 22 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ delay: index * 0.1, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                {...(reduced ? {} : { whileHover: { y: -6 } })}
              >
                <div className="home-workflow-top">
                  <span className="home-workflow-number">0{index + 1}</span>
                  <span className="home-workflow-icon">
                    <step.icon />
                  </span>
                </div>
                <h3>{step.title}</h3>
                <p>{step.detail}</p>
                <span className="home-workflow-line" aria-hidden="true" />
              </motion.article>
            ))}
          </div>

          <motion.p className="home-workflow-caption" {...rise}>
            One flow. Every team moving in the same direction.
          </motion.p>
        </section>

        <section className="home-final">
          <div className="home-final-glow" aria-hidden="true" />
          <motion.div {...rise}>
            <Building2 />
            <p className="home-eyebrow">LET&apos;S GET TO WORK</p>
            <h2>
              Your next great day
              <br />
              starts here.
            </h2>
            <Button asChild className="home-primary">
              <Link to="/login">
                Go to sign in
                <ArrowRight />
              </Link>
            </Button>
          </motion.div>
        </section>
      </main>

      <footer className="home-footer">
        <p>
          BUILDCORE <span>ERP</span>
        </p>
        <small>© 2026 BuildCore ERP</small>
        <Link to="/login">
          Your workspace
          <ArrowUpRight />
        </Link>
      </footer>
    </div>
  );
}
