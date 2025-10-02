import React, { useState } from "react";
import { Users, DollarSign, BarChart3 } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell, ResponsiveContainer
} from "recharts";

const StartupDashboard = () => {
  const [activePage, setActivePage] = useState("dashboard");

  // Dummy chart data
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

  // Portfolio
  const [portfolioItems] = useState([
    { id: 1, name: "Pitch Deck v1" },
    { id: 2, name: "Financial Report Q1" },
  ]);

  // Pitch Videos
  const [pitches, setPitches] = useState([
    { id: 1, name: "Pitch Video 1", url: "https://www.w3schools.com/html/mov_bbb.mp4" },
  ]);
  const addPitch = () => {
    const name = prompt("Enter pitch name");
    const url = prompt("Enter video URL");
    if(name && url) setPitches([...pitches, { id: Date.now(), name, url }]);
  };
  const deletePitch = (id) => setPitches(pitches.filter(p => p.id !== id));

  // Tasks
  const [tasks, setTasks] = useState(["Complete Prototype", "Reach 5 Investors"]);
  const addTask = () => {
    const task = prompt("Enter task");
    if(task) setTasks([...tasks, task]);
  };
  const deleteTask = (index) => setTasks(tasks.filter((_, i) => i !== index));

  // Soft Commitments
  const [softCommitments, setSoftCommitments] = useState(["Investor Beta - Interested"]);
  const addCommitment = () => {
    const c = prompt("Enter commitment");
    if(c) setSoftCommitments([...softCommitments, c]);
  };
  const deleteCommitment = (index) => setSoftCommitments(softCommitments.filter((_, i) => i !== index));

  // Interested Investors / Incubators
  const interested = ["Investor A – FinTech", "Incubator X – Early Stage"];

  // All Incubators
  const incubators = ["Incubator Delta – Seed Stage", "Incubator Gamma – Growth"];

  // Dashboard Component
  const Dashboard = () => (
    <div>
      <h2 className="text-2xl font-semibold mb-6">Startup Overview</h2>
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
        <div className="bg-white p-6 rounded-xl shadow">
          <h3 className="text-lg font-semibold mb-4">Connections Distribution</h3>
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
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );

  // Portfolio
  const Portfolio = () => (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Portfolio</h2>
      <ul className="space-y-3">
        {portfolioItems.map((item) => (
          <li key={item.id} className="bg-white p-4 rounded shadow flex justify-between items-center">
            <span>{item.name}</span>
            <button className="px-4 py-2 bg-yellow-400 rounded hover:bg-yellow-500 transition">
              Download
            </button>
          </li>
        ))}
      </ul>
    </div>
  );

  // Pitch
  const Pitch = () => (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Pitch Videos</h2>
      <button onClick={addPitch} className="mb-4 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">
        Add Pitch
      </button>
      <ul className="space-y-3">
        {pitches.map((p) => (
          <li key={p.id} className="bg-white p-4 rounded shadow flex justify-between items-center">
            <span>{p.name}</span>
            <div className="flex gap-2">
              <a href={p.url} target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-green-400 rounded hover:bg-green-500 transition">View</a>
              <button className="px-4 py-2 bg-yellow-400 rounded hover:bg-yellow-500 transition">Download</button>
              <button onClick={() => deletePitch(p.id)} className="px-4 py-2 bg-red-400 text-white rounded hover:bg-red-500 transition">Delete</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );

  // Tasks
  const Tasks = () => (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Tasks</h2>
      <button onClick={addTask} className="mb-4 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">Add Task</button>
      <ul className="space-y-3">
        {tasks.map((t, i) => (
          <li key={i} className="bg-white p-4 rounded shadow flex justify-between items-center">
            <span>{t}</span>
            <button onClick={() => deleteTask(i)} className="px-4 py-2 bg-red-400 text-white rounded hover:bg-red-500 transition">Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );

  // Soft Commitments
  const SoftCommitments = () => (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Soft Commitments</h2>
      <button onClick={addCommitment} className="mb-4 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">Add Commitment</button>
      <ul className="space-y-3">
        {softCommitments.map((c, i) => (
          <li key={i} className="bg-white p-4 rounded shadow flex justify-between items-center">
            <span>{c}</span>
            <button onClick={() => deleteCommitment(i)} className="px-4 py-2 bg-red-400 text-white rounded hover:bg-red-500 transition">Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );

  // Incubators
  const Incubators = () => (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Incubators</h2>
      <ul className="space-y-3">
        {incubators.map((i, idx) => (
          <li key={idx} className="bg-white p-4 rounded shadow">{i}</li>
        ))}
      </ul>
    </div>
  );

  // Interested
  const Interested = () => (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Interested Investors & Incubators</h2>
      <ul className="space-y-3">
        {interested.map((i, idx) => (
          <li key={idx} className="bg-white p-4 rounded shadow">{i}</li>
        ))}
      </ul>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-lg p-6 hidden md:block">
        <h1 className="text-2xl font-bold text-indigo-600 mb-8">Startup</h1>
        <ul className="space-y-4">
          <li className={`cursor-pointer ${activePage === "dashboard" ? "text-indigo-600 font-semibold" : "text-gray-700"} hover:text-indigo-600`} onClick={() => setActivePage("dashboard")}>Dashboard</li>
          <li className={`cursor-pointer ${activePage === "portfolio" ? "text-indigo-600 font-semibold" : "text-gray-700"} hover:text-indigo-600`} onClick={() => setActivePage("portfolio")}>Portfolio</li>
          <li className={`cursor-pointer ${activePage === "pitch" ? "text-indigo-600 font-semibold" : "text-gray-700"} hover:text-indigo-600`} onClick={() => setActivePage("pitch")}>Pitch</li>
          <li className={`cursor-pointer ${activePage === "tasks" ? "text-indigo-600 font-semibold" : "text-gray-700"} hover:text-indigo-600`} onClick={() => setActivePage("tasks")}>Tasks</li>
          <li className={`cursor-pointer ${activePage === "soft" ? "text-indigo-600 font-semibold" : "text-gray-700"} hover:text-indigo-600`} onClick={() => setActivePage("soft")}>Soft Commitments</li>
          <li className={`cursor-pointer ${activePage === "incubators" ? "text-indigo-600 font-semibold" : "text-gray-700"} hover:text-indigo-600`} onClick={() => setActivePage("incubators")}>Incubators</li>
          <li className={`cursor-pointer ${activePage === "interested" ? "text-indigo-600 font-semibold" : "text-gray-700"} hover:text-indigo-600`} onClick={() => setActivePage("interested")}>Interested</li>
        </ul>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 overflow-y-auto">
        {activePage === "dashboard" && <Dashboard />}
        {activePage === "portfolio" && <Portfolio />}
        {activePage === "pitch" && <Pitch />}
        {activePage === "tasks" && <Tasks />}
        {activePage === "soft" && <SoftCommitments />}
        {activePage === "incubators" && <Incubators />}
        {activePage === "interested" && <Interested />}
      </main>
    </div>
  );
};

export default StartupDashboard;
