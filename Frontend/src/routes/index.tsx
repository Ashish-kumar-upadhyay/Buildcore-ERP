import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion, useReducedMotion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { useState, type MouseEvent } from "react";
import { ArrowRight, ArrowUpRight, Boxes, Users, TrendingUp, ShieldCheck, Truck, BarChart3, Building2, Sun, Moon, Check, Menu, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import team from "@/assets/download.png";
import { readSession } from "@/lib/api";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: "BuildCore ERP — Your building materials workspace" },
    { name: "description", content: "Inventory, people and sales in one workspace for building materials suppliers." },
    { property: "og:title", content: "BuildCore ERP — Your building materials workspace" },
    { property: "og:description", content: "Inventory, people and sales in one workspace for building materials suppliers." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: Home,
});

const modules = [
  { icon: Boxes, title: "Inventory", description: "Every bag, bar and brick. Keep your stock in sight, from arrival to dispatch.", to: "/inventory", tag: "01 / MATERIALS" },
  { icon: Users, title: "People & HR", description: "Keep your team connected with attendance, leave and expenses in one place.", to: "/hrms", tag: "02 / PEOPLE" },
  { icon: TrendingUp, title: "Sales", description: "Move business forward. Follow leads and orders from first call to delivery.", to: "/sales", tag: "03 / BUSINESS" },
] as const;

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 12,
    },
  },
};

