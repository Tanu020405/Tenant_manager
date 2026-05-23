import { useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { persistTheme } from "../utils/theme.js";
import { authRoutes } from "../utils/api.js";
import { DarkModeToggle } from "../components/ui/DarkModeToggle.jsx";
import { Button } from "../components/ui/Button.jsx";
import { motion } from "framer-motion";

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] } },
};

function Register() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: null, text: "" });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: null, text: "" });

    try {
      const response = await axios.post(authRoutes.register, formData);
      const { tenant } = response.data.data;

      if (tenant?.theme) {
        persistTheme(tenant.theme);
      }
      setMessage({
        type: "success",
        text: `Account ready for ${tenant?.name || formData.name}. You can log in now.`,
      });
      setFormData({
        name: "",
        email: "",
        password: "",
      });
    } catch (err) {
      console.error(err);
      setMessage({
        type: "error",
        text: err.response?.data?.error?.message || err.response?.data?.message || "Registration failed. Try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen auth-bg text-on-surface">
      <div className="absolute top-6 right-6 z-10">
        <DarkModeToggle />
      </div>

      <div className="mx-auto flex min-h-screen w-full max-w-6xl items-center px-4 py-12">
        <div className="grid w-full grid-cols-1 gap-8 lg:grid-cols-[0.9fr,1.1fr]">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="glass-card rounded-3xl px-6 py-10 sm:px-10"
          >
            <motion.div variants={stagger} initial="hidden" animate="visible">
              <motion.div variants={fadeUp} className="mb-8">
                <img src="/logo.png" alt="PropConnect" className="h-10 w-auto" />
                <h2 className="mt-4 text-2xl font-semibold font-headline text-on-surface">Create account</h2>
                <p className="mt-2 text-sm text-on-surface-variant">Set up your account and invite renters.</p>
              </motion.div>

              {message.text && (
                <motion.div variants={fadeUp} className={`mb-6 rounded-xl border px-4 py-3 text-sm ${
                  message.type === "success"
                    ? "border-primary/20 bg-primary/10 text-primary"
                    : "border-error/20 bg-error-container/40 text-on-error-container"
                }`}>
                  {message.text}
                </motion.div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <motion.label variants={fadeUp} className="block space-y-2 text-sm">
                  <span className="font-medium text-on-surface">Full name</span>
                  <input
                    type="text"
                    name="name"
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full rounded-xl ghost-border bg-surface-container-lowest/80 px-4 py-3 text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    required
                  />
                </motion.label>

                <motion.label variants={fadeUp} className="block space-y-2 text-sm">
                  <span className="font-medium text-on-surface">Email</span>
                  <input
                    type="email"
                    name="email"
                    placeholder="you@company.com"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full rounded-xl ghost-border bg-surface-container-lowest/80 px-4 py-3 text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    required
                  />
                </motion.label>

                <motion.label variants={fadeUp} className="block space-y-2 text-sm">
                  <span className="font-medium text-on-surface">Password</span>
                  <input
                    type="password"
                    name="password"
                    placeholder="At least 8 characters"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full rounded-xl ghost-border bg-surface-container-lowest/80 px-4 py-3 text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    minLength={8}
                    required
                  />
                </motion.label>

                <motion.div variants={fadeUp}>
                  <Button type="submit" loading={loading} className="w-full">
                    {loading ? "Creating..." : "Create account"}
                  </Button>
                </motion.div>
              </form>

              <motion.p variants={fadeUp} className="mt-6 text-center text-sm text-on-surface-variant">
                Already have an account?{" "}
                <Link to="/login" className="font-semibold text-primary hover:opacity-80">
                  Log in
                </Link>
              </motion.p>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="hidden lg:flex flex-col justify-between rounded-3xl bg-surface-container-lowest/70 p-10 shadow-ambient signal-surface"
          >
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-on-surface-variant">Account setup</p>
              <h1 className="mt-4 text-3xl font-semibold font-headline text-on-surface">
                Launch your PropConnect account
              </h1>
              <p className="mt-3 text-sm text-on-surface-variant leading-relaxed">
                Invite renters, organize properties, and track billing in a single interface.
              </p>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="space-y-3"
            >
              {[
                { icon: "🔒", text: "Bank-grade security" },
                { icon: "🎨", text: "Custom branding & themes" },
                { icon: "📧", text: "Automated email notifications" },
              ].map((item) => (
                <div key={item.text} className="flex items-center gap-3 rounded-xl border border-outline-variant/50 bg-surface-container-lowest/70 px-4 py-3">
                  <span className="text-lg">{item.icon}</span>
                  <p className="text-sm font-medium text-on-surface">{item.text}</p>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export default Register;
