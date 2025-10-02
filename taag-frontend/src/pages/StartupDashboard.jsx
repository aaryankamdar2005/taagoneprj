import React, { useState } from "react";
import { Users, DollarSign, BarChart3 } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell, ResponsiveContainer
} from "recharts";

const StartupDashboard = () => {
  const [activePage, setActivePage] = useState("dashboard");

  const dealsData = [
    { name: "Jan", deals: 2 },
    { name: "Feb", deals: 5 },
    { name: "Mar", deals: 3 },
    { name: "Apr", deals: 6 },
  ];

  const distributionData = [
    { name: "Investors", value: 60 },
    { name: "Incubators", value: 40 },
  ];

  const COLORS = ["#6366F1", "#FACC15"];
  // Dashboard Home
  const DashboardHome = () => (
    <div>
      <h2 className="text-2xl font-semibold mb-6">Startup Overview</h2>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow flex items-center space-x-4">
          <DollarSign className="text-green-500 w-8 h-8" />
          <div>
            <p className="text-gray-500">Funding Raised</p>
            <h3 className="text-xl font-bold">$75,000</h3>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow flex items-center space-x-4">
          <Users className="text-indigo-500 w-8 h-8" />
          <div>
            <p className="text-gray-500">Interested Investors</p>
            <h3 className="text-xl font-bold">12</h3>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow flex items-center space-x-4">
          <BarChart3 className="text-pink-500 w-8 h-8" />
          <div>
            <p className="text-gray-500">Active Deals</p>
            <h3 className="text-xl font-bold">3</h3>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Bar Chart */}
        <div className="bg-white p-6 rounded-xl shadow">
          <h3 className="text-lg font-semibold mb-4">Deals Over Time</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dealsData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="deals" fill="#6366F1" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart */}
        <div className="bg-white p-6 rounded-xl shadow">
          <h3 className="text-lg font-semibold mb-4">Connections</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={distributionData}
                cx="50%"
                cy="50%"
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
                label
              >
                {distributionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Legend />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );

  // Interested Investors & Incubators
  const InterestedConnections = () => (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Interested Investors & Incubators</h2>
      <ul className="space-y-3">
        {["Investor A – FinTech Focus", "Incubator X – Early Stage", "Investor B – Healthcare"].map(
          (name, i) => (
            <li
              key={i}
              className="bg-white p-4 shadow rounded flex justify-between items-center"
            >
              <span>{name}</span>
              <button className="px-4 py-2 bg-yellow-400 rounded hover:bg-yellow-500 transition">
                View
              </button>
            </li>
          )
        )}
      </ul>
    </div>
  );

  // All Investors & Incubators
  const AllConnections = () => (
    <div>
      <h2 className="text-2xl font-semibold mb-4">All Investors & Incubators</h2>
      <div className="grid md:grid-cols-2 gap-4">
        {[
          "Investor Alpha – EdTech",
          "Investor Beta – AI/ML",
          "Incubator Delta – Seed Stage",
          "Incubator Gamma – Growth",
        ].map((name, i) => (
          <div
            key={i}
            className="bg-white p-4 rounded shadow flex justify-between items-center"
          >
            <span>{name}</span>
            <button className="px-4 py-2 bg-yellow-400 rounded hover:bg-yellow-500 transition">
              View
            </button>
          </div>
        ))}
      </div>
    </div>
  );

  // Pitch Video
  const PitchVideo = () => (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Pitch Video</h2>
      <div className="bg-white p-6 rounded shadow w-full max-w-lg">
        <input type="file" accept="video/*" className="mb-4" />
        <video controls className="w-full rounded">
          <source src="https://www.w3schools.com/html/mov_bbb.mp4" type="video/mp4" />
          Your browser does not support video playback.
        </video>
      </div>
    </div>
  );

  // Saved Deals
  const SavedDeals = () => (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Saved Deals</h2>
      <ul className="space-y-3">
        {[
          "Deal with Investor Alpha – $20,000",
          "Deal with Incubator Delta – 6 Month Program",
        ].map((deal, i) => (
          <li
            key={i}
            className="bg-white p-4 rounded shadow flex justify-between items-center"
          >
            <span>{deal}</span>
            <div className="flex gap-2">
              <button className="px-4 py-2 bg-yellow-400 rounded hover:bg-yellow-500 transition">
                View
              </button>
              <button className="px-4 py-2 bg-red-400 text-white rounded hover:bg-red-500 transition">
                Remove
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );

  // Current Deals
  const CurrentDeals = () => (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Current Deals</h2>
      <table className="w-full bg-white rounded shadow text-left">
        <thead>
          <tr className="border-b">
            <th className="p-3">Partner</th>
            <th className="p-3">Type</th>
            <th className="p-3">Amount</th>
            <th className="p-3">Status</th>
            <th className="p-3">Action</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b hover:bg-gray-50">
            <td className="p-3">Investor Beta</td>
            <td className="p-3">Investor</td>
            <td className="p-3">$30,000</td>
            <td className="p-3 text-green-600">Ongoing</td>
            <td className="p-3">
              <button className="px-3 py-1 bg-yellow-400 rounded hover:bg-yellow-500 transition">
                View
              </button>
            </td>
          </tr>
          <tr className="hover:bg-gray-50">
            <td className="p-3">Incubator Gamma</td>
            <td className="p-3">Incubator</td>
            <td className="p-3">Equity Support</td>
            <td className="p-3 text-yellow-600">Negotiation</td>
            <td className="p-3">
              <button className="px-3 py-1 bg-yellow-400 rounded hover:bg-yellow-500 transition">
                View
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );

  // Settings
  const SettingsPage = () => (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Settings</h2>
      <form className="bg-white p-6 rounded-lg shadow mt-4 space-y-4 w-96">
        <div>
          <label className="block text-gray-700 mb-1">Startup Name</label>
          <input type="text" placeholder="My Startup" className="border rounded px-3 py-2 w-full" />
        </div>
        <div>
          <label className="block text-gray-700 mb-1">Email</label>
          <input type="email" placeholder="founder@email.com" className="border rounded px-3 py-2 w-full" />
        </div>
        <button className="bg-indigo-600 text-white px-4 py-2 rounded shadow hover:bg-indigo-700">
          Save Changes
        </button>
      </form>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-lg p-6 hidden md:block">
        <h1 className="text-2xl font-bold text-indigo-600 mb-8">Startup</h1>
        <ul className="space-y-4">
          <li className={`cursor-pointer ${activePage === "dashboard" ? "text-indigo-600 font-semibold" : "text-gray-700"} hover:text-indigo-600`} onClick={() => setActivePage("dashboard")}>Dashboard</li>
          <li className={`cursor-pointer ${activePage === "interested" ? "text-indigo-600 font-semibold" : "text-gray-700"} hover:text-indigo-600`} onClick={() => setActivePage("interested")}>Interested Investors & Incubators</li>
          <li className={`cursor-pointer ${activePage === "all" ? "text-indigo-600 font-semibold" : "text-gray-700"} hover:text-indigo-600`} onClick={() => setActivePage("all")}>All Investors & Incubators</li>
          <li className={`cursor-pointer ${activePage === "pitch" ? "text-indigo-600 font-semibold" : "text-gray-700"} hover:text-indigo-600`} onClick={() => setActivePage("pitch")}>Pitch Video</li>
          <li className={`cursor-pointer ${activePage === "saved" ? "text-indigo-600 font-semibold" : "text-gray-700"} hover:text-indigo-600`} onClick={() => setActivePage("saved")}>Saved Deals</li>
          <li className={`cursor-pointer ${activePage === "current" ? "text-indigo-600 font-semibold" : "text-gray-700"} hover:text-indigo-600`} onClick={() => setActivePage("current")}>Current Deals</li>
          <li className={`cursor-pointer ${activePage === "settings" ? "text-indigo-600 font-semibold" : "text-gray-700"} hover:text-indigo-600`} onClick={() => setActivePage("settings")}>Settings</li>
        </ul>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 overflow-y-auto">
        {activePage === "dashboard" && <DashboardHome />}
        {activePage === "interested" && <InterestedConnections />}
        {activePage === "all" && <AllConnections />}
        {activePage === "pitch" && <PitchVideo />}
        {activePage === "saved" && <SavedDeals />}
        {activePage === "current" && <CurrentDeals />}
        {activePage === "settings" && <SettingsPage />}
      </main>
    </div>
  );
};

export default StartupDashboard;
