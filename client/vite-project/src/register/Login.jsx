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

function Login() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await axios.post(authRoutes.login, formData);
      const { user, tenant, token } = response.data.data;

      if (token) localStorage.setItem("token", token);
      if (user) localStorage.setItem("user", JSON.stringify(user));
      if (tenant?.theme) persistTheme(tenant.theme);

      window.location.href = "/";
    } catch (err) {
      console.error("Login error:", err);
      const errorMsg = err.response?.data?.error?.message || 
                       err.response?.data?.message || 
                       err.message || 
                       "Login failed. Check your credentials.";
      setError(errorMsg);
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
        <div className="grid w-full grid-cols-1 gap-8 lg:grid-cols-[1.1fr,0.9fr]">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="hidden lg:flex flex-col justify-between rounded-3xl bg-surface-container-lowest/70 p-10 shadow-ambient signal-surface"
          >
            <div>
              <img src="/logo.png" alt="PropConnect" className="h-12 w-auto" />
              <h1 className="mt-6 text-3xl font-semibold font-headline text-on-surface">
                Welcome back
              </h1>
              <p className="mt-3 text-sm text-on-surface-variant leading-relaxed">
                Manage properties, renters, and invoices with a clear, modern dashboard.
              </p>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="space-y-3"
            >
              {[
                { icon: "🏠", text: "Portfolio management" },
                { icon: "📊", text: "Real-time analytics" },
                { icon: "💳", text: "Automated invoicing" },
              ].map((item) => (
                <div key={item.text} className="flex items-center gap-3 rounded-xl border border-outline-variant/50 bg-surface-container-lowest/70 px-4 py-3">
                  <span className="text-lg">{item.icon}</span>
                  <p className="text-sm font-medium text-on-surface">{item.text}</p>
                </div>
              ))}
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="glass-card rounded-3xl px-6 py-10 sm:px-10"
          >
            <motion.div variants={stagger} initial="hidden" animate="visible">
              <motion.div variants={fadeUp} className="mb-8">
                <img src="/logo.png" alt="PropConnect" className="h-10 w-auto" />
                <h2 className="mt-4 text-2xl font-semibold font-headline text-on-surface">Sign in</h2>
                <p className="mt-2 text-sm text-on-surface-variant">Use your account credentials to continue.</p>
              </motion.div>

              {error && (
                <motion.div variants={fadeUp} className="mb-6 rounded-xl border border-error/20 bg-error-container/40 px-4 py-3 text-sm text-on-error-container">
                  {error}
                </motion.div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <motion.label variants={fadeUp} className="block space-y-2 text-sm">
                  <span className="font-medium text-on-surface">Email</span>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="you@company.com"
                    className="w-full rounded-xl ghost-border bg-surface-container-lowest/80 px-4 py-3 text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    required
                  />
                </motion.label>

                <motion.label variants={fadeUp} className="block space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-on-surface">Password</span>
                    <Link to="/forgot-password" className="text-xs font-semibold text-primary hover:opacity-80">
                      Forgot?
                    </Link>
                  </div>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className="w-full rounded-xl ghost-border bg-surface-container-lowest/80 px-4 py-3 text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    required
                  />
                </motion.label>

                <motion.div variants={fadeUp}>
                  <Button type="submit" loading={loading} className="w-full">
                    {loading ? "Signing in..." : "Sign in"}
                  </Button>
                </motion.div>
              </form>

              <motion.p variants={fadeUp} className="mt-6 text-center text-sm text-on-surface-variant">
                Need an account?{" "}
                <Link to="/register" className="font-semibold text-primary hover:opacity-80">
                  Create one
                </Link>
              </motion.p>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export default Login;
