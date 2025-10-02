// src/App.jsx
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import LoginStartup from "./pages/LoginStartup";
import LoginInvestor from "./pages/LoginInvestor";
import LoginIncubator from "./pages/LoginIncubator";
import InvestorDashboard from "./pages/InvestorDashboard";
import IncubatorDashboard from "./pages/IncubatorDashboard";
import StartupDashboard from "./pages/StartupDashboard";

function App() {
  return (
    <>
      <Navbar />
      <div className="pt-20"> {/* Add padding so navbar doesn't cover content */}
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login-startup" element={<LoginStartup />} />
          <Route path="/login-investor" element={<LoginInvestor />} />
          <Route path="/login-incubator" element={<LoginIncubator />} />
          <Route path="/startup" element={<StartupDashboard/>} />
          <Route path="/investor" element={<InvestorDashboard/>} />
          <Route path="/incubator" element={<IncubatorDashboard/>} />
        </Routes>
      </div>
    </>
  );
}

export default App;
