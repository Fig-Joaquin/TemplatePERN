import React from "react";
import { BellIcon } from "@heroicons/react/24/solid";

interface NavbarProps {
  username?: string;
  onLogout?: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ username, onLogout }) => {
  return (
    <nav className="fixed top-0 left-64 right-0 bg-white shadow px-6 h-16 flex items-center justify-between z-50">
      <h1 className="text-xl font-bold text-gray-800">Dashboard</h1>

      <div className="flex items-center space-x-6">
        <button className="relative">
          <BellIcon className="w-6 h-6 text-gray-600" />
          <span className="absolute -top-1 -right-2 px-1 py-0.5 text-xs font-bold text-white bg-red-600 rounded-full">
            3
          </span>
        </button>
        {username && <span className="text-gray-800 font-medium">{username}</span>}
        {onLogout && (
          <button onClick={onLogout} className="text-blue-600 hover:underline">
            Logout
          </button>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
