import { useEffect, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import useAuthStore from "../store/authStore";
import { getCompareItems } from "../utils/compare";
import NotificationBell from "../components/NotificationBell";
import api from "../api/axios";

function NavItem({ to, children, onClick }) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        `rounded-full px-4 py-2 text-sm font-medium transition ${
          isActive
            ? "bg-slate-900 text-white"
            : "text-slate-700 hover:bg-slate-100"
        }`
      }
    >
      {children}
    </NavLink>
  );
}

function HostMenu({ open, onToggle, onClose }) {
  return (
    <div className="relative">
      <button
        type="button"
        onClick={onToggle}
        className={`rounded-full px-4 py-2 text-sm font-medium transition ${
          open
            ? "bg-slate-900 text-white"
            : "text-slate-700 hover:bg-slate-100"
        }`}
      >
        Host ▾
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+10px)] z-50 w-64 overflow-hidden rounded-3xl border border-slate-200 bg-white p-2 shadow-[0_20px_60px_rgba(15,23,42,0.14)]">
          <Link
            to="/host/listings"
            onClick={onClose}
            className="block rounded-2xl px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Host Dashboard
          </Link>

          <Link
            to="/host/bookings"
            onClick={onClose}
            className="block rounded-2xl px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Host Bookings
          </Link>

          <Link
            to="/host/analytics"
            onClick={onClose}
            className="block rounded-2xl px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Host Analytics
          </Link>

          <Link
            to="/host/reviews"
            onClick={onClose}
            className="block rounded-2xl px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Host Reviews
          </Link>

          <Link
            to="/host/listings/new"
            onClick={onClose}
            className="block rounded-2xl px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            New Listing
          </Link>
        </div>
      )}
    </div>
  );
}

function CompareMenuItem({ count, onClick }) {
  return (
    <NavLink
      to="/compare"
      onClick={onClick}
      className={({ isActive }) =>
        `inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${
          isActive
            ? "bg-slate-900 text-white"
            : "text-slate-700 hover:bg-slate-100"
        }`
      }
    >
      <span>Compare</span>
      <span
        className={`rounded-full px-2 py-0.5 text-xs ${
          count > 0
            ? "bg-white/20 text-inherit"
            : "bg-slate-100 text-slate-600"
        }`}
      >
        {count}
      </span>
    </NavLink>
  );
}

