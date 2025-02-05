interface NavbarProps {
  username?: string;
  onLogout: () => void;
}

const Navbar = ({ username, onLogout }: NavbarProps) => {
  return (
    <nav className="bg-gray-700 text-white p-4 shadow-md flex justify-between items-center">
      <h1 className="text-xl font-bold">Bienvenido, {username}</h1>
      <button
        onClick={onLogout}
        className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg transition"
      >
        Cerrar Sesión
      </button>
    </nav>
  );
};

export default Navbar;

