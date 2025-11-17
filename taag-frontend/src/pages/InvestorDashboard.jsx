import React, { useState, useEffect } from "react";
import { Users, DollarSign, BarChart3, MessageCircle, Search, ArrowLeft, CheckCircle, Clock, XCircle } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
const API = import.meta.env.VITE_API_URL;
// Authenticated fetch helper - WITH ERROR DETAILS
const fetchWithAuth = async (url, opts = {}) => {
  const token = localStorage.getItem("token");
  const res = await fetch(url, {
    ...opts,
    headers: {
      ...opts.headers,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    }
  });
  
  const contentType = res.headers.get("content-type") || "";
  
  if (!res.ok) {
    let errorMessage = `HTTP ${res.status}: ${res.statusText}`;
    
    if (contentType.includes("json")) {
      const errorData = await res.json();
      console.error('API Error Response:', errorData);
      errorMessage = errorData.message || errorData.error || errorMessage;
    } else {
      const errorText = await res.text();
      console.error('API Error Text:', errorText);
      errorMessage = errorText || errorMessage;
    }
    
    throw new Error(errorMessage);
  }
  
  if (contentType.includes("json")) {
    return await res.json();
  }
  
  throw new Error(await res.text());
};

const InvestorDashboard = () => {
  const [activePage, setActivePage] = useState("dashboard");
  const [searchQuery, setSearchQuery] = useState("");
  const [chatOpen, setChatOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState("");
  
  // Backend state
  const [dashboard, setDashboard] = useState({});
  const [profile, setProfile] = useState({});
  const [profileForm, setProfileForm] = useState({});
  const [startupDetails, setStartupDetails] = useState(null);
  const [currentStartupId, setCurrentStartupId] = useState(null);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);

  // Chat state
  const [chatList, setChatList] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [activeChatMessages, setActiveChatMessages] = useState([]);

  // Load initial data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [dashRes, profileRes] = await Promise.all([
        fetchWithAuth(`${API}/api/investor/dashboard`),
        fetchWithAuth(`${API}/api/investor/profile`)
      ]);
      setDashboard(dashRes.data || dashRes);
      setProfile(profileRes.data || profileRes);
      setLoading(false);
    } catch (e) {
      setError(e.message || String(e));
      setLoading(false);
    }
  };

  // Chat functions
  const loadChats = async () => {
    try {
      const res = await fetchWithAuth(`${API}/api/chat/chats`);
      setChatList((res.data || res).chats || []);
    } catch (e) {
      console.error('Error loading chats:', e);
    }
  };

  const openChat = async (startupId) => {
    try {
      const res = await fetchWithAuth(`${API}/api/chat/chats`, {
        method: "POST",
        body: JSON.stringify({ startupId })
      });
      
      const chat = res.data || res;
      setActiveChat(chat);
      await loadChatMessages(chat._id);
      setChatOpen(true);
      await loadChats();
    } catch (e) {
      setError("Could not open chat: " + (e.message || String(e)));
    }
  };

  const loadChatMessages = async (chatId) => {
    try {
      const res = await fetchWithAuth(`${API}/api/chat/chats/${chatId}/messages`);
      const data = res.data || res;
      setActiveChatMessages(data.messages || []);
    } catch (e) {
      console.error('Error loading messages:', e);
    }
  };

  const sendChatMessage = async () => {
    if (!inputMessage.trim() || !activeChat) return;
    
    try {
      await fetchWithAuth(`${API}/api/chat/chats/${activeChat._id}/messages`, {
        method: "POST",
        body: JSON.stringify({ message: inputMessage })
      });
      
      setInputMessage("");
      await loadChatMessages(activeChat._id);
      await loadChats();
    } catch (e) {
      setError("Could not send message: " + (e.message || String(e)));
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

    if (loading) {
      return <div className="text-center py-10">Loading dashboard...</div>;
    }

    return (
      <div>
        <h2 className="text-2xl font-semibold mb-6">Investor Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white p-6 rounded-xl shadow flex items-center space-x-4">
            <DollarSign className="text-green-500 w-8 h-8" />
            <div>
              <p className="text-gray-500">Total Invested</p>
              <h3 className="text-xl font-bold">₹{(dashboard.portfolio?.totalInvested || 0).toLocaleString()}</h3>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow flex items-center space-x-4">
            <CheckCircle className="text-indigo-500 w-8 h-8" />
            <div>
              <p className="text-gray-500">Portfolio Companies</p>
              <h3 className="text-xl font-bold">{dashboard.portfolio?.totalInvestments || 0}</h3>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow flex items-center space-x-4">
            <Users className="text-blue-500 w-8 h-8" />
            <div>
              <p className="text-gray-500">Interested Startups</p>
              <h3 className="text-xl font-bold">{dashboard.matchedStartups?.length || 0}</h3>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow flex items-center space-x-4">
            <BarChart3 className="text-pink-500 w-8 h-8" />
            <div>
              <p className="text-gray-500">Pending Commitments</p>
              <h3 className="text-xl font-bold">{dashboard.activities?.activeSoftCommitments?.length || 0}</h3>
            </div>
          </div>
        </div>

        {dashboard.investorInfo?.capacity?.totalCommitted > 0 && (
          <div className="bg-blue-50 p-4 rounded-xl shadow mb-6">
            <p className="text-sm text-gray-600">Total Pending Commitments</p>
            <p className="text-2xl font-bold text-blue-600">
              ₹{dashboard.investorInfo.capacity.totalCommitted.toLocaleString()}
            </p>
          </div>
        )}

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
      await fetchWithAuth(`${API}/api/investor/profile`, {
        method: "PUT",
        body: JSON.stringify(profileForm)
      });
      
      const profileRes = await fetchWithAuth(`${API}/api/investor/profile`);
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

  // View Startup Details
  const viewStartup = async (startupId) => {
    try {
      setError("");
      setCurrentStartupId(startupId);
      const res = await fetchWithAuth(`${API}/api/investor/startups/${startupId}`);
      setStartupDetails(res.data || res);
      setActivePage("startup-view");
    } catch (err) {
      setError("Could not load startup details: " + (err.message || String(err)));
    }
  };

  // Request Introduction
  const requestIntro = async () => {
    if (!currentStartupId) {
      setError("Startup ID not found");
      return;
    }

    const notes = prompt("Add a note (optional):");
    try {
      setError("");
      setLoading(true);
      
      await fetchWithAuth(`${API}/api/investor/startups/${currentStartupId}/intro-request`, {
        method: "POST",
        body: JSON.stringify({ notes })
      });
      
      setSuccessMsg("Introduction requested successfully!");
      await loadData();
      setLoading(false);
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err) {
      setError("Could not request introduction: " + (err.message || String(err)));
      setLoading(false);
    }
  };

  // Make Soft Commitment
  const makeInvestment = async () => {
    if (!currentStartupId) {
      setError("Startup ID not found");
      return;
    }

    const amount = prompt("Enter investment amount (₹):");
    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      setError("Please enter a valid amount");
      return;
    }
    
    const equity = prompt("Expected equity % (optional):");
    const conditions = prompt("Conditions (optional):");
    
    try {
      setError("");
      setLoading(true);
      
      await fetchWithAuth(`${API}/api/investor/startups/${currentStartupId}/soft-commit`, {
        method: "POST",
        body: JSON.stringify({
          amount: Number(amount),
          equityExpected: equity && equity.trim() !== '' ? Number(equity) : undefined,
          conditions: conditions && conditions.trim() !== '' ? conditions : undefined,
          expiryDays: 30
        })
      });
      
      setSuccessMsg("Soft commitment made successfully!");
      await loadData();
      setActivePage("commitments");
      setStartupDetails(null);
      setCurrentStartupId(null);
      setLoading(false);
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err) {
      setError("Could not make commitment: " + (err.message || String(err)));
      setLoading(false);
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
                <div className="flex items-center gap-3">
                  {startup.logoUrl && (
                    <img src={startup.logoUrl} alt="" className="w-10 h-10 rounded" />
                  )}
                  <div>
                    <p className="font-semibold">{startup.companyName}</p>
                    <p className="text-sm text-gray-600">{startup.industry} • {startup.stage}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button 
                    className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition flex items-center gap-1" 
                    onClick={() => openChat(startup._id)}
                  >
                    <MessageCircle size={16} />
                    Chat
                  </button>
                  <button 
                    className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 transition"
                    onClick={() => viewStartup(startup._id)}
                  >
                    View Details
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

  // Startup View Page
  const StartupView = () => {
    if (!startupDetails) return <p>Loading...</p>;

    const startup = startupDetails;

    return (
      <div>
        <button
          onClick={() => {
            setActivePage("fetch");
            setStartupDetails(null);
            setCurrentStartupId(null);
          }}
          className="flex items-center gap-2 text-indigo-600 hover:underline mb-4"
        >
          <ArrowLeft size={20} />
          Back to Startups
        </button>

        <div className="bg-white p-6 rounded shadow">
          <div className="flex items-start gap-4 mb-4">
            {startup.overview?.logoUrl && (
              <img src={startup.overview.logoUrl} alt="" className="w-20 h-20 rounded" />
            )}
            <div>
              <h2 className="text-2xl font-bold mb-2">{startup.overview?.companyName}</h2>
              <p className="text-gray-700 mb-4">{startup.overview?.oneLineDescription}</p>
            </div>
          </div>
          
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
            <button
              onClick={() => openChat(startup.overview._id)}
              className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 flex items-center gap-2"
            >
              <MessageCircle size={16} />
              Start Chat
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Investment Commitments Tab
  const InvestmentCommitments = () => {
    const softCommitments = dashboard.activities?.activeSoftCommitments || [];
    const portfolioInvestments = dashboard.activities?.portfolioInvestments || [];
    
    const totalCommitted = softCommitments.reduce((sum, c) => sum + (c.amount || 0), 0);
    const totalInvested = portfolioInvestments.reduce((sum, inv) => sum + (inv.investmentAmount || 0), 0);

    const convertToInvestment = async (commitmentId, commitment) => {
      const finalAmount = prompt(`Enter final investment amount (₹):`, commitment.amount);
      if (!finalAmount) return;

      const equityPercentage = prompt(`Enter equity percentage (%):`, commitment.equityExpected || '');
      if (!equityPercentage) return;

      const notes = prompt('Add any notes (optional):');

      try {
        setError("");
        setLoading(true);

        await fetchWithAuth(`${API}/api/investor/commitments/${commitmentId}/convert`, {
          method: "POST",
          body: JSON.stringify({
            finalAmount: Number(finalAmount),
            equityPercentage: Number(equityPercentage),
            notes
          })
        });

        setSuccessMsg("Investment completed successfully! Added to portfolio.");
        await loadData();
        setLoading(false);
        setTimeout(() => setSuccessMsg(""), 3000);
      } catch (err) {
        setError("Could not complete investment: " + (err.message || String(err)));
        setLoading(false);
      }
    };

    const withdrawCommitment = async (commitmentId) => {
      const reason = prompt("Reason for withdrawing (optional):");
      
      if (!window.confirm("Are you sure you want to withdraw this commitment?")) {
        return;
      }

      try {
        setError("");
        setLoading(true);

        await fetchWithAuth(`${API}/api/investor/commitments/${commitmentId}/withdraw`, {
          method: "POST",
          body: JSON.stringify({ reason })
        });

        setSuccessMsg("Commitment withdrawn successfully!");
        await loadData();
        setLoading(false);
        setTimeout(() => setSuccessMsg(""), 3000);
      } catch (err) {
        setError("Could not withdraw commitment: " + (err.message || String(err)));
        setLoading(false);
      }
    };

    return (
      <div>
        <h2 className="text-2xl font-semibold mb-6">Investments & Commitments</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-gradient-to-r from-green-50 to-green-100 p-6 rounded-xl shadow">
            <p className="text-sm text-gray-600 mb-1">Total Invested (Portfolio)</p>
            <p className="text-3xl font-bold text-green-600">₹{totalInvested.toLocaleString()}</p>
            <p className="text-sm text-gray-500 mt-1">
              {portfolioInvestments.length} {portfolioInvestments.length === 1 ? 'company' : 'companies'}
            </p>
          </div>
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-6 rounded-xl shadow">
            <p className="text-sm text-gray-600 mb-1">Pending Commitments</p>
            <p className="text-3xl font-bold text-blue-600">₹{totalCommitted.toLocaleString()}</p>
            <p className="text-sm text-gray-500 mt-1">
              {softCommitments.length} active {softCommitments.length === 1 ? 'commitment' : 'commitments'}
            </p>
          </div>
        </div>

        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <CheckCircle className="text-green-500" size={24} />
            Portfolio Investments
          </h3>
          {portfolioInvestments.length > 0 ? (
            <div className="space-y-4">
              {portfolioInvestments.map((investment, i) => (
                <div key={i} className="bg-white p-6 rounded-lg shadow hover:shadow-md transition">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      {investment.startupId?.logoUrl && (
                        <img 
                          src={investment.startupId.logoUrl} 
                          alt="" 
                          className="w-12 h-12 rounded object-cover"
                        />
                      )}
                      <div>
                        <p className="font-semibold text-lg">
                          {investment.startupId?.companyName || "Startup"}
                        </p>
                        <p className="text-sm text-gray-600">
                          {investment.startupId?.industry} • {investment.startupId?.stage}
                        </p>
                        {investment.startupId?.website && (
                          <a 
                            href={investment.startupId.website} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:underline"
                          >
                            Visit Website
                          </a>
                        )}
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded text-sm font-semibold ${
                      investment.status === 'active' ? 'bg-green-100 text-green-700' :
                      investment.status === 'exited' ? 'bg-blue-100 text-blue-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {investment.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                    <div className="bg-green-50 p-3 rounded">
                      <p className="text-xs text-gray-600 mb-1">Investment Amount</p>
                      <p className="text-lg font-bold text-green-700">
                        ₹{(investment.investmentAmount || 0).toLocaleString()}
                      </p>
                    </div>
                    <div className="bg-blue-50 p-3 rounded">
                      <p className="text-xs text-gray-600 mb-1">Equity Owned</p>
                      <p className="text-lg font-bold text-blue-700">
                        {investment.equityPercentage || 0}%
                      </p>
                    </div>
                    <div className="bg-purple-50 p-3 rounded">
                      <p className="text-xs text-gray-600 mb-1">Investment Date</p>
                      <p className="text-sm font-semibold text-purple-700">
                        {new Date(investment.investmentDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="bg-orange-50 p-3 rounded">
                      <p className="text-xs text-gray-600 mb-1">Current Valuation</p>
                      <p className="text-sm font-semibold text-orange-700">
                        {investment.currentValuation 
                          ? `₹${investment.currentValuation.toLocaleString()}`
                          : 'N/A'}
                      </p>
                    </div>
                  </div>

                  {investment.currentValuation && investment.investmentAmount && (
                    <div className="mt-3 p-3 bg-indigo-50 rounded">
                      <p className="text-sm font-semibold text-indigo-600">
                        ROI: {((investment.currentValuation - investment.investmentAmount) / investment.investmentAmount * 100).toFixed(2)}%
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-gray-50 p-8 rounded-lg text-center">
              <p className="text-gray-500">No portfolio investments yet</p>
              <p className="text-sm text-gray-400 mt-2">
                Convert your soft commitments to add companies to your portfolio
              </p>
            </div>
          )}
        </div>

        <div>
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Clock className="text-blue-500" size={24} />
            Pending Soft Commitments
          </h3>
          {softCommitments.length > 0 ? (
            <div className="space-y-4">
              {softCommitments.map((commitment, i) => (
                <div key={i} className="bg-white p-6 rounded-lg shadow hover:shadow-md transition border-l-4 border-blue-500">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      {commitment.startupId?.logoUrl && (
                        <img 
                          src={commitment.startupId.logoUrl} 
                          alt="" 
                          className="w-12 h-12 rounded object-cover"
                        />
                      )}
                      <div>
                        <p className="font-semibold text-lg">
                          {commitment.startupId?.companyName || "Startup"}
                        </p>
                        <p className="text-sm text-gray-600">
                          {commitment.startupId?.industry} • {commitment.startupId?.stage}
                        </p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded text-sm font-semibold ${
                      commitment.status === 'active' ? 'bg-yellow-100 text-yellow-700' :
                      commitment.status === 'converted' ? 'bg-green-100 text-green-700' :
                      commitment.status === 'expired' ? 'bg-red-100 text-red-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {commitment.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                    <div className="bg-blue-50 p-3 rounded">
                      <p className="text-xs text-gray-600 mb-1">Committed Amount</p>
                      <p className="text-lg font-bold text-blue-700">
                        ₹{(commitment.amount || 0).toLocaleString()}
                      </p>
                    </div>
                    {commitment.equityExpected && (
                      <div className="bg-purple-50 p-3 rounded">
                        <p className="text-xs text-gray-600 mb-1">Expected Equity</p>
                        <p className="text-lg font-bold text-purple-700">
                          {commitment.equityExpected}%
                        </p>
                      </div>
                    )}
                    <div className={`p-3 rounded ${
                      commitment.daysRemaining > 7 ? 'bg-green-50' :
                      commitment.daysRemaining > 0 ? 'bg-orange-50' : 'bg-red-50'
                    }`}>
                      <p className="text-xs text-gray-600 mb-1">Time Remaining</p>
                      <p className={`text-sm font-semibold ${
                        commitment.daysRemaining > 7 ? 'text-green-700' :
                        commitment.daysRemaining > 0 ? 'text-orange-700' : 'text-red-700'
                      }`}>
                        {commitment.daysRemaining > 0 
                          ? `${commitment.daysRemaining} days`
                          : commitment.daysRemaining === 0
                          ? 'Expires today'
                          : 'Expired'}
                      </p>
                    </div>
                  </div>

                  {commitment.conditions && (
                    <div className="mt-3 p-3 bg-gray-50 rounded">
                      <p className="text-sm text-gray-700">
                        <span className="font-semibold">Conditions:</span> {commitment.conditions}
                      </p>
                    </div>
                  )}

                  <div className="flex gap-2 text-sm text-gray-600 mt-3">
                    <span>Committed: {new Date(commitment.commitDate).toLocaleDateString()}</span>
                    {commitment.expiryDate && (
                      <span>• Expires: {new Date(commitment.expiryDate).toLocaleDateString()}</span>
                    )}
                  </div>

                  {commitment.status === 'active' && (
                    <div className="flex gap-2 mt-4">
                      <button 
                        onClick={() => convertToInvestment(commitment._id, commitment)}
                        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition text-sm font-semibold flex items-center gap-2"
                      >
                        <CheckCircle size={16} />
                        Complete Investment
                      </button>
                      <button 
                        onClick={() => withdrawCommitment(commitment._id)}
                        className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition text-sm flex items-center gap-2"
                      >
                        <XCircle size={16} />
                        Withdraw
                      </button>
                    </div>
                  )}

                  {commitment.status === 'converted' && (
                    <div className="mt-3 p-3 bg-green-50 rounded border border-green-200">
                      <p className="text-sm text-green-700 font-semibold">
                        ✓ Investment completed and added to portfolio
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-gray-50 p-8 rounded-lg text-center">
              <p className="text-gray-500">No pending commitments</p>
              <p className="text-sm text-gray-400 mt-2">
                Your soft commitments will appear here
              </p>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Chat component with auto-refresh
  const ChatBox = () => {
    useEffect(() => {
      if (chatOpen && !activeChat) {
        loadChats();
      }
    }, [chatOpen]);

    useEffect(() => {
      let interval;
      if (chatOpen && activeChat) {
        interval = setInterval(() => {
          loadChatMessages(activeChat._id);
        }, 5000);
      }
      return () => clearInterval(interval);
    }, [chatOpen, activeChat]);

    if (!activeChat) {
      return (
        <div className="fixed bottom-4 right-4 w-80 bg-white shadow-2xl rounded-xl flex flex-col h-96 z-50 border border-gray-200">
          <div className="flex items-center justify-between p-4 border-b bg-indigo-600 text-white rounded-t-xl">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <MessageCircle size={20} />
              Messages
            </h3>
            <button className="text-white font-bold hover:bg-indigo-700 rounded px-2" onClick={() => setChatOpen(false)}>✕</button>
          </div>
          <div className="flex-1 overflow-y-auto p-3">
            {chatList.length > 0 ? (
              <div className="space-y-2">
                {chatList.map((chat) => (
                  <div
                    key={chat._id}
                    onClick={() => {
                      setActiveChat(chat);
                      loadChatMessages(chat._id);
                    }}
                    className="p-3 hover:bg-gray-100 rounded cursor-pointer transition"
                  >
                    <div className="flex items-center gap-3">
                      {chat.participant.logoUrl && (
                        <img src={chat.participant.logoUrl} alt="" className="w-10 h-10 rounded-full object-cover" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">{chat.participant.name}</p>
                        <p className="text-xs text-gray-500 truncate">{chat.lastMessage || 'No messages yet'}</p>
                      </div>
                      {chat.unreadCount > 0 && (
                        <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1 font-semibold">
                          {chat.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center mt-10">
                <MessageCircle size={48} className="mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500">No conversations yet</p>
                <p className="text-xs text-gray-400 mt-1">Start chatting with startups!</p>
              </div>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="fixed bottom-4 right-4 w-96 bg-white shadow-2xl rounded-xl flex flex-col h-[500px] z-50 border border-gray-200">
        <div className="flex items-center justify-between p-4 border-b bg-indigo-600 text-white rounded-t-xl">
          <button 
            onClick={() => {
              setActiveChat(null);
              setActiveChatMessages([]);
            }}
            className="text-white hover:bg-indigo-700 rounded px-2"
          >
            ← Back
          </button>
          <h3 className="font-semibold text-lg flex items-center gap-2">
            {activeChat.participant?.logoUrl && (
              <img src={activeChat.participant.logoUrl} alt="" className="w-6 h-6 rounded-full" />
            )}
            {activeChat.participant?.name}
          </h3>
          <button className="text-white font-bold hover:bg-indigo-700 rounded px-2" onClick={() => {
            setChatOpen(false);
            setActiveChat(null);
            setActiveChatMessages([]);
          }}>✕</button>
        </div>
        <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-gray-50">
          {activeChatMessages.length > 0 ? (
            activeChatMessages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.senderType === 'investor' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] p-3 rounded-lg ${
                    msg.senderType === 'investor'
                      ? 'bg-indigo-600 text-white rounded-br-none'
                      : 'bg-white text-gray-800 rounded-bl-none shadow'
                  }`}
                >
                  <p className="text-sm break-words">{msg.message}</p>
                  <p className={`text-xs mt-1 ${msg.senderType === 'investor' ? 'text-indigo-200' : 'text-gray-400'}`}>
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center mt-10">
              <MessageCircle size={48} className="mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500">No messages yet</p>
              <p className="text-xs text-gray-400 mt-1">Start the conversation!</p>
            </div>
          )}
        </div>
        <div className="flex p-4 border-t gap-2 bg-white rounded-b-xl">
          <input
            type="text"
            className="flex-1 border rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
            placeholder="Type a message..."
          />
          <button
            className="px-4 py-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition"
            onClick={sendChatMessage}
          >
            Send
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-gray-100">
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
        
        <div className="mt-8 pt-6 border-t">
          <button
            onClick={() => {
              setChatOpen(true);
              loadChats();
            }}
            className="w-full flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition"
          >
            <MessageCircle size={18} />
            Messages
            {chatList.filter(c => c.unreadCount > 0).length > 0 && (
              <span className="ml-auto bg-red-500 text-white text-xs rounded-full px-2 py-1">
                {chatList.reduce((sum, c) => sum + c.unreadCount, 0)}
              </span>
            )}
          </button>
        </div>
      </aside>

      <main className="flex-1 p-6 overflow-y-auto relative">
        {loading && (
          <div className="fixed inset-0 bg-black bg-opacity-20 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <p className="text-lg font-semibold">Updating...</p>
            </div>
          </div>
        )}

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
