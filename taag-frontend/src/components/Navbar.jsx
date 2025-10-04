import { Link, useNavigate } from "react-router-dom";

function Navbar() {
  const navigate = useNavigate();

  return (
    <nav className="w-full px-10 py-4 flex items-center justify-between shadow-md bg-white fixed top-0 left-0 z-50">
      {/* Logo */}
      <div className="text-2xl font-bold text-black cursor-pointer">
        <Link to="/">TIX</Link>
      </div>

      {/* Center Links */}
      <div className="hidden md:flex gap-8 text-gray-700 font-medium">
        <Link to="/login-startup" className="hover:text-black transition">
          Startups
        </Link>
        <Link to="/login-investor" className="hover:text-black transition">
          Investors
        </Link>
        <Link to="/login-incubator" className="hover:text-black transition">
          Incubators
        </Link>
        
      </div>

      {/* Right: Login button */}
      <button
        onClick={() => navigate("/login-startup")} // you can change to default login page
        className="px-5 py-2 bg-yellow-400 rounded-full font-medium text-black hover:bg-yellow-500 transition"
      >
        Profile
      </button>
    </nav>
  );
}

export default Navbar;
