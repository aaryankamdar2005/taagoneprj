// src/IncubatorDashboard.jsx
import React, { useState } from "react";
import { Users, BarChart3, Settings, Star } from "lucide-react";

const IncubatorDashboard = () => {
  const [activePage, setActivePage] = useState("dashboard");

  // Dashboard with dummy charts
  const DashboardHome = () => (
    <div>
      <h2 className="text-2xl font-semibold mb-6">Incubator Overview</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow flex items-center space-x-4">
          <BarChart3 className="text-pink-500 w-8 h-8" />
          <div>
            <p className="text-gray-500">Total Applications</p>
            <h3 className="text-xl font-bold">45</h3>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow flex items-center space-x-4">
          <Users className="text-indigo-500 w-8 h-8" />
          <div>
            <p className="text-gray-500">Active Startups</p>
            <h3 className="text-xl font-bold">12</h3>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow flex items-center space-x-4">
          <Star className="text-yellow-500 w-8 h-8" />
          <div>
            <p className="text-gray-500">Average Review</p>
            <h3 className="text-xl font-bold">4.5/5</h3>
          </div>
        </div>
      </div>
    </div>
  );

  // Profile
  const ProfilePage = () => (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Profile</h2>
      <form className="bg-white p-6 rounded shadow space-y-4 w-96">
        <div>
          <label className="block text-gray-700 mb-1">Incubator Name</label>
          <input type="text" placeholder="My Incubator" className="border rounded px-3 py-2 w-full" />
        </div>
        <div>
          <label className="block text-gray-700 mb-1">Email</label>
          <input type="email" placeholder="incubator@email.com" className="border rounded px-3 py-2 w-full" />
        </div>
        <div>
          <label className="block text-gray-700 mb-1">Description</label>
          <textarea className="border rounded px-3 py-2 w-full" rows={3}></textarea>
        </div>
        <button className="bg-indigo-600 text-white px-4 py-2 rounded shadow hover:bg-indigo-700">
          Save Changes
        </button>
      </form>
    </div>
  );

  // Mentors info & reviews
  const MentorsPage = () => (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Mentors & Reviews</h2>
      <ul className="space-y-3">
        {[
          { name: "Mentor A", review: "Great guidance!" },
          { name: "Mentor B", review: "Helpful and insightful." },
          { name: "Mentor C", review: "Very supportive." },
        ].map((mentor, i) => (
          <li key={i} className="bg-white p-4 rounded shadow flex justify-between items-center">
            <div>
              <p className="font-semibold">{mentor.name}</p>
              <p className="text-gray-500">{mentor.review}</p>
            </div>
            <button className="px-4 py-2 bg-yellow-400 rounded hover:bg-yellow-500 transition">View</button>
          </li>
        ))}
      </ul>
    </div>
  );

  // Applications
  const ApplicationsPage = () => (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Applications</h2>
      <table className="w-full bg-white rounded shadow text-left">
        <thead>
          <tr className="border-b">
            <th className="p-3">Startup</th>
            <th className="p-3">Status</th>
            <th className="p-3">Action</th>
          </tr>
        </thead>
        <tbody>
          {[
            { name: "Startup X", status: "Pending" },
            { name: "Startup Y", status: "Accepted" },
            { name: "Startup Z", status: "Rejected" },
          ].map((app, i) => (
            <tr key={i} className="border-b hover:bg-gray-50">
              <td className="p-3">{app.name}</td>
              <td className="p-3">{app.status}</td>
              <td className="p-3">
                <button className="px-3 py-1 bg-yellow-400 rounded hover:bg-yellow-500 transition mr-2">View</button>
                <button className="px-3 py-1 bg-red-400 text-white rounded hover:bg-red-500 transition">Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  // Funnel analytics (dummy charts)
  const FunnelPage = () => (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Funnel Analytics</h2>
      <div className="bg-white p-6 rounded shadow w-full max-w-2xl">
        <p className="text-gray-500 mb-2">Lead Conversion Funnel (dummy data)</p>
        <div className="h-48 bg-gray-100 flex items-end justify-around">
          <div className="w-16 bg-indigo-600 h-32"></div>
          <div className="w-16 bg-indigo-400 h-24"></div>
          <div className="w-16 bg-indigo-300 h-16"></div>
          <div className="w-16 bg-indigo-200 h-8"></div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-lg p-6 hidden md:block">
        <h1 className="text-2xl font-bold text-indigo-600 mb-8">Incubator</h1>
        <ul className="space-y-4">
          <li className={`cursor-pointer ${activePage === "dashboard" ? "text-indigo-600 font-semibold" : "text-gray-700"} hover:text-indigo-600`} onClick={() => setActivePage("dashboard")}>Dashboard</li>
          <li className={`cursor-pointer ${activePage === "profile" ? "text-indigo-600 font-semibold" : "text-gray-700"} hover:text-indigo-600`} onClick={() => setActivePage("profile")}>Profile</li>
          <li className={`cursor-pointer ${activePage === "mentors" ? "text-indigo-600 font-semibold" : "text-gray-700"} hover:text-indigo-600`} onClick={() => setActivePage("mentors")}>Mentors & Reviews</li>
          <li className={`cursor-pointer ${activePage === "applications" ? "text-indigo-600 font-semibold" : "text-gray-700"} hover:text-indigo-600`} onClick={() => setActivePage("applications")}>Applications</li>
          <li className={`cursor-pointer ${activePage === "funnel" ? "text-indigo-600 font-semibold" : "text-gray-700"} hover:text-indigo-600`} onClick={() => setActivePage("funnel")}>Funnel Analytics</li>
        </ul>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 overflow-y-auto">
        {activePage === "dashboard" && <DashboardHome />}
        {activePage === "profile" && <ProfilePage />}
        {activePage === "mentors" && <MentorsPage />}
        {activePage === "applications" && <ApplicationsPage />}
        {activePage === "funnel" && <FunnelPage />}
      </main>
    </div>
  );
};

export default IncubatorDashboard;
