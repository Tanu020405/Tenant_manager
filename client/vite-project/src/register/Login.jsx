import { useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { persistTheme } from "../utils/theme.js";
import { authRoutes } from "../utils/api.js";

// No pre-filled tenants needed

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

      window.location.href = "/dashboard";
    } catch (err) {
      setError(err.response?.data?.error?.message || err.response?.data?.message || "Login failed. Check your credentials.");
      console.error("Login error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid gap-10 rounded-3xl border border-slate-200/70 bg-[color:var(--color-surface)] p-8 shadow-sm shadow-slate-200/80 lg:grid-cols-[1.05fr,1fr] lg:p-12">
      <section className="space-y-6">
        <img src="/logo.png" alt="PropConnect" className="h-[48px] w-auto object-contain" />
        <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-[color:var(--color-muted)]">
          Welcome back
        </span>
        <h1 className="text-3xl font-semibold text-[color:var(--color-primary)] sm:text-4xl">
          Welcome back!
        </h1>
        <p className="text-sm text-[color:var(--color-muted)] sm:text-base">
          Sign in to your account to pick up where you left off.
        </p>
      </section>

      <form
        className="flex w-full flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-inner"
        onSubmit={handleSubmit}
      >
        <div>
          <h2 className="text-xl font-semibold text-[color:var(--color-primary)]">Log in</h2>
          <p className="text-sm text-[color:var(--color-muted)]">
            Need an account?{" "}
            <Link to="/register" className="font-medium text-[color:var(--color-accent)]">
              Create one
            </Link>
          </p>
        </div>

        {error && (
          <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {error}
          </p>
        )}

        <label className="space-y-1 text-sm">
          <span className="font-medium text-[color:var(--color-text)]">Email</span>
          <input
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-base text-[color:var(--color-text)] focus:border-[color:var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-accent)]/30"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="you@company.com"
            required
          />
        </label>

        <label className="space-y-1 text-sm">
          <span className="font-medium text-[color:var(--color-text)]">Password</span>
          <input
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-base text-[color:var(--color-text)] focus:border-[color:var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-accent)]/30"
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="******"
            required
          />
        </label>


        <button
          type="submit"
          disabled={loading}
          className="mt-2 rounded-xl bg-[color:var(--color-accent)] py-3 text-sm font-semibold text-white transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading ? "Signing you in..." : "Access dashboard"}
        </button>
      </form>
    </div>
  );
}

export default Login;