export default function AppNavbar() {
  const navigate = useNavigate();
  const location = useLocation();

  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const fetchMe = useAuthStore((s) => s.fetchMe);

  const [mobileOpen, setMobileOpen] = useState(false);
  const [hostMenuOpen, setHostMenuOpen] = useState(false);
  const [compareCount, setCompareCount] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  const [becomingHost, setBecomingHost] = useState(false);
  const [hostErr, setHostErr] = useState("");

  const isHost = user?.role === "host" || user?.role === "admin";
  const isGuest = user?.role === "guest";

  useEffect(() => {
    function syncCompare() {
      setCompareCount(getCompareItems().length);
    }

    syncCompare();
    window.addEventListener("storage", syncCompare);

    const interval = setInterval(syncCompare, 1000);

    return () => {
      window.removeEventListener("storage", syncCompare);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    function handleScroll() {
      setScrolled(window.scrollY > 40);
    }

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setHostMenuOpen(false);
    setHostErr("");
  }, [location.pathname]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (!e.target.closest("[data-host-menu]")) {
        setHostMenuOpen(false);
      }
    }

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  async function handleLogout() {
    await logout();
    setMobileOpen(false);
    setHostMenuOpen(false);
    navigate("/");
  }

  async function handleBecomeHost() {
    setHostErr("");
    try {
      setBecomingHost(true);
      await api.post("/users/become-host");
      await fetchMe();
      setMobileOpen(false);
      navigate("/host/listings");
    } catch (e) {
      setHostErr(e.response?.data?.message || "Failed to become host");
    } finally {
      setBecomingHost(false);
    }
  }

  function closeMobileMenu() {
    setMobileOpen(false);
  }

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "border-b border-slate-200 bg-white/80 backdrop-blur-xl shadow-sm"
          : "bg-white/95 backdrop-blur"
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link
          to="/"
          className="flex items-center gap-2"
          onClick={closeMobileMenu}
        >
          <div className="rounded-2xl bg-slate-900 px-3 py-2 text-sm font-bold text-white shadow-sm">
            SS
          </div>
          <div className="text-xl font-bold tracking-tight text-slate-900">
            Stay<span className="text-slate-500">Smart</span>
          </div>
        </Link>

        <nav className="hidden items-center gap-2 lg:flex">
          <NavItem to="/">Home</NavItem>
          <NavItem to="/listings">Explore</NavItem>
          <NavItem to="/wishlist">Wishlist</NavItem>
          <CompareMenuItem count={compareCount} />

          {user && <NavItem to="/bookings">My Bookings</NavItem>}

          {isHost && (
            <div data-host-menu>
              <HostMenu
                open={hostMenuOpen}
                onToggle={() => setHostMenuOpen((prev) => !prev)}
                onClose={() => setHostMenuOpen(false)}
              />
            </div>
          )}

          {user && <NotificationBell />}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          {user ? (
            <>
              {isGuest && (
                <button
                  onClick={handleBecomeHost}
                  disabled={becomingHost}
                  className="rounded-2xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
                >
                  {becomingHost ? "Switching..." : "Become Host"}
                </button>
              )}

              <div className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700">
                {user?.name || user?.email || "User"}
              </div>

              <button
                onClick={handleLogout}
                className="rounded-2xl bg-slate-900 px-5 py-2.5 text-sm font-medium text-white transition hover:opacity-90"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="rounded-2xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="rounded-2xl bg-slate-900 px-5 py-2.5 text-sm font-medium text-white transition hover:opacity-90"
              >
                Register
              </Link>
            </>
          )}
        </div>

        <div className="flex items-center gap-2 lg:hidden">
          {user && <NotificationBell />}

          <button
            onClick={() => setMobileOpen((prev) => !prev)}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm"
          >
            {mobileOpen ? "Close" : "Menu"}
          </button>
        </div>
      </div>

      {hostErr && (
        <div className="mx-auto max-w-7xl px-4 pb-2 sm:px-6 lg:px-8">
          <div className="rounded-xl bg-red-50 px-4 py-2 text-sm text-red-700">
            {hostErr}
          </div>
        </div>
      )}

      {mobileOpen && (
        <div className="border-t border-slate-200 bg-white lg:hidden">
          <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-4 sm:px-6 lg:px-8">
            <NavItem to="/" onClick={closeMobileMenu}>
              Home
            </NavItem>

            <NavItem to="/listings" onClick={closeMobileMenu}>
              Explore
            </NavItem>

            <NavItem to="/wishlist" onClick={closeMobileMenu}>
              Wishlist
            </NavItem>

            <CompareMenuItem count={compareCount} onClick={closeMobileMenu} />

            {user && (
              <NavItem to="/bookings" onClick={closeMobileMenu}>
                My Bookings
              </NavItem>
            )}

            {isHost && (
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-2">
                <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Host Menu
                </div>

                <Link
                  to="/host/listings"
                  onClick={closeMobileMenu}
                  className="block rounded-2xl px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-white"
                >
                  Host Dashboard
                </Link>

                <Link
                  to="/host/bookings"
                  onClick={closeMobileMenu}
                  className="block rounded-2xl px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-white"
                >
                  Host Bookings
                </Link>

                <Link
                  to="/host/analytics"
                  onClick={closeMobileMenu}
                  className="block rounded-2xl px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-white"
                >
                  Host Analytics
                </Link>

                <Link
                  to="/host/reviews"
                  onClick={closeMobileMenu}
                  className="block rounded-2xl px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-white"
                >
                  Host Reviews
                </Link>

                <Link
                  to="/host/listings/new"
                  onClick={closeMobileMenu}
                  className="block rounded-2xl px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-white"
                >
                  New Listing
                </Link>
              </div>
            )}

            <div className="mt-3 flex flex-col gap-2">
              {user ? (
                <>
                  {isGuest && (
                    <button
                      onClick={handleBecomeHost}
                      disabled={becomingHost}
                      className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-700 disabled:opacity-60"
                    >
                      {becomingHost ? "Switching..." : "Become Host"}
                    </button>
                  )}

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700">
                    {user?.name || user?.email || "User"}
                  </div>

                  <button
                    onClick={handleLogout}
                    className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-medium text-white"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={closeMobileMenu}
                    className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-700"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    onClick={closeMobileMenu}
                    className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-medium text-white"
                  >
                    Register
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}