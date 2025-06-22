import { useState } from "react";
import { Outlet } from "react-router-dom";
import Navbar from "../Navbar";
import Header from "../Header";
import MobileHeader from "../MobileHeader";

export default function RootLayout() {
  const [navbarCollapsed, setNavbarCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gray-50">
      <Navbar
        collapsed={navbarCollapsed}
        setCollapsed={setNavbarCollapsed}
        mobileOpen={mobileNavOpen}
        setMobileOpen={setMobileNavOpen}
      />
      <div className={`flex-1 flex flex-col transition-all duration-300`}>
        {/* Desktop Header */}
        <div className="hidden lg:block">
          <Header />
        </div>

        {/* Mobile Header */}
        <div className="lg:hidden">
          <MobileHeader onMenuClick={() => setMobileNavOpen(true)} />
        </div>

        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
