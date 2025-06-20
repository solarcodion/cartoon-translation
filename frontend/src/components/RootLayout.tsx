import { Outlet } from "react-router-dom";

export default function RootLayout() {
  return (
    <div className="app-layout">
      <header>
        <nav>{/* Navigation links can go here */}</nav>
      </header>
      <main>
        <Outlet />
      </main>
      <footer>{/* Footer content */}</footer>
    </div>
  );
}
