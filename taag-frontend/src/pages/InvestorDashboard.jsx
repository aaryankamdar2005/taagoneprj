import React, { useState } from "react";
import { Users, DollarSign, BarChart3, MessageCircle } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

const dummyChartData = [
  { month: "Jan", investments: 5000 },
  { month: "Feb", investments: 12000 },
  { month: "Mar", investments: 9000 },
  { month: "Apr", investments: 15000 },
  { month: "May", investments: 20000 },
];

const InvestorDashboard = () => {
  const [activePage, setActivePage] = useState("dashboard");
  const [searchQuery, setSearchQuery] = useState("");
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");

  const startups = [
    "Startup A – FinTech",
    "Startup B – HealthTech",
    "Startup C – EdTech",
    "Startup D – AI/ML",
    "Startup E – E-commerce",
  ];

  // Dashboard Tab
  const Dashboard = () => (
    <div>
      <h2 className="text-2xl font-semibold mb-6">Investor Overview</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white p-6 rounded-xl shadow flex items-center space-x-4">
          <DollarSign className="text-green-500 w-8 h-8" />
          <div>
            <p className="text-gray-500">Total Invested</p>
            <h3 className="text-xl font-bold">$75,000</h3>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow flex items-center space-x-4">
          <Users className="text-indigo-500 w-8 h-8" />
          <div>
            <p className="text-gray-500">Interested Startups</p>
            <h3 className="text-xl font-bold">10</h3>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow flex items-center space-x-4">
          <BarChart3 className="text-pink-500 w-8 h-8" />
          <div>
            <p className="text-gray-500">Active Deals</p>
            <h3 className="text-xl font-bold">4</h3>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow h-64">
        <h3 className="text-lg font-semibold mb-2">Investments Over Time</h3>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={dummyChartData}>
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

  // Profile Tab
  const Profile = () => (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Profile</h2>
      <form className="bg-white p-6 rounded shadow w-full max-w-md space-y-4">
        <div>
          <label className="block text-gray-700 mb-1">Name</label>
          <input type="text" placeholder="Investor Name" className="border rounded px-3 py-2 w-full" />
        </div>
        <div>
          <label className="block text-gray-700 mb-1">Email</label>
          <input type="email" placeholder="investor@email.com" className="border rounded px-3 py-2 w-full" />
        </div>
        <div>
          <label className="block text-gray-700 mb-1">Phone</label>
          <input type="text" placeholder="+91 1234567890" className="border rounded px-3 py-2 w-full" />
        </div>
        <button className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700">Save Changes</button>
      </form>
    </div>
  );

  // Fetch Startups Tab
  const FetchStartups = () => {
    const filteredStartups = startups.filter((s) => s.toLowerCase().includes(searchQuery.toLowerCase()));

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
          {filteredStartups.map((name, i) => (
            <li key={i} className="bg-white p-4 rounded shadow flex justify-between items-center">
              <span>{name}</span>
              <div className="flex gap-2">
                <button className="px-3 py-1 bg-yellow-400 rounded hover:bg-yellow-500 transition" onClick={() => setChatOpen(true)}>
                  Chat
                </button>
                <button className="px-3 py-1 bg-green-400 rounded hover:bg-green-500 transition">Invest</button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    );
  };

  // Investment Commitments Tab
  const InvestmentCommitments = () => (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Investment Commitments</h2>
      <ul className="space-y-3">
        {["Invested $20,000 in Startup A", "Committed $15,000 to Startup B"].map((commitment, i) => (
          <li key={i} className="bg-white p-4 rounded shadow flex justify-between items-center">
            <span>{commitment}</span>
            <div className="flex gap-2">
              <button className="px-3 py-1 bg-yellow-400 rounded hover:bg-yellow-500 transition">View</button>
              <button className="px-3 py-1 bg-red-400 text-white rounded hover:bg-red-500 transition">Remove</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );

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
        {activePage === "dashboard" && <Dashboard />}
        {activePage === "profile" && <Profile />}
        {activePage === "fetch" && <FetchStartups />}
        {activePage === "commitments" && <InvestmentCommitments />}
        {chatOpen && <ChatBox />}
      </main>
    </div>
  );
};

export default InvestorDashboard;
