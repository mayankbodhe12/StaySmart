import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import useAuthStore from "../store/authStore";

export default function Register() {
  const navigate = useNavigate();
  const register = useAuthStore((s) => s.register);
  const loading = useAuthStore((s) => s.loading);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");

    const r = await register({ name, email, password });

    if (!r.ok) {
      setErr(r.message);
      return;
    }

    navigate("/");
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100">
      <div className="mx-auto grid min-h-screen max-w-7xl items-center gap-10 px-4 py-8 sm:px-6 lg:grid-cols-2 lg:px-8">
        {/* Left branding panel */}
        <div className="relative hidden overflow-hidden rounded-[36px] border border-white/60 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 p-8 text-white shadow-[0_24px_80px_rgba(15,23,42,0.18)] lg:block lg:p-10">
          <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-12 -left-12 h-48 w-48 rounded-full bg-sky-300/10 blur-3xl" />

          <div className="relative z-[1]">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-medium text-white/80">
              <span>🚀 Join StaySmart</span>
              <span className="text-white/30">•</span>
              <span>Start as a guest, host later</span>
            </div>

            <h1 className="mt-6 text-4xl font-extrabold leading-tight tracking-tight">
              Create your account and start booking smarter
            </h1>

            <p className="mt-4 max-w-xl text-sm leading-7 text-white/75 sm:text-base">
              Discover stays, plan trips, split payments with friends, save
              favorites, and manage bookings in one clean experience.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="rounded-[24px] border border-white/10 bg-white/10 p-5">
                <div className="text-lg font-semibold">Discover Stays</div>
                <p className="mt-2 text-sm text-white/75">
                  Explore premium properties and smart recommendations.
                </p>
              </div>

              <div className="rounded-[24px] border border-white/10 bg-white/10 p-5">
                <div className="text-lg font-semibold">Wishlist & Compare</div>
                <p className="mt-2 text-sm text-white/75">
                  Save favorites and compare stays side by side.
                </p>
              </div>

              <div className="rounded-[24px] border border-white/10 bg-white/10 p-5">
                <div className="text-lg font-semibold">Split Payments</div>
                <p className="mt-2 text-sm text-white/75">
                  Book with friends and divide the payment easily.
                </p>
              </div>

              <div className="rounded-[24px] border border-white/10 bg-white/10 p-5">
                <div className="text-lg font-semibold">Become a Host Later</div>
                <p className="mt-2 text-sm text-white/75">
                  Start as a customer and upgrade to hosting when ready.
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
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600"
              >
                ← Back to home
              </Link>

              <h2 className="mt-5 text-3xl font-extrabold tracking-tight text-slate-900">
                Create account
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Join StaySmart as a customer. You can become a host later from
                your account flow.
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
                  Full Name
                </label>
                <input
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-black focus:ring-2 focus:ring-black"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                  type="text"
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">
                  Email
                </label>
                <input
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-black focus:ring-2 focus:ring-black"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  type="email"
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
                  placeholder="Create password"
                  type="password"
                  required
                />
              </div>

              <button
                disabled={loading}
                className="w-full rounded-2xl bg-black py-3 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-60"
              >
                {loading ? "Creating account..." : "Create Account"}
              </button>
            </form>

            <div className="mt-6 rounded-[22px] border border-slate-200 bg-slate-50 p-4">
              <div className="text-sm font-semibold text-slate-900">
                Already have an account?
              </div>

              <p className="mt-1 text-sm text-slate-500">
                Login and StaySmart will automatically open the correct
                customer or host experience for you.
              </p>

              <Link
                to="/login"
                className="mt-4 inline-flex rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Login instead
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}