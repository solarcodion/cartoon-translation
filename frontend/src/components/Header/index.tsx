import ProfileDropdown from "./ProfileDropdown";

export default function Header() {
  return (
    <header className="h-24 border-b border-gray-200 bg-white flex items-center justify-between px-6">
      {/* Left side - could be used for breadcrumbs or page title in the future */}
      <div className="flex items-center">
        {/* Empty space for future breadcrumbs or page title */}
      </div>

      {/* Right side - User profile dropdown */}
      <div className="flex items-center">
        <ProfileDropdown />
      </div>
    </header>
  );
}
