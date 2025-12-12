import React, { useState } from "react";
import { Menu, X, ChevronDown, Truck } from "lucide-react";
import { Link } from "@inertiajs/react";
import clsx from "clsx";

export default function Header() {
  const [desktopRoutesOpen, setDesktopRoutesOpen] = useState(false);
  const [mobileRoutesOpen, setMobileRoutesOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/90 backdrop-blur-md shadow-sm">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-6 lg:px-8 py-4 relative z-50">
        {/* Logo + Brand */}
        <Link href="/login" className="flex items-center space-x-2 group">
          <Truck
            className="w-8 h-8 text-blue-600 group-hover:scale-110 transition-transform"
            strokeWidth={2}
          />
          <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight">
            Waste<span className="text-blue-600">Carrier</span>
            <span className="hidden sm:inline text-gray-600 font-semibold">
              {" "}Monitoring
            </span>
          </h1>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center space-x-6 text-gray-700 font-medium relative">
          <NavLink href="/">Home</NavLink>

          {/* Routes dropdown */}
          <div className="relative">
            <button
              onClick={() => setDesktopRoutesOpen(!desktopRoutesOpen)}
              className="flex items-center gap-1 transition-colors duration-200 hover:text-blue-600"
            >
              Routes
              <ChevronDown
                size={18}
                className={clsx(
                  "transition-transform duration-300",
                  desktopRoutesOpen && "rotate-180"
                )}
              />
            </button>

            {desktopRoutesOpen && (
              <div className="absolute top-full left-0 mt-3 w-44 bg-white shadow-xl rounded-xl border border-gray-100 py-2 animate-fadeIn">
                <DropdownLink href={route("Map")}>Map</DropdownLink>
                <DropdownLink href={route("ResHistory")}>Segments</DropdownLink>
              </div>
            )}
          </div>

          <NavLink href="/about">About</NavLink>
        </nav>

        {/* Mobile menu toggle */}
        <button
          className="md:hidden text-gray-800 hover:text-blue-600 transition z-50"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {/* Mobile Drawer */}
      <div
        className={clsx(
          "md:hidden fixed inset-y-0 right-0 w-64 max-w-full bg-white shadow-2xl border-l border-gray-200 transform transition-transform duration-300 ease-in-out z-40",
          mobileOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <nav className="flex flex-col p-6 space-y-4 text-gray-700 font-medium">
          <MobileLink href="/" onClick={() => setMobileOpen(false)}>
            Home
          </MobileLink>

          {/* Mobile Routes collapsible */}
          <div>
            <button
              onClick={() => setMobileRoutesOpen(!mobileRoutesOpen)}
              className="flex items-center justify-between w-full hover:text-blue-600 transition"
            >
              <span>Routes</span>
              <ChevronDown
                size={18}
                className={clsx(
                  "transition-transform duration-300",
                  mobileRoutesOpen && "rotate-180"
                )}
              />
            </button>

            {mobileRoutesOpen && (
              <div className="ml-4 mt-2 flex flex-col space-y-2">
                <MobileLink
                  href={route("Map")}
                  onClick={() => setMobileOpen(false)}
                >
                  Map
                </MobileLink>
                <MobileLink
                  href={route("ResHistory")}
                  onClick={() => setMobileOpen(false)}
                >
                  History
                </MobileLink>
              </div>
            )}
          </div>

          <MobileLink href="/about" onClick={() => setMobileOpen(false)}>
            About
          </MobileLink>
        </nav>
      </div>
    </header>
  );
}

/* --- Reusable Components --- */
function NavLink({ href, children }) {
  return (
    <Link href={href} className="relative group">
      <span className="transition-colors duration-200 group-hover:text-blue-600">
        {children}
      </span>
      <span className="absolute -bottom-1 left-0 w-0 h-[2px] bg-blue-600 transition-all duration-300 group-hover:w-full"></span>
    </Link>
  );
}

function DropdownLink({ href, children }) {
  return (
    <Link
      href={href}
      className="block px-4 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition rounded-lg"
    >
      {children}
    </Link>
  );
}

function MobileLink({ href, children, onClick }) {
  return (
    <Link
      href={href}
      className="block hover:text-blue-600 transition"
      onClick={onClick}
    >
      {children}
    </Link>
  );
}
