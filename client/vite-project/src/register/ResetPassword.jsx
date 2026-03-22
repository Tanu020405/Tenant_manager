import { useState } from "react";
import axios from "axios";
import { Link, useParams } from "react-router-dom";
import { authRoutes } from "../utils/api.js";

function ResetPassword() {
  const { token } = useParams();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: null, text: "" });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
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
    <div className="mx-auto mt-20 max-w-md space-y-8 rounded-3xl border border-slate-200/70 bg-[color:var(--color-surface)] p-8 shadow-sm shadow-slate-200/80">
      <div className="text-center">
        <img src="/logo.png" alt="PropConnect" className="mx-auto h-[80px] w-auto object-contain" />
        <h2 className="mt-6 text-3xl font-bold text-[color:var(--color-primary)]">Enter new password</h2>
        <p className="mt-2 text-sm text-[color:var(--color-muted)]">
          Please secure your account by choosing a strong, new password.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-8 space-y-6 flex flex-col gap-2">
        {message.text && (
          <p className={`rounded-xl border px-3 py-2 text-sm ${
            message.type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-rose-200 bg-rose-50 text-rose-700"
          }`}>
            {message.text}
          </p>
        )}

        <label className="space-y-1 block text-sm">
          <span className="font-medium text-[color:var(--color-text)]">New Password</span>
          <input
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-base text-[color:var(--color-text)] focus:border-[color:var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-accent)]/30"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 6 characters"
            required
          />
        </label>
        
        <label className="space-y-1 block text-sm">
          <span className="font-medium text-[color:var(--color-text)]">Confirm Password</span>
          <input
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-base text-[color:var(--color-text)] focus:border-[color:var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-accent)]/30"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Re-type your new password"
            required
          />
        </label>

        <button
          type="submit"
          disabled={loading || !password || !confirmPassword || message.type === "success"}
          className="w-full rounded-xl bg-[color:var(--color-accent)] py-3 text-sm font-semibold text-white transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading ? "Resetting..." : "Reset Password"}
        </button>

        {message.type === "success" && (
          <Link
            to="/login"
            className="mt-4 block text-center w-full rounded-xl border border-[color:var(--color-accent)] py-3 text-sm font-semibold text-[color:var(--color-accent)] transition hover:bg-[color:var(--color-accent)] hover:text-white"
          >
            Go to Login
          </Link>
        )}
      </form>
    </div>
  );
}

export default ResetPassword;
