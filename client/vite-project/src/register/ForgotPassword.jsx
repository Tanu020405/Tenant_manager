import { useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { authRoutes } from "../utils/api.js";

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
    <div className="mx-auto mt-20 max-w-md space-y-8 rounded-3xl border border-slate-200/70 bg-[color:var(--color-surface)] p-8 shadow-sm shadow-slate-200/80">
      <div className="text-center">
        <img src="/logo.png" alt="PropConnect" className="mx-auto h-[80px] w-auto object-contain" />
        <h2 className="mt-6 text-3xl font-bold text-[color:var(--color-primary)]">Reset your password</h2>
        <p className="mt-2 text-sm text-[color:var(--color-muted)]">
          Enter your email and we'll send you a secure reset link.
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

        <label className="space-y-1 text-sm block">
          <span className="font-medium text-[color:var(--color-text)]">Email address</span>
          <input
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-base text-[color:var(--color-text)] focus:border-[color:var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-accent)]/30"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
            required
          />
        </label>

        <button
          type="submit"
          disabled={loading || !email}
          className="w-full rounded-xl bg-[color:var(--color-accent)] py-3 text-sm font-semibold text-white transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading ? "Sending link..." : "Send reset link"}
        </button>

        <p className="text-center text-sm text-[color:var(--color-muted)]">
          Remember your password?{" "}
          <Link to="/login" className="font-semibold text-[color:var(--color-accent)] hover:underline">
            Back to login
          </Link>
        </p>
      </form>
    </div>
  );
}

export default ForgotPassword;
