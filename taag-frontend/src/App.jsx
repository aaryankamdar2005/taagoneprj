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
import RegistrationStartup from "./pages/RegistrationStartup";
import RegistrationIncubator from "./pages/RegistrationIncubator";
import RegistrationInvestor from "./pages/RegistrationInvestor";
import MentorDashboard from "./pages/MentorDashboard";
import LoginMentor from "./pages/LoginMentor";

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
           <Route path="/login-mentor" element={<LoginMentor />} />
          <Route path="/startup" element={<StartupDashboard/>} />
          <Route path="/investor" element={<InvestorDashboard/>} />
          <Route path="/incubator" element={<IncubatorDashboard/>} />
           <Route path="/mentor" element={<MentorDashboard/>} />
          <Route path="/register-startup" element={<RegistrationStartup/>} />
          <Route path="/register-incubator" element={<RegistrationIncubator/>} />
          <Route path="/register-investor" element={<RegistrationInvestor/>} />
        </Routes>
      </div>
    </>
  );
}

export default App;
