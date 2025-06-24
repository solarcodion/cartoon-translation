import { useState } from "react";
import { Outlet } from "react-router-dom";
import Navbar from "../Navbar";
import LayoutHeader from "../Header/LayoutHeader";

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
        {/* Combined Responsive Header */}
        <LayoutHeader onMenuClick={() => setMobileNavOpen(true)} />

        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
