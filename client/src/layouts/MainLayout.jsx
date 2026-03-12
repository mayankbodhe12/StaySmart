import AppNavbar from "../components/AppNavbar";
import AppFooter from "../components/AppFooter";

export default function MainLayout({ children }) {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-slate-50 via-white to-slate-100 text-slate-900">
      
      {/* Navbar */}
      <AppNavbar />

      {/* Main content */}
      <main className="flex-1">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>

      {/* Footer */}
      <AppFooter />

    </div>
  );
}