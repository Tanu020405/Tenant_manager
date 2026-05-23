import { useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { authRoutes } from "../utils/api.js";
import { DarkModeToggle } from "../components/ui/DarkModeToggle.jsx";
import { Button } from "../components/ui/Button.jsx";
import { motion } from "framer-motion";

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] } },
};

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: null, text: "" });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: null, text: "" });

    try {
      const response = await axios.post(authRoutes.forgotPassword, { email });
      setMessage({ type: "success", text: response.data.message });
      setEmail("");
    } catch (err) {
      setMessage({
        type: "error",
        text: err.response?.data?.error?.message || err.response?.data?.message || "Something went wrong. Try again.",
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

      <div className="mx-auto flex min-h-screen w-full max-w-lg items-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="w-full glass-card rounded-3xl px-6 py-10 sm:px-10"
        >
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.08 } } }}
          >
            <motion.div variants={fadeUp} className="text-center">
              <img src="/logo.png" alt="PropConnect" className="mx-auto h-12 w-auto object-contain" />
              <h2 className="mt-6 text-2xl font-semibold font-headline text-on-surface">Reset your password</h2>
              <p className="mt-2 text-sm text-on-surface-variant">
                Enter your email and we will send you a secure reset link.
              </p>
            </motion.div>

            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              {message.text && (
                <motion.p variants={fadeUp} className={`rounded-xl border px-4 py-3 text-sm ${
                  message.type === "success"
                    ? "border-primary/20 bg-primary/10 text-primary"
                    : "border-error/20 bg-error-container/40 text-on-error-container"
                }`}>
                  {message.text}
                </motion.p>
              )}

              <motion.label variants={fadeUp} className="block space-y-2 text-sm">
                <span className="font-medium text-on-surface">Email address</span>
                <input
                  className="w-full rounded-xl ghost-border bg-surface-container-lowest/80 px-4 py-3 text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  required
                />
              </motion.label>

              <motion.div variants={fadeUp}>
                <Button type="submit" loading={loading} className="w-full" disabled={!email}>
                  {loading ? "Sending link..." : "Send reset link"}
                </Button>
              </motion.div>

              <motion.p variants={fadeUp} className="text-center text-sm text-on-surface-variant">
                Remember your password?{" "}
                <Link to="/login" className="font-semibold text-primary hover:opacity-80">
                  Back to login
                </Link>
              </motion.p>
            </form>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}

export default ForgotPassword;
