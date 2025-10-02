import React, { useState } from "react";
import { Users, DollarSign, BarChart3, Layers, FileText, Settings } from "lucide-react";

const IncubatorDashboard = () => {
  const [activePage, setActivePage] = useState("dashboard");

  // Pages
  const DashboardHome = () => (
    <div>
      <h2 className="text-2xl font-semibold mb-6">Incubator Overview</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow flex items-center space-x-4">
          <Users className="text-indigo-500 w-8 h-8" />
          <div>
            <p className="text-gray-500">Startups Supported</p>
            <h3 className="text-xl font-bold">25</h3>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow flex items-center space-x-4">
          <DollarSign className="text-green-500 w-8 h-8" />
          <div>
            <p className="text-gray-500">Funds Distributed</p>
            <h3 className="text-xl font-bold">$200,000</h3>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow flex items-center space-x-4">
          <BarChart3 className="text-pink-500 w-8 h-8" />
          <div>
            <p className="text-gray-500">Success Rate</p>
            <h3 className="text-xl font-bold">68%</h3>
          </div>
        </div>
      </div>
    </div>
  );

  const Startups = () => (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Supported Startups</h2>
      <ul className="list-disc ml-6 text-gray-700 space-y-2">
        <li>AgriNext – AgriTech</li>
        <li>HealthHive – Healthcare</li>
        <li>EduSpark – EdTech</li>
        <li>EcoBuild – Sustainability</li>
      </ul>
    </div>
  );

  const Programs = () => (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Programs</h2>
      <p className="text-gray-600">Incubation and acceleration programs.</p>
      <div className="space-y-4 mt-4">
        <div className="bg-white shadow rounded-lg p-4">
          <p className="font-semibold">Seed Incubation Program</p>
          <p className="text-gray-600">Duration: 6 months | Focus: Early-stage startups</p>
        </div>
        <div className="bg-white shadow rounded-lg p-4">
          <p className="font-semibold">Growth Accelerator</p>
          <p className="text-gray-600">Duration: 3 months | Focus: Scale-up companies</p>
        </div>
      </div>
    </div>
  );

  const Reports = () => (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Reports</h2>
      <div className="bg-white shadow rounded-lg p-6">
        <p className="font-semibold">Q3 2025 Report</p>
        <p className="text-gray-600 mt-2">Funds Distributed: $200,000</p>
        <p className="text-gray-600">Active Startups: 25</p>
        <p className="text-gray-600">Graduated Startups: 12</p>
      </div>
    </div>
  );

  const SettingsPage = () => (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Settings</h2>
      <form className="bg-white p-6 rounded-lg shadow mt-4 space-y-4 w-96">
        <div>
          <label className="block text-gray-700 mb-1">Incubator Name</label>
          <input type="text" placeholder="ABC Incubator" className="border rounded px-3 py-2 w-full" />
        </div>
        <div>
          <label className="block text-gray-700 mb-1">Email</label>
          <input type="email" placeholder="incubator@email.com" className="border rounded px-3 py-2 w-full" />
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
        <h1 className="text-2xl font-bold text-indigo-600 mb-8">Incubator</h1>
        <ul className="space-y-4">
          <li className={`cursor-pointer ${activePage === "dashboard" ? "text-indigo-600 font-semibold" : "text-gray-700"} hover:text-indigo-600`} onClick={() => setActivePage("dashboard")}>Dashboard</li>
          <li className={`cursor-pointer ${activePage === "startups" ? "text-indigo-600 font-semibold" : "text-gray-700"} hover:text-indigo-600`} onClick={() => setActivePage("startups")}>Startups</li>
          <li className={`cursor-pointer ${activePage === "programs" ? "text-indigo-600 font-semibold" : "text-gray-700"} hover:text-indigo-600`} onClick={() => setActivePage("programs")}>Programs</li>
          <li className={`cursor-pointer ${activePage === "reports" ? "text-indigo-600 font-semibold" : "text-gray-700"} hover:text-indigo-600`} onClick={() => setActivePage("reports")}>Reports</li>
          <li className={`cursor-pointer ${activePage === "settings" ? "text-indigo-600 font-semibold" : "text-gray-700"} hover:text-indigo-600`} onClick={() => setActivePage("settings")}>Settings</li>
        </ul>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 overflow-y-auto">
        {activePage === "dashboard" && <DashboardHome />}
        {activePage === "startups" && <Startups />}
        {activePage === "programs" && <Programs />}
        {activePage === "reports" && <Reports />}
        {activePage === "settings" && <SettingsPage />}
      </main>
    </div>
  );
};

export default IncubatorDashboard;
