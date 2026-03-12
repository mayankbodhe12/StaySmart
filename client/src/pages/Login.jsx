import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import useAuthStore from "../store/authStore";

export default function Login() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const loading = useAuthStore((s) => s.loading);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");

    const r = await login({ email, password });
    if (!r.ok) return setErr(r.message);

    if (r.user?.role === "host") {
      navigate("/host/listings");
    } else {
      navigate("/");
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100">
      <div className="mx-auto grid min-h-screen max-w-7xl items-center gap-10 px-4 py-8 sm:px-6 lg:grid-cols-2 lg:px-8">
        {/* Left panel */}
        <div className="relative hidden overflow-hidden rounded-[36px] border border-white/60 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 p-8 text-white shadow-[0_24px_80px_rgba(15,23,42,0.18)] lg:block lg:p-10">
          <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-12 -left-12 h-48 w-48 rounded-full bg-sky-300/10 blur-3xl" />

          <div className="relative z-[1]">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-medium text-white/80 shadow-sm sm:text-sm">
              <span>🔐 Secure guest access</span>
              <span className="text-white/30">•</span>
              <span>Welcome back to StaySmart</span>
            </div>

            <h1 className="mt-6 text-4xl font-extrabold leading-tight tracking-tight">
              Log in and continue your smart travel journey
            </h1>

            <p className="mt-4 max-w-xl text-sm leading-7 text-white/75 sm:text-base">
              Access your bookings, saved stays, host chats, trip planning, and
              premium stay discovery experience in one place.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="rounded-[24px] border border-white/10 bg-white/10 p-5">
                <div className="text-lg font-semibold">Customer access</div>
                <p className="mt-2 text-sm leading-6 text-white/75">
                  Explore stays, manage bookings, wishlist and compare listings.
                </p>
              </div>

              <div className="rounded-[24px] border border-white/10 bg-white/10 p-5">
                <div className="text-lg font-semibold">Host access</div>
                <p className="mt-2 text-sm leading-6 text-white/75">
                  Manage your listings, reviews, bookings and hosting workflow.
                </p>
              </div>

              <div className="rounded-[24px] border border-white/10 bg-white/10 p-5">
                <div className="text-lg font-semibold">Host Communication</div>
                <p className="mt-2 text-sm leading-6 text-white/75">
                  Stay connected with guests using booking chat.
                </p>
              </div>

              <div className="rounded-[24px] border border-white/10 bg-white/10 p-5">
                <div className="text-lg font-semibold">Travel Planner</div>
                <p className="mt-2 text-sm leading-6 text-white/75">
                  Discover recommendations that match your vibe.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right form */}
        <div className="mx-auto w-full max-w-md">
          <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] sm:p-8">
            <div className="mb-6">
              <Link
                to="/"
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm sm:text-sm"
              >
                <span>←</span>
                <span>Back to home</span>
              </Link>

              <h2 className="mt-5 text-3xl font-extrabold tracking-tight text-slate-900">
                Login
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Login once — StaySmart will automatically open the right
                experience for customer or host.
              </p>
            </div>

            {err && (
              <div className="mb-5 rounded-2xl bg-red-50 p-4 text-sm text-red-700">
                {err}
              </div>
            )}

            <form onSubmit={onSubmit} className="space-y-5">
              <div>
                <label className="text-sm font-medium text-slate-700">
                  Email
                </label>
                <input
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-black focus:ring-2 focus:ring-black"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  placeholder="Enter your email"
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">
                  Password
                </label>
                <input
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-black focus:ring-2 focus:ring-black"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type="password"
                  placeholder="Enter your password"
                  required
                />
              </div>

              <button
                disabled={loading}
                className="w-full rounded-2xl bg-black py-3 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-60"
              >
                {loading ? "Logging in..." : "Login"}
              </button>
            </form>

            <div className="mt-6 rounded-[22px] border border-slate-200 bg-slate-50 p-4">
              <div className="text-sm font-semibold text-slate-900">
                New to StaySmart?
              </div>
              <p className="mt-1 text-sm text-slate-500">
                Create an account first. You can start as a customer and become
                a host later.
              </p>

              <Link
                to="/register"
                className="mt-4 inline-flex rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Create account
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}