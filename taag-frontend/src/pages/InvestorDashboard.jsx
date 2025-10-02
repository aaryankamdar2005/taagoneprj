import React from "react";
import { BarChart3, PieChart, DollarSign, Users } from "lucide-react";

const InvestorDashboard = () => {
  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-lg p-6 hidden md:block">
        <h1 className="text-2xl font-bold text-indigo-600 mb-8">Investor</h1>
        <ul className="space-y-4">
          <li className="cursor-pointer text-gray-700 hover:text-indigo-600">Dashboard</li>
          <li className="cursor-pointer text-gray-700 hover:text-indigo-600">Portfolio</li>
          <li className="cursor-pointer text-gray-700 hover:text-indigo-600">Investments</li>
          <li className="cursor-pointer text-gray-700 hover:text-indigo-600">Reports</li>
          <li className="cursor-pointer text-gray-700 hover:text-indigo-600">Settings</li>
        </ul>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 overflow-y-auto">
        {/* Navbar */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold">Dashboard</h2>
          <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg shadow hover:bg-indigo-700">
            + Add Investment
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white p-6 rounded-xl shadow flex items-center space-x-4">
            <DollarSign className="text-green-500 w-8 h-8" />
            <div>
              <p className="text-gray-500">Total Invested</p>
              <h3 className="text-xl font-bold">$50,000</h3>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow flex items-center space-x-4">
            <BarChart3 className="text-blue-500 w-8 h-8" />
            <div>
              <p className="text-gray-500">Returns</p>
              <h3 className="text-xl font-bold">$12,500</h3>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow flex items-center space-x-4">
            <Users className="text-purple-500 w-8 h-8" />
            <div>
              <p className="text-gray-500">Startups Funded</p>
              <h3 className="text-xl font-bold">8</h3>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow flex items-center space-x-4">
            <PieChart className="text-pink-500 w-8 h-8" />
            <div>
              <p className="text-gray-500">Portfolio Diversification</p>
              <h3 className="text-xl font-bold">5 Sectors</h3>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Recent Investments</h3>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b text-gray-600">
                <th className="p-3">Startup</th>
                <th className="p-3">Sector</th>
                <th className="p-3">Amount</th>
                <th className="p-3">Date</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b hover:bg-gray-50">
                <td className="p-3">FinTechX</td>
                <td className="p-3">Finance</td>
                <td className="p-3">$10,000</td>
                <td className="p-3">12 Sep 2025</td>
                <td className="p-3 text-green-600">Active</td>
              </tr>
              <tr className="border-b hover:bg-gray-50">
                <td className="p-3">Healthify</td>
                <td className="p-3">Healthcare</td>
                <td className="p-3">$7,500</td>
                <td className="p-3">5 Aug 2025</td>
                <td className="p-3 text-green-600">Active</td>
              </tr>
              <tr className="hover:bg-gray-50">
                <td className="p-3">EcoStart</td>
                <td className="p-3">Sustainability</td>
                <td className="p-3">$5,000</td>
                <td className="p-3">25 Jul 2025</td>
                <td className="p-3 text-red-500">Exited</td>
              </tr>
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
};

export default InvestorDashboard;