function Home() {
  const reduced = useReducedMotion();
  const nav = useNavigate();
  const [dark, setDark] = useState(false);
  const [menu, setMenu] = useState(false);
  const [hoveredModule, setHoveredModule] = useState<string | null>(null);
  const { scrollYProgress } = useScroll();
  const y1 = useTransform(scrollYProgress, [0, 0.5], [0, -50]);
  const y2 = useTransform(scrollYProgress, [0, 0.5], [0, 50]);
  const opacity = useTransform(scrollYProgress, [0, 0.3], [1, 0]);

  const openDashboard = (event: MouseEvent<HTMLAnchorElement>) => {
    if (readSession()) return;
    event.preventDefault();
    toast.error("Please login first to explore the dashboard");
    void nav({ to: "/login" });
  };

  const fadeInUp = {
    initial: reduced ? false as const : { opacity: 0, y: 40 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-100px" },
    transition: { duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] },
  };

  const staggerContainer = {
    initial: reduced ? false as const : { opacity: 0 },
    whileInView: { opacity: 1 },
    viewport: { once: true },
    transition: { staggerChildren: 0.15 },
  };

  return (
    <div className={`home-page ${dark ? "login-night" : ""}`}>
      <motion.header
        className="home-header"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
        style={{ opacity }}
      >
        <Link to="/" className="login-brand home-brand">
          <motion.div
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 400 }}
          >
            <Building2 />
            <div>
              <p>BUILDCORE <span>ERP</span></p>
              <small>Smart Construction. Smarter Management.</small>
            </div>
          </motion.div>
        </Link>
        <nav className="home-links" aria-label="Main navigation">
          {["Workspace", "Overview", "Sign in"].map((item, i) => (
            <motion.a
              key={item}
              href={item === "Sign in" ? "/login" : `#${item.toLowerCase()}`}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * i, duration: 0.5 }}
              whileHover={{ scale: 1.1, color: "var(--primary)" }}
              whileTap={{ scale: 0.95 }}
            >
              {item}
            </motion.a>
          ))}
        </nav>
        <div className="home-header-actions">
          <motion.div
            className="home-theme"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 400 }}
          >
            <Button
              variant="ghost"
              size="icon"
              aria-label="Light theme"
              aria-pressed={!dark}
              onClick={() => setDark(false)}
            >
              <Sun />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Dark theme"
              aria-pressed={dark}
              onClick={() => setDark(true)}
            >
              <Moon />
            </Button>
          </motion.div>
          <Button
            variant="ghost"
            size="icon"
            className="home-menu-toggle"
            aria-label={menu ? "Close menu" : "Open menu"}
            onClick={() => setMenu(!menu)}
          >
            <AnimatePresence mode="wait">
              {menu ? (
                <motion.div
                  key="close"
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <X />
                </motion.div>
              ) : (
                <motion.div
                  key="menu"
                  initial={{ rotate: 90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: -90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Menu />
                </motion.div>
              )}
            </AnimatePresence>
          </Button>
        </div>
      </motion.header>

      <AnimatePresence>
        {menu && (
          <motion.nav
            className="home-mobile-menu"
            aria-label="Mobile navigation"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {["Workspace", "Overview", "Sign in"].map((item, i) => (
              <motion.a
                key={item}
                href={item === "Sign in" ? "/login" : `#${item.toLowerCase()}`}
                onClick={() => setMenu(false)}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ x: 10 }}
              >
                {item}
                <ArrowUpRight />
              </motion.a>
            ))}
          </motion.nav>
        )}
      </AnimatePresence>

      <main>
        <section className="home-hero">
          <motion.img
            src={team}
            alt="BuildCore construction team reviewing building plans together"
            className="home-hero-photo"
            style={{ y: y1 }}
            initial={{ scale: 1.1 }}
            animate={{ scale: 1 }}
            transition={{ duration: 1.5, ease: [0.25, 0.46, 0.45, 0.94] }}
          />
          <div className="home-hero-scrim" />
          <motion.div className="home-hero-content" {...fadeInUp}>
            <motion.p
              className="home-eyebrow"
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.8 }}
            >
              <motion.span
                initial={{ width: 0 }}
                animate={{ width: "40px" }}
                transition={{ delay: 0.5, duration: 0.5 }}
              />
              YOUR BUSINESS. BETTER CONNECTED.
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              BUILDCORE{" "}
              <motion.span
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5, duration: 0.5, type: "spring" }}
              >
                ERP.
              </motion.span>
            </motion.h1>
            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.8 }}
            >
              Strong foundations.
              <br />
              Smarter business.
            </motion.h2>
            <motion.p
              className="home-hero-copy"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.8 }}
            >
              From the yard floor to the final invoice.
              <br />
              Bring your materials, people and sales together.
            </motion.p>
            <motion.div
              className="home-hero-actions"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.8 }}
            >
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button asChild className="home-primary">
                  <Link to="/dashboard" onClick={openDashboard}>
                    <ArrowRight />
                    Explore dashboard
                  </Link>
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button asChild variant="outline" className="home-secondary">
                  <Link to="/login">
                    Sign in
                    <ArrowUpRight />
                  </Link>
                </Button>
              </motion.div>
            </motion.div>
            <motion.div
              className="home-hero-note"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.8, duration: 0.5, type: "spring" }}
              whileHover={{ scale: 1.05 }}
            >
              <motion.span
                initial={{ rotate: 0 }}
                animate={{ rotate: 360 }}
                transition={{ delay: 1, duration: 0.5 }}
              >
                <Check />
              </motion.span>
              One workspace. Every part of your day.
            </motion.div>
          </motion.div>

          <motion.div
            className="home-stock-note"
            initial={{ opacity: 0, y: 30, x: -30 }}
            animate={{ opacity: 1, y: reduced ? 0 : [0, -8, 0], x: 0 }}
            transition={{
              opacity: { delay: 0.8, duration: 0.6 },
              y: { duration: 4, repeat: Infinity, ease: "easeInOut" },
              x: { duration: 0.6 },
            }}
            whileHover={{ scale: 1.05, y: 0 }}
          >
            <motion.span
              className="home-note-icon"
              animate={{ rotate: [0, -10, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            >
              <Boxes />
            </motion.span>
            <div>
              <small>Stock received</small>
              <strong>+300 bags</strong>
              <p>OPC 53 · Warehouse A</p>
            </div>
            <motion.span
              className="home-note-check"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 1.2, type: "spring" }}
            >
              <Check />
            </motion.span>
          </motion.div>

          <motion.div
            className="home-sales-note"
            {...fadeInUp}
            whileHover={{ scale: 1.05, x: 0 }}
          >
            <motion.span
              className="home-note-icon"
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 2 }}
            >
              <TrendingUp />
            </motion.span>
            <div>
              <small>November sales</small>
              <strong>₹55.2L</strong>
              <p>↑ 17% vs October</p>
            </div>
          </motion.div>

          <motion.div
            className="home-photo-caption"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.8 }}
            style={{ y: y2 }}
          >
            <motion.span
              initial={{ width: 0 }}
              animate={{ width: "30px" }}
              transition={{ delay: 1.3, duration: 0.5 }}
            />
            BUILT AROUND YOUR TEAM
          </motion.div>
        </section>

        <motion.div
          className="home-material-band"
          aria-label="Building materials"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <div className="animate-marquee">
            {[0, 1].map((n) => (
              <div key={n} aria-hidden={n === 1}>
                {["CEMENT", "TMT STEEL", "RIVER SAND", "AAC BLOCKS", "AGGREGATE", "RED BRICKS"].map((s, i) => (
                  <motion.span
                    key={s}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1, duration: 0.5 }}
                    whileHover={{ scale: 1.2, color: "var(--primary)" }}
                  >
                    {s}
                    <i>✦</i>
                  </motion.span>
                ))}
              </div>
            ))}
          </div>
        </motion.div>

        <section id="workspace" className="home-workspace">
          <motion.div className="home-section-heading" {...fadeInUp}>
            <div>
              <motion.p
                className="home-eyebrow"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                EVERYTHING IN ITS PLACE
              </motion.p>
              <motion.h2
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
              >
                One workspace.
                <br />
                <span>Built for your everyday.</span>
              </motion.h2>
            </div>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              Less switching. More doing.
              <br />
              Your next task is right here.
            </motion.p>
          </motion.div>

          <motion.div
            className="home-modules"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
          >
            {modules.map((m, i) => (
              <motion.article
                key={m.title}
                className="home-module"
                variants={itemVariants}
                whileHover={{ y: -10, scale: 1.02 }}
                onHoverStart={() => setHoveredModule(m.title)}
                onHoverEnd={() => setHoveredModule(null)}
              >
                <motion.div
                  className="home-module-top"
                  animate={{
                    opacity: hoveredModule === m.title ? 1 : 0.7,
                  }}
                  transition={{ duration: 0.3 }}
                >
                  <motion.span
                    className="home-module-icon"
                    animate={{
                      rotate: hoveredModule === m.title ? 360 : 0,
                      scale: hoveredModule === m.title ? 1.1 : 1,
                    }}
                    transition={{ duration: 0.5 }}
                  >
                    <m.icon />
                  </motion.span>
                  <motion.small
                    animate={{ opacity: hoveredModule === m.title ? 1 : 0.7 }}
                  >
                    {m.tag}
                  </motion.small>
                </motion.div>
                <h3>{m.title}</h3>
                <p>{m.description}</p>
                <motion.div whileHover={{ x: 5 }}>
                  <Button asChild variant="ghost" className="home-module-link">
                    <Link to={m.to}>
                      Open {m.title}
                      <ArrowUpRight />
                    </Link>
                  </Button>
                </motion.div>
              </motion.article>
            ))}
          </motion.div>
        </section>

        <section id="overview" className="home-overview">
          <motion.div {...fadeInUp}>
            <motion.p
              className="home-eyebrow"
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              THE BIG PICTURE
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
              A clearer view.
              <br />
              A better working day.
            </motion.h2>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button asChild className="home-primary">
                <Link to="/dashboard" onClick={openDashboard}>
                  View overview
                  <ArrowRight />
                </Link>
              </Button>
            </motion.div>
          </motion.div>

          <motion.div
            className="home-overview-items"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
          >
            {[
              { icon: BarChart3, title: "Business at a glance", detail: "Sales, stock value and activity in one dashboard." },
              { icon: Truck, title: "From order to delivery", detail: "Follow every order through dispatch and arrival." },
              { icon: ShieldCheck, title: "A place for every team", detail: "Inventory, HR and sales, working side by side." },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                className="home-overview-row"
                variants={itemVariants}
                whileHover={{ x: 10, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <motion.div
                  whileHover={{ rotate: 15, scale: 1.1 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <item.icon />
                </motion.div>
                <div>
                  <h3>{item.title}</h3>
                  <p>{item.detail}</p>
                </div>
                <motion.div
                  whileHover={{ scale: 1.2, rotate: 360 }}
                  transition={{ duration: 0.5 }}
                >
                  <Check />
                </motion.div>
              </motion.div>
            ))}
          </motion.div>
        </section>

        <section className="home-final">
          <motion.div {...fadeInUp}>
            <motion.div
              whileHover={{ rotate: 10, scale: 1.1 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <Building2 />
            </motion.div>
            <motion.p
              className="home-eyebrow"
              initial={{ opacity: 0, y: -20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              LET'S GET TO WORK
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
              Your next great day
              <br />
              starts here.
            </motion.h2>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button asChild className="home-primary">
                <Link to="/login">
                  Go to sign in
                  <ArrowRight />
                </Link>
              </Button>
            </motion.div>
          </motion.div>
        </section>
      </main>

      <motion.footer
        className="home-footer"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <p>BUILDCORE <span>ERP</span></p>
        <small>© 2026 BuildCore ERP</small>
        <motion.div whileHover={{ x: 5 }}>
          <Link to="/login">
            Your workspace
            <ArrowUpRight />
          </Link>
        </motion.div>
      </motion.footer>
    </div>
  );
}
