import React, { useState, useEffect } from "react";
import { Users, DollarSign, BarChart3, MessageCircle, Search, ArrowLeft } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

// Authenticated fetch helper
const fetchWithAuth = async (url, opts = {}) => {
  const token = localStorage.getItem("token");
  const res = await fetch(url, {
    ...opts,
    headers: {
      ...opts.headers,
      Authorization: `Bearer ${token}`,
      "Content-Type": opts.method && opts.method !== "GET" ? "application/json" : undefined
    }
  });
  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("json")) return await res.json();
  throw new Error(await res.text());
};

const InvestorDashboard = () => {
  const [activePage, setActivePage] = useState("dashboard");
  const [searchQuery, setSearchQuery] = useState("");
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  
  // Backend state
  const [dashboard, setDashboard] = useState({});
  const [profile, setProfile] = useState({});
  const [profileForm, setProfileForm] = useState({});
  const [startupDetails, setStartupDetails] = useState(null);
  const [currentStartupId, setCurrentStartupId] = useState(null); // ✅ ADD THIS
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Load initial data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [dashRes, profileRes] = await Promise.all([
        fetchWithAuth("http://localhost:5000/api/investor/dashboard"),
        fetchWithAuth("http://localhost:5000/api/investor/profile")
      ]);
      setDashboard(dashRes.data || dashRes);
      setProfile(profileRes.data || profileRes);
    } catch (e) {
      setError(e.message || String(e));
    }
  };

  // Generate chart data from portfolio
  const getChartData = () => {
    if (!dashboard.portfolio?.companies || dashboard.portfolio.companies.length === 0) {
      return [
        { month: "Jan", investments: 0 },
        { month: "Feb", investments: 0 },
        { month: "Mar", investments: 0 },
        { month: "Apr", investments: 0 },
        { month: "May", investments: 0 },
      ];
    }

    const monthlyData = {};
    dashboard.portfolio.companies.forEach(company => {
      if (company.investmentDate) {
        const date = new Date(company.investmentDate);
        const monthKey = date.toLocaleDateString('en-US', { month: 'short' });
        monthlyData[monthKey] = (monthlyData[monthKey] || 0) + (company.investmentAmount || 0);
      }
    });

    return Object.keys(monthlyData).map(month => ({
      month,
      investments: monthlyData[month]
    }));
  };

  // Dashboard Tab
  const Dashboard = () => {
    const chartData = getChartData();

    return (
      <div>
        <h2 className="text-2xl font-semibold mb-6">Investor Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white p-6 rounded-xl shadow flex items-center space-x-4">
            <DollarSign className="text-green-500 w-8 h-8" />
            <div>
              <p className="text-gray-500">Total Invested</p>
              <h3 className="text-xl font-bold">₹{(dashboard.investorInfo?.capacity?.currentlyInvested || 0).toLocaleString()}</h3>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow flex items-center space-x-4">
            <Users className="text-indigo-500 w-8 h-8" />
            <div>
              <p className="text-gray-500">Interested Startups</p>
              <h3 className="text-xl font-bold">{dashboard.matchedStartups?.length || 0}</h3>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow flex items-center space-x-4">
            <BarChart3 className="text-pink-500 w-8 h-8" />
            <div>
              <p className="text-gray-500">Active Deals</p>
              <h3 className="text-xl font-bold">{dashboard.activities?.activeSoftCommitments?.length || 0}</h3>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow h-64">
          <h3 className="text-lg font-semibold mb-2">Investments Over Time</h3>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="investments" stroke="#8884d8" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  // Profile Tab
  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    
    if (name.includes(".")) {
      const [parent, child] = name.split(".");
      setProfileForm({
        ...profileForm,
        [parent]: {
          ...(profileForm[parent] || {}),
          [child]: value
        }
      });
    } else {
      setProfileForm({ ...profileForm, [name]: value });
    }
  };

  const handleArrayInput = (field, value) => {
    const parts = field.split(".");
    const array = value.split(",").map(item => item.trim()).filter(item => item);
    
    if (parts.length === 2) {
      const [parent, child] = parts;
      setProfileForm({
        ...profileForm,
        [parent]: {
          ...(profileForm[parent] || {}),
          [child]: array
        }
      });
    }
  };

  const saveProfile = async () => {
    try {
      setError("");
      setSuccessMsg("");
      await fetchWithAuth("http://localhost:5000/api/investor/profile", {
        method: "PUT",
        body: JSON.stringify(profileForm)
      });
      
      const profileRes = await fetchWithAuth("http://localhost:5000/api/investor/profile");
      setProfile(profileRes.data || profileRes);
      setProfileForm({});
      
      setSuccessMsg("Profile updated successfully!");
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err) {
      setError("Could not update profile: " + (err.message || String(err)));
    }
  };

  const Profile = () => (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Profile</h2>
      <form className="bg-white p-6 rounded shadow w-full max-w-md space-y-4" onSubmit={(e) => { e.preventDefault(); saveProfile(); }}>
        <div>
          <label className="block text-gray-700 mb-1">Name</label>
          <input 
            type="text" 
            name="investorName"
            placeholder="Investor Name" 
            value={profileForm.investorName || ""}
            onChange={handleProfileChange}
            className="border rounded px-3 py-2 w-full" 
          />
        </div>
        <div>
          <label className="block text-gray-700 mb-1">Email</label>
          <input 
            type="email" 
            placeholder="investor@email.com" 
            className="border rounded px-3 py-2 w-full" 
            disabled
          />
        </div>
        <div>
          <label className="block text-gray-700 mb-1">Phone</label>
          <input 
            type="text" 
            placeholder="+91 1234567890" 
            className="border rounded px-3 py-2 w-full" 
            disabled
          />
        </div>
        <div>
          <label className="block text-gray-700 mb-1">Investor Type</label>
          <select 
            name="investorType"
            value={profileForm.investorType || ""}
            onChange={handleProfileChange}
            className="border rounded px-3 py-2 w-full"
          >
            <option value="">Select Type</option>
            <option value="angel">Angel Investor</option>
            <option value="vc-fund">VC Fund</option>
            <option value="family-office">Family Office</option>
            <option value="corporate">Corporate</option>
            <option value="individual">Individual</option>
          </select>
        </div>
        <div>
          <label className="block text-gray-700 mb-1">Total Funds Available (₹)</label>
          <input 
            type="number" 
            name="investmentCapacity.totalFundsAvailable"
            placeholder="50000000"
            value={profileForm.investmentCapacity?.totalFundsAvailable || ""}
            onChange={handleProfileChange}
            className="border rounded px-3 py-2 w-full" 
          />
        </div>
        <div>
          <label className="block text-gray-700 mb-1">Available Funds (₹)</label>
          <input 
            type="number" 
            name="investmentCapacity.availableFunds"
            placeholder="30000000"
            value={profileForm.investmentCapacity?.availableFunds || ""}
            onChange={handleProfileChange}
            className="border rounded px-3 py-2 w-full" 
          />
        </div>
        <div>
          <label className="block text-gray-700 mb-1">Preferred Industries (comma-separated)</label>
          <input 
            type="text" 
            placeholder="Technology, Healthcare, Finance"
            value={profileForm.investmentPreferences?.industries?.join(", ") || ""}
            onChange={(e) => handleArrayInput("investmentPreferences.industries", e.target.value)}
            className="border rounded px-3 py-2 w-full" 
          />
        </div>
        <div>
          <label className="block text-gray-700 mb-1">Preferred Stages (comma-separated)</label>
          <input 
            type="text" 
            placeholder="idea, mvp, growth"
            value={profileForm.investmentPreferences?.stages?.join(", ") || ""}
            onChange={(e) => handleArrayInput("investmentPreferences.stages", e.target.value)}
            className="border rounded px-3 py-2 w-full" 
          />
        </div>
        <div>
          <label className="block text-gray-700 mb-1">Min Investment (₹)</label>
          <input 
            type="number" 
            name="investmentPreferences.minInvestment"
            placeholder="1000000"
            value={profileForm.investmentPreferences?.minInvestment || ""}
            onChange={handleProfileChange}
            className="border rounded px-3 py-2 w-full" 
          />
        </div>
        <div>
          <label className="block text-gray-700 mb-1">Max Investment (₹)</label>
          <input 
            type="number" 
            name="investmentPreferences.maxInvestment"
            placeholder="50000000"
            value={profileForm.investmentPreferences?.maxInvestment || ""}
            onChange={handleProfileChange}
            className="border rounded px-3 py-2 w-full" 
          />
        </div>
        <div>
          <label className="block text-gray-700 mb-1">Risk Profile</label>
          <select 
            name="investmentPreferences.riskProfile"
            value={profileForm.investmentPreferences?.riskProfile || ""}
            onChange={handleProfileChange}
            className="border rounded px-3 py-2 w-full"
          >
            <option value="">Select Risk</option>
            <option value="conservative">Conservative</option>
            <option value="moderate">Moderate</option>
            <option value="aggressive">Aggressive</option>
          </select>
        </div>
        <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700">
          Save Changes
        </button>
      </form>
    </div>
  );

  // View Startup Details - ✅ FIXED
  const viewStartup = async (startupId) => {
    try {
      setError("");
      console.log("Viewing startup with ID:", startupId); // ✅ DEBUG LOG
      setCurrentStartupId(startupId); // ✅ STORE THE ID
      const res = await fetchWithAuth(`http://localhost:5000/api/investor/startups/${startupId}`);
      setStartupDetails(res.data || res);
      setActivePage("startup-view");
    } catch (err) {
      console.error("Error loading startup:", err); // ✅ DEBUG LOG
      setError("Could not load startup details: " + (err.message || String(err)));
    }
  };

  // Request Introduction - ✅ FIXED
  const requestIntro = async () => {
    if (!currentStartupId) {
      setError("Startup ID not found");
      return;
    }

    const notes = prompt("Add a note (optional):");
    try {
      setError("");
      console.log("Requesting intro for startup ID:", currentStartupId); // ✅ DEBUG LOG
      
      const response = await fetchWithAuth(`http://localhost:5000/api/investor/startups/${currentStartupId}/intro-request`, {
        method: "POST",
        body: JSON.stringify({ notes })
      });
      
      console.log("Intro request response:", response); // ✅ DEBUG LOG
      setSuccessMsg("Introduction requested successfully!");
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err) {
      console.error("Intro request error:", err); // ✅ DEBUG LOG
      setError("Could not request introduction: " + (err.message || String(err)));
    }
  };

  // Make Soft Commitment - ✅ FIXED
  const makeInvestment = async () => {
    if (!currentStartupId) {
      setError("Startup ID not found");
      return;
    }

    const amount = prompt("Enter investment amount (₹):");
    if (!amount) return;
    
    const equity = prompt("Expected equity % (optional):");
    const conditions = prompt("Conditions (optional):");
    
    try {
      setError("");
      console.log("Making soft commit for startup ID:", currentStartupId); // ✅ DEBUG LOG
      
      const response = await fetchWithAuth(`http://localhost:5000/api/investor/startups/${currentStartupId}/soft-commit`, {
        method: "POST",
        body: JSON.stringify({
          amount: Number(amount),
          equityExpected: equity ? Number(equity) : null,
          conditions,
          expiryDays: 30
        })
      });
      
      console.log("Soft commit response:", response); // ✅ DEBUG LOG
      setSuccessMsg("Soft commitment made successfully!");
      setTimeout(() => setSuccessMsg(""), 3000);
      loadData();
    } catch (err) {
      console.error("Soft commit error:", err); // ✅ DEBUG LOG
      setError("Could not make commitment: " + (err.message || String(err)));
    }
  };

  // Fetch Startups Tab
  const FetchStartups = () => {
    const startups = dashboard.matchedStartups || [];
    const filteredStartups = startups.filter((s) =>
      s.companyName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.industry?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
      <div>
        <h2 className="text-2xl font-semibold mb-4">Startups</h2>
        <input
          type="text"
          placeholder="Search startups..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="mb-4 w-full md:w-1/2 px-3 py-2 border rounded"
        />
        <ul className="space-y-3">
          {filteredStartups.length > 0 ? (
            filteredStartups.map((startup) => (
              <li key={startup._id} className="bg-white p-4 rounded shadow flex justify-between items-center">
                <span>{startup.companyName} – {startup.industry}</span>
                <div className="flex gap-2">
                  <button 
                    className="px-3 py-1 bg-yellow-400 rounded hover:bg-yellow-500 transition" 
                    onClick={() => setChatOpen(true)}
                  >
                    Chat
                  </button>
                  <button 
                    className="px-3 py-1 bg-green-400 rounded hover:bg-green-500 transition"
                    onClick={() => viewStartup(startup._id)}
                  >
                    Invest
                  </button>
                </div>
              </li>
            ))
          ) : (
            <p className="text-gray-500">No startups found</p>
          )}
        </ul>
      </div>
    );
  };

  // Startup View Page - ✅ FIXED
  const StartupView = () => {
    if (!startupDetails) return <p>Loading...</p>;

    const startup = startupDetails;

    return (
      <div>
        <button
          onClick={() => {
            setActivePage("fetch");
            setStartupDetails(null);
            setCurrentStartupId(null); // ✅ CLEAR ID
          }}
          className="flex items-center gap-2 text-indigo-600 hover:underline mb-4"
        >
          <ArrowLeft size={20} />
          Back to Startups
        </button>

        <div className="bg-white p-6 rounded shadow">
          <h2 className="text-2xl font-bold mb-2">{startup.overview?.companyName}</h2>
          <p className="text-gray-700 mb-4">{startup.overview?.oneLineDescription}</p>
          
          <div className="flex gap-2 mb-4">
            <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded text-sm">
              {startup.overview?.industry}
            </span>
            <span className="px-3 py-1 bg-green-100 text-green-700 rounded text-sm">
              {startup.overview?.stage}
            </span>
          </div>

          {startup.overview?.website && (
            <p className="text-sm mb-4">
              <a href={startup.overview.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                {startup.overview.website}
              </a>
            </p>
          )}

          {startup.overview?.pitch?.writtenPitch && (
            <div className="mb-4">
              <h3 className="font-semibold mb-2">Pitch</h3>
              <p className="text-gray-700">{startup.overview.pitch.writtenPitch}</p>
            </div>
          )}

          {startup.funding?.currentRound && (
            <div className="mb-4">
              <h3 className="font-semibold mb-2">Funding Ask</h3>
              <p className="text-2xl font-bold text-green-600 mb-1">
                ₹{startup.funding.currentRound.amount?.toLocaleString()}
              </p>
              <p className="text-sm text-gray-600 mb-2">Timeline: {startup.funding.currentRound.timeline}</p>
              {startup.funding.currentRound.useOfFunds && (
                <p className="text-sm text-gray-700">{startup.funding.currentRound.useOfFunds}</p>
              )}
            </div>
          )}

          {startup.traction?.metrics && Object.keys(startup.traction.metrics).length > 0 && (
            <div className="mb-4">
              <h3 className="font-semibold mb-2">Key Metrics</h3>
              <div className="grid grid-cols-2 gap-3">
                {startup.traction.metrics.monthlyRevenue !== undefined && (
                  <div className="bg-green-50 p-3 rounded">
                    <p className="text-xs text-gray-600">Monthly Revenue</p>
                    <p className="text-lg font-bold text-green-700">
                      ₹{startup.traction.metrics.monthlyRevenue.toLocaleString()}
                    </p>
                  </div>
                )}
                {startup.traction.metrics.growthRate && (
                  <div className="bg-blue-50 p-3 rounded">
                    <p className="text-xs text-gray-600">Growth Rate</p>
                    <p className="text-lg font-bold text-blue-700">{startup.traction.metrics.growthRate}</p>
                  </div>
                )}
                {startup.traction.metrics.customerCount !== undefined && (
                  <div className="bg-purple-50 p-3 rounded">
                    <p className="text-xs text-gray-600">Customers</p>
                    <p className="text-lg font-bold text-purple-700">
                      {startup.traction.metrics.customerCount.toLocaleString()}
                    </p>
                  </div>
                )}
                {startup.traction.metrics.teamSize !== undefined && (
                  <div className="bg-orange-50 p-3 rounded">
                    <p className="text-xs text-gray-600">Team Size</p>
                    <p className="text-lg font-bold text-orange-700">{startup.traction.metrics.teamSize}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {startup.market && (
            <div className="mb-4">
              <h3 className="font-semibold mb-2">Market</h3>
              <p className="text-gray-700">{startup.market.marketSize}</p>
            </div>
          )}

          <div className="flex gap-2 mt-6">
            <button
              onClick={requestIntro}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Request Intro
            </button>
            <button
              onClick={makeInvestment}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Make Investment
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Investment Commitments Tab
  const InvestmentCommitments = () => {
    const commitments = dashboard.activities?.activeSoftCommitments || [];

    return (
      <div>
        <h2 className="text-2xl font-semibold mb-4">Investment Commitments</h2>
        <ul className="space-y-3">
          {commitments.length > 0 ? (
            commitments.map((commitment, i) => (
              <li key={i} className="bg-white p-4 rounded shadow flex justify-between items-center">
                <span>
                  {commitment.startupId?.companyName || "Startup"} - ₹{commitment.amount?.toLocaleString()}
                  {commitment.equityExpected && ` (${commitment.equityExpected}% equity)`}
                </span>
                <div className="flex gap-2">
                  <button className="px-3 py-1 bg-yellow-400 rounded hover:bg-yellow-500 transition">View</button>
                  <button className="px-3 py-1 bg-red-400 text-white rounded hover:bg-red-500 transition">Remove</button>
                </div>
              </li>
            ))
          ) : (
            <p className="text-gray-500">No investment commitments yet</p>
          )}
        </ul>
      </div>
    );
  };

  // Chat component
  const ChatBox = () => (
    <div className="fixed bottom-4 right-4 w-80 bg-white shadow-lg rounded-xl flex flex-col h-96">
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="font-semibold text-lg">Chat</h3>
        <button className="text-red-500 font-bold" onClick={() => setChatOpen(false)}>X</button>
      </div>
      <div className="flex-1 p-4 overflow-y-auto space-y-2">
        {messages.map((msg, i) => (
          <div key={i} className={`p-2 rounded ${i % 2 === 0 ? "bg-gray-200 self-start" : "bg-indigo-100 self-end"}`}>
            {msg}
          </div>
        ))}
      </div>
      <div className="flex p-4 border-t gap-2">
        <input
          type="text"
          className="flex-1 border rounded px-2 py-1"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder="Type a message..."
        />
        <button
          className="px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition"
          onClick={() => {
            if (inputMessage.trim() !== "") {
              setMessages([...messages, inputMessage]);
              setInputMessage("");
            }
          }}
        >
          Send
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-lg p-6 hidden md:block">
        <h1 className="text-2xl font-bold text-indigo-600 mb-8">Investor</h1>
        <ul className="space-y-4">
          <li
            className={`cursor-pointer ${activePage === "dashboard" ? "text-indigo-600 font-semibold" : "text-gray-700"} hover:text-indigo-600`}
            onClick={() => setActivePage("dashboard")}
          >
            Dashboard
          </li>
          <li
            className={`cursor-pointer ${activePage === "profile" ? "text-indigo-600 font-semibold" : "text-gray-700"} hover:text-indigo-600`}
            onClick={() => setActivePage("profile")}
          >
            Profile
          </li>
          <li
            className={`cursor-pointer ${activePage === "fetch" ? "text-indigo-600 font-semibold" : "text-gray-700"} hover:text-indigo-600`}
            onClick={() => setActivePage("fetch")}
          >
            Fetch Startups
          </li>
          <li
            className={`cursor-pointer ${activePage === "commitments" ? "text-indigo-600 font-semibold" : "text-gray-700"} hover:text-indigo-600`}
            onClick={() => setActivePage("commitments")}
          >
            Investment Commitments
          </li>
        </ul>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 overflow-y-auto relative">
        {/* Error/Success Messages */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        {successMsg && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            {successMsg}
          </div>
        )}

        {activePage === "dashboard" && <Dashboard />}
        {activePage === "profile" && <Profile />}
        {activePage === "fetch" && <FetchStartups />}
        {activePage === "startup-view" && <StartupView />}
        {activePage === "commitments" && <InvestmentCommitments />}
        {chatOpen && <ChatBox />}
      </main>
    </div>
  );
};

export default InvestorDashboard;
