import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";

export default function RootLayout() {
  return (
    <div className="flex h-screen bg-gray-50">
      <aside className="w-64 h-full">
        <Navbar />
      </aside>
      <div className="flex-1 flex flex-col">
        <header className="h-24 border-b border-gray-200 bg-white flex items-center px-6">
          {/* Header content can go here */}
        </header>
        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
