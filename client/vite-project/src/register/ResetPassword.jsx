import { useState } from "react";
import axios from "axios";
import { Link, useParams } from "react-router-dom";
import { authRoutes } from "../utils/api.js";
import { DarkModeToggle } from "../components/ui/DarkModeToggle.jsx";
import { Button } from "../components/ui/Button.jsx";
import { motion } from "framer-motion";

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] } },
};

function ResetPassword() {
  const { token } = useParams();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: null, text: "" });

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password.length < 8) {
      return setMessage({ type: "error", text: "Password must be at least 8 characters." });
    }
    
    if (password !== confirmPassword) {
      return setMessage({ type: "error", text: "Passwords do not match." });
    }

    setLoading(true);
    setMessage({ type: null, text: "" });

    try {
      const response = await axios.post(authRoutes.resetPassword(token), { password });
      setMessage({ type: "success", text: response.data.message });
      setPassword("");
      setConfirmPassword("");
    } catch (err) {
      setMessage({
        type: "error",
        text: err.response?.data?.error?.message || err.response?.data?.message || "Invalid or expired reset link. Please request a new one.",
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
              <h2 className="mt-6 text-2xl font-semibold font-headline text-on-surface">Enter new password</h2>
              <p className="mt-2 text-sm text-on-surface-variant">
                Secure your account by choosing a strong, new password.
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
                <span className="font-medium text-on-surface">New Password</span>
                <input
                  className="w-full rounded-xl ghost-border bg-surface-container-lowest/80 px-4 py-3 text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  minLength={8}
                  required
                />
              </motion.label>
              
              <motion.label variants={fadeUp} className="block space-y-2 text-sm">
                <span className="font-medium text-on-surface">Confirm Password</span>
                <input
                  className="w-full rounded-xl ghost-border bg-surface-container-lowest/80 px-4 py-3 text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-type your new password"
                  required
                />
              </motion.label>

              <motion.div variants={fadeUp}>
                <Button
                  type="submit"
                  loading={loading}
                  className="w-full"
                  disabled={!password || !confirmPassword || message.type === "success"}
                >
                  {loading ? "Resetting..." : "Reset Password"}
                </Button>
              </motion.div>

              {message.type === "success" && (
                <motion.div variants={fadeUp}>
                  <Link
                    to="/login"
                    className="mt-2 block text-center w-full rounded-xl border border-primary/30 py-3 text-sm font-semibold text-primary transition hover:bg-primary hover:text-on-primary"
                  >
                    Go to Login
                  </Link>
                </motion.div>
              )}
            </form>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}

export default ResetPassword;
