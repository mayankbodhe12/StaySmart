import { Link } from "react-router-dom";

function FooterLink({ to, children }) {
  return (
    <Link
      to={to}
      className="text-sm text-slate-600 transition hover:text-slate-900"
    >
      {children}
    </Link>
  );
}

export default function AppFooter() {
  return (
    <footer className="mt-12 border-t border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2">
              <div className="rounded-2xl bg-slate-900 px-3 py-2 text-xs font-bold text-white shadow-sm">
                SS
              </div>
              <div className="text-xl font-bold tracking-tight text-slate-900">
                Stay<span className="text-slate-500">Smart</span>
              </div>
            </div>

            <p className="mt-3 max-w-sm text-sm leading-6 text-slate-500">
              Smart stays, premium hosting, split payments, travel planning and
              modern booking experiences in one platform.
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
                Premium stays
              </span>
              <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
                Split payments
              </span>
              <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
                Smart planner
              </span>
            </div>
          </div>

          {/* Explore */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              Explore
            </h3>
            <div className="mt-4 flex flex-col gap-2">
              <FooterLink to="/">Home</FooterLink>
              <FooterLink to="/listings">Listings</FooterLink>
              <FooterLink to="/wishlist">Wishlist</FooterLink>
              <FooterLink to="/compare">Compare</FooterLink>
            </div>
          </div>

          {/* Account */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              Account
            </h3>
            <div className="mt-4 flex flex-col gap-2">
              <FooterLink to="/login">Login</FooterLink>
              <FooterLink to="/register">Register</FooterLink>
              <FooterLink to="/bookings">My Bookings</FooterLink>
              <FooterLink to="/host/listings">Host Dashboard</FooterLink>
            </div>
          </div>

          {/* Platform */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              Platform
            </h3>
            <div className="mt-4 flex flex-col gap-2 text-sm text-slate-600">
              <span>Smart recommendations</span>
              <span>Split payments</span>
              <span>Wishlist & compare</span>
              <span>Host analytics</span>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-slate-200 bg-slate-50/80">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-4 text-xs text-slate-500 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <div>© 2026 StaySmart. All rights reserved.</div>
          <div>Designed for a premium Airbnb-style experience.</div>
        </div>
      </div>
    </footer>
  );
}