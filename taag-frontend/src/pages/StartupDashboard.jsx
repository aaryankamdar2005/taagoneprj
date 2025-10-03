import React, { useState, useEffect } from "react";
import { Users, DollarSign, BarChart3, Calendar, FileText, Building2, CheckCircle2 } from "lucide-react";


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


const StartupDashboard = () => {
  const [activePage, setActivePage] = useState("dashboard");
  const [dashboard, setDashboard] = useState({});
  const [pitch, setPitch] = useState({});
  const [pitchForm, setPitchForm] = useState({});
  const [tasks, setTasks] = useState([]);
  const [taskForm, setTaskForm] = useState({});
  const [intros, setIntros] = useState([]);
  const [commitments, setCommitments] = useState([]);
  const [incubators, setIncubators] = useState([]);
  const [applications, setApplications] = useState([]);
  const [selectedIncubator, setSelectedIncubator] = useState(null);
  const [applicationForm, setApplicationForm] = useState({});
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");


  // Load initial data
  useEffect(() => {
    loadData();
  }, []);


  const loadData = async () => {
    try {
      const [dashRes, pitchRes, introsRes, commitsRes, incubsRes, appsRes] = await Promise.all([
        fetchWithAuth("http://localhost:5000/api/startup/dashboard"),
        fetchWithAuth("http://localhost:5000/api/startup/pitch"),
        fetchWithAuth("http://localhost:5000/api/startup/intro-requests"),
        fetchWithAuth("http://localhost:5000/api/startup/soft-commitments"),
        fetchWithAuth("http://localhost:5000/api/startup/incubators"),
        fetchWithAuth("http://localhost:5000/api/startup/applications")
      ]);
      
      setDashboard(dashRes.data || dashRes);
      setTasks((dashRes.data || dashRes).tasks || []);
      setPitch(pitchRes.data || pitchRes);
      setIntros((introsRes.data || introsRes).requests || []);
      setCommitments((commitsRes.data || commitsRes).commitments || []);
      setIncubators((incubsRes.data || incubsRes).incubators || []);
      setApplications((appsRes.data || appsRes).applications || []);
    } catch (e) {
      setError(e.message || String(e));
    }
  };


  // Dashboard Section
  const Dashboard = () => (
    <div>
      <h2 className="text-2xl font-semibold mb-6">Startup Overview</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow flex items-center space-x-4">
          <DollarSign className="text-green-500 w-8 h-8" />
          <div>
            <p className="text-gray-500">Funding Raised</p>
            <h3 className="text-xl font-bold">₹{(dashboard.fundraisingTracker?.totalRaised || 0).toLocaleString()}</h3>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow flex items-center space-x-4">
          <Users className="text-indigo-500 w-8 h-8" />
          <div>
            <p className="text-gray-500">Interested Investors</p>
            <h3 className="text-xl font-bold">{dashboard.investorActivity?.length || 0}</h3>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow flex items-center space-x-4">
          <BarChart3 className="text-pink-500 w-8 h-8" />
          <div>
            <p className="text-gray-500">Active Tasks</p>
            <h3 className="text-xl font-bold">{tasks.filter(t => t.status !== "completed").length}</h3>
          </div>
        </div>
      </div>


      {/* Recent Activity */}
      <div className="bg-white p-6 rounded-xl shadow mb-6">
        <h3 className="text-lg font-semibold mb-4">Recent Investor Activity</h3>
        {dashboard.investorActivity && dashboard.investorActivity.length > 0 ? (
          <ul className="space-y-3">
            {dashboard.investorActivity.slice(0, 5).map((activity, idx) => (
              <li key={idx} className="flex justify-between items-center border-b pb-2">
                <div>
                  <p className="font-semibold">{activity.investorName}</p>
                  <p className="text-sm text-gray-600">{activity.activityType}</p>
                </div>
                <p className="text-sm text-gray-500">{new Date(activity.date).toLocaleDateString()}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500">No investor activity yet</p>
        )}
      </div>


      {/* Fundraising Progress */}
      <div className="bg-white p-6 rounded-xl shadow">
        <h3 className="text-lg font-semibold mb-4">Fundraising Progress</h3>
        <div className="mb-2">
          <div className="flex justify-between text-sm mb-1">
            <span>Target: ₹{(dashboard.fundraisingTracker?.totalTarget || 0).toLocaleString()}</span>
            <span>Raised: ₹{(dashboard.fundraisingTracker?.totalRaised || 0).toLocaleString()}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4">
            <div 
              className="bg-indigo-600 h-4 rounded-full" 
              style={{ 
                width: `${Math.min(100, ((dashboard.fundraisingTracker?.totalRaised || 0) / (dashboard.fundraisingTracker?.totalTarget || 1)) * 100)}%` 
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );


  // Pitch Section
  const handlePitchChange = (e) => {
    const { name, value } = e.target;
    setPitchForm({ ...pitchForm, [name]: value });
  };


  const updatePitch = async () => {
    try {
      setError("");
      setSuccessMsg("");
      await fetchWithAuth("http://localhost:5000/api/startup/pitch", { 
        method: "PUT", 
        body: JSON.stringify(pitchForm) 
      });
      setPitch({ ...pitch, ...pitchForm });
      setPitchForm({});
      setSuccessMsg("Pitch updated successfully!");
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err) {
      setError("Could not update pitch: " + (err.message || String(err)));
    }
  };


  const PitchSection = () => (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Investor Pitch</h2>
      <div className="bg-white p-6 rounded-xl shadow">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { label: "Company Name", name: "companyName" },
            { label: "Website", name: "website" },
            { label: "One-line Description", name: "oneLineDescription" },
            { label: "Video URL", name: "videoUrl" },
            { label: "Written Pitch", name: "writtenPitch" },
            { label: "Funding Amount", name: "fundingAmount", type: "number" },
            { label: "Funding Timeline", name: "timeline" },
            { label: "Use Of Funds", name: "useOfFunds" },
            { label: "Monthly Revenue", name: "monthlyRevenue", type: "number" },
            { label: "Growth Rate", name: "growthRate" },
            { label: "Customer Count", name: "customerCount", type: "number" },
            { label: "Team Size", name: "teamSize", type: "number" },
            { label: "Market Size", name: "marketSize" },
            { label: "Key Traction Points", name: "keyTractionPoints" }
          ].map((field) => (
            <div key={field.name} className="mb-2">
              <label className="block font-semibold mb-1 text-sm">{field.label}</label>
              <input
                type={field.type || "text"}
                name={field.name}
                value={pitchForm[field.name] || ""}
                onChange={handlePitchChange}
                className="border border-gray-300 p-2 w-full rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder={field.label}
              />
            </div>
          ))}
        </div>
        <button 
          className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition"
          onClick={updatePitch}
        >
          Update Pitch
        </button>
      </div>
    </div>
  );


  // Tasks Section
  const handleTaskChange = (e) => {
    const { name, value } = e.target;
    setTaskForm({ ...taskForm, [name]: value });
  };


  const addTask = async () => {
    try {
      setError("");
      const saved = await fetchWithAuth("http://localhost:5000/api/startup/tasks", { 
        method: "POST", 
        body: JSON.stringify(taskForm) 
      });
      setTasks([...tasks, saved?.data || saved]);
      setTaskForm({});
      setSuccessMsg("Task added successfully!");
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err) {
      setError("Could not add task: " + (err.message || String(err)));
    }
  };


  const updateTaskStatus = async (taskId, status) => {
    try {
      setError("");
      await fetchWithAuth(`http://localhost:5000/api/startup/tasks/${taskId}`, { 
        method: "PUT", 
        body: JSON.stringify({ status }) 
      });
      setTasks(tasks.map(t => t._id === taskId ? { ...t, status } : t));
      setSuccessMsg("Task updated!");
      setTimeout(() => setSuccessMsg(""), 2000);
    } catch (err) {
      setError("Could not update task: " + (err.message || String(err)));
    }
  };


  const TaskSection = () => (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Tasks</h2>
      
      {/* Add Task Form */}
      <div className="bg-white p-6 rounded-xl shadow mb-6">
        <h3 className="text-lg font-semibold mb-4">Add New Task</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <input
            type="text"
            name="title"
            placeholder="Task Title"
            value={taskForm.title || ""}
            onChange={handleTaskChange}
            className="border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <input
            type="text"
            name="description"
            placeholder="Description"
            value={taskForm.description || ""}
            onChange={handleTaskChange}
            className="border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <select
            name="priority"
            value={taskForm.priority || "medium"}
            onChange={handleTaskChange}
            className="border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="low">Low Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="high">High Priority</option>
          </select>
          <input
            type="date"
            name="dueDate"
            value={taskForm.dueDate || ""}
            onChange={handleTaskChange}
            className="border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <button
          onClick={addTask}
          className="px-6 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition"
        >
          Add Task
        </button>
      </div>


      {/* Tasks List */}
      <div className="bg-white p-6 rounded-xl shadow">
        <h3 className="text-lg font-semibold mb-4">Your Tasks</h3>
        {tasks.length > 0 ? (
          <ul className="space-y-3">
            {tasks.map((task) => (
              <li
                key={task._id}
                className="flex justify-between items-center border-b pb-3"
              >
                <div className="flex-1">
                  <p className="font-semibold">{task.title}</p>
                  <p className="text-sm text-gray-600">{task.description}</p>
                  <div className="flex gap-2 mt-1">
                    <span className={`text-xs px-2 py-1 rounded ${
                      task.priority === "high" ? "bg-red-100 text-red-700" :
                      task.priority === "medium" ? "bg-yellow-100 text-yellow-700" :
                      "bg-green-100 text-green-700"
                    }`}>
                      {task.priority}
                    </span>
                    {task.dueDate && (
                      <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-700">
                        Due: {new Date(task.dueDate).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
                <select
                  className="border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={task.status}
                  onChange={(e) => updateTaskStatus(task._id, e.target.value)}
                >
                  <option value="pending">Pending</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500">No tasks yet. Add your first task above!</p>
        )}
      </div>
    </div>
  );


  // Intro Requests Section - COMPLETE VERSION
  const respondToIntro = async (requestId, status, meetingDate = null) => {
    try {
      setError("");
      const body = { status };
      if (meetingDate) body.meetingDate = meetingDate;
      
      await fetchWithAuth(`http://localhost:5000/api/startup/intro-requests/${requestId}`, {
        method: "PUT",
        body: JSON.stringify(body)
      });
      
      setIntros(intros.map(intro => 
        intro._id === requestId ? { ...intro, status, meetingDate } : intro
      ));
      setSuccessMsg(`Intro request ${status}!`);
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err) {
      setError("Could not respond to intro: " + (err.message || String(err)));
    }
  };


  const IntroRequestsSection = () => (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Intro Requests</h2>
      <div className="bg-white p-6 rounded-xl shadow">
        {intros.length > 0 ? (
          <div className="space-y-4">
            {intros.map((intro) => (
              <div key={intro._id} className="border border-gray-200 p-4 rounded-lg">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-lg">{intro.investorName}</h3>
                    <p className="text-sm text-gray-600">{intro.investorType}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Requested: {new Date(intro.requestDate).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded text-sm ${
                    intro.status === "pending" ? "bg-yellow-100 text-yellow-700" :
                    intro.status === "approved" ? "bg-green-100 text-green-700" :
                    intro.status === "declined" ? "bg-red-100 text-red-700" :
                    "bg-blue-100 text-blue-700"
                  }`}>
                    {intro.status}
                  </span>
                </div>
                
                {intro.notes && (
                  <p className="text-sm text-gray-700 mb-3 p-2 bg-gray-50 rounded">
                    {intro.notes}
                  </p>
                )}

                {intro.status === "pending" && (
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => respondToIntro(intro._id, "approved")}
                      className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition text-sm"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => {
                        const date = prompt("Enter meeting date (YYYY-MM-DD):");
                        if (date) respondToIntro(intro._id, "meeting-scheduled", date);
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition text-sm"
                    >
                      Schedule Meeting
                    </button>
                    <button
                      onClick={() => respondToIntro(intro._id, "declined")}
                      className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition text-sm"
                    >
                      Decline
                    </button>
                  </div>
                )}

                {intro.meetingDate && (
                  <p className="text-sm text-blue-600 mt-2">
                    Meeting: {new Date(intro.meetingDate).toLocaleDateString()}
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No intro requests yet</p>
        )}
      </div>
    </div>
  );


  // Soft Commitments Section
  const respondToCommitment = async (commitmentId, action) => {
    try {
      setError("");
      let body = { action };
      
      if (action === "counter") {
        const counterOffer = prompt("Enter your counter offer:");
        if (!counterOffer) return;
        body.counterOffer = counterOffer;
      }
      
      if (action === "accept" || action === "decline") {
        const notes = prompt("Add any notes (optional):");
        if (notes) body.responseNotes = notes;
      }

      await fetchWithAuth(`http://localhost:5000/api/startup/soft-commitments/${commitmentId}`, {
        method: "PUT",
        body: JSON.stringify(body)
      });
      
      // Reload data to reflect changes
      const commitsRes = await fetchWithAuth("http://localhost:5000/api/startup/soft-commitments");
      setCommitments((commitsRes.data || commitsRes).commitments || []);
      
      setSuccessMsg(`Commitment ${action}ed successfully!`);
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err) {
      setError("Could not respond to commitment: " + (err.message || String(err)));
    }
  };


  const SoftCommitmentsSection = () => (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Soft Commitments</h2>
      <div className="bg-white p-6 rounded-xl shadow">
        {commitments.length > 0 ? (
          <>
            <div className="mb-6 p-4 bg-indigo-50 rounded-lg">
              <p className="text-lg font-semibold">
                Total Committed: ₹{commitments
                  .filter(c => c.status === "active")
                  .reduce((sum, c) => sum + c.amount, 0)
                  .toLocaleString()}
              </p>
            </div>
            <div className="space-y-4">
              {commitments.map((commit) => (
                <div key={commit._id} className="border border-gray-200 p-4 rounded-lg">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-lg">{commit.investorName}</h3>
                      <p className="text-sm text-gray-600">{commit.investorType}</p>
                      <p className="text-lg font-bold text-green-600 mt-1">
                        ₹{commit.amount.toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-600">
                        Equity Expected: {commit.equityExpected}%
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded text-sm ${
                      commit.status === "active" ? "bg-green-100 text-green-700" :
                      commit.status === "converted" ? "bg-blue-100 text-blue-700" :
                      "bg-gray-100 text-gray-700"
                    }`}>
                      {commit.status}
                    </span>
                  </div>

                  {commit.conditions && (
                    <div className="mb-3 p-2 bg-gray-50 rounded">
                      <p className="text-sm font-semibold mb-1">Conditions:</p>
                      <p className="text-sm text-gray-700">{commit.conditions}</p>
                    </div>
                  )}

                  <div className="flex gap-2 text-sm text-gray-600 mb-3">
                    <span>Committed: {new Date(commit.commitDate).toLocaleDateString()}</span>
                    {commit.daysRemaining > 0 && (
                      <span className="text-orange-600">
                        • Expires in {commit.daysRemaining} days
                      </span>
                    )}
                  </div>

                  {commit.status === "active" && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => respondToCommitment(commit._id, "accept")}
                        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition text-sm"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => respondToCommitment(commit._id, "counter")}
                        className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 transition text-sm"
                      >
                        Counter Offer
                      </button>
                      <button
                        onClick={() => respondToCommitment(commit._id, "decline")}
                        className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition text-sm"
                      >
                        Decline
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        ) : (
          <p className="text-gray-500">No soft commitments yet</p>
        )}
      </div>
    </div>
  );


  // Incubators Section
  const handleApplicationChange = (e) => {
    const { name, value } = e.target;
    setApplicationForm({ ...applicationForm, [name]: value });
  };


  const applyToIncubator = async (incubatorId) => {
    try {
      setError("");
      await fetchWithAuth(`http://localhost:5000/api/startup/incubators/${incubatorId}/apply`, {
        method: "POST",
        body: JSON.stringify(applicationForm)
      });
      
      setSelectedIncubator(null);
      setApplicationForm({});
      
      // Reload applications
      const appsRes = await fetchWithAuth("http://localhost:5000/api/startup/applications");
      setApplications((appsRes.data || appsRes).applications || []);
      
      setSuccessMsg("Application submitted successfully!");
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err) {
      setError("Could not submit application: " + (err.message || String(err)));
    }
  };


  const IncubatorsSection = () => (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Available Incubators</h2>
      
      {selectedIncubator ? (
        <div className="bg-white p-6 rounded-xl shadow">
          <h3 className="text-xl font-semibold mb-4">Apply to {selectedIncubator.incubatorName}</h3>
          <div className="space-y-4 mb-4">
            <div>
              <label className="block font-semibold mb-1">Why do you want to join this program?</label>
              <textarea
                name="whyJoinProgram"
                value={applicationForm.whyJoinProgram || ""}
                onChange={handleApplicationChange}
                className="border border-gray-300 p-2 w-full rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                rows="3"
                required
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Expected Outcomes</label>
              <textarea
                name="expectedOutcomes"
                value={applicationForm.expectedOutcomes || ""}
                onChange={handleApplicationChange}
                className="border border-gray-300 p-2 w-full rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                rows="3"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Current Challenges</label>
              <textarea
                name="currentChallenges"
                value={applicationForm.currentChallenges || ""}
                onChange={handleApplicationChange}
                className="border border-gray-300 p-2 w-full rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                rows="3"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Funding Needs</label>
              <input
                type="text"
                name="fundingNeeds"
                value={applicationForm.fundingNeeds || ""}
                onChange={handleApplicationChange}
                className="border border-gray-300 p-2 w-full rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Time Commitment Available</label>
              <input
                type="text"
                name="timeCommitment"
                value={applicationForm.timeCommitment || ""}
                onChange={handleApplicationChange}
                className="border border-gray-300 p-2 w-full rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => applyToIncubator(selectedIncubator._id)}
              className="px-6 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition"
            >
              Submit Application
            </button>
            <button
              onClick={() => {
                setSelectedIncubator(null);
                setApplicationForm({});
              }}
              className="px-6 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {incubators.map((incubator) => (
            <div key={incubator._id} className="bg-white p-6 rounded-xl shadow">
              <div className="flex items-start gap-4 mb-4">
                {incubator.logoUrl && (
                  <img
                    src={incubator.logoUrl}
                    alt={incubator.incubatorName}
                    className="w-16 h-16 object-cover rounded"
                  />
                )}
                <div className="flex-1">
                  <h3 className="text-lg font-semibold">{incubator.incubatorName}</h3>
                  <p className="text-sm text-gray-600">{incubator.location}</p>
                </div>
              </div>
              
              <p className="text-sm text-gray-700 mb-4">{incubator.description}</p>
              
              <div className="space-y-2 mb-4 text-sm">
                {incubator.programDetails?.duration && (
                  <p><span className="font-semibold">Duration:</span> {incubator.programDetails.duration}</p>
                )}
                {incubator.programDetails?.equityTaken && (
                  <p><span className="font-semibold">Equity:</span> {incubator.programDetails.equityTaken}%</p>
                )}
                {incubator.programDetails?.investmentAmount && (
                  <p><span className="font-semibold">Investment:</span> ₹{incubator.programDetails.investmentAmount.toLocaleString()}</p>
                )}
              </div>

              <div className="flex gap-4 text-sm text-gray-600 mb-4">
                <span>{incubator.stats?.activeStartups || 0} Startups</span>
                <span>{incubator.stats?.activeMentors || 0} Mentors</span>
              </div>

              <button
                onClick={() => setSelectedIncubator(incubator)}
                className="w-full px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition"
              >
                Apply Now
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );


  // Applications Section
  const ApplicationsSection = () => (
    <div>
      <h2 className="text-2xl font-semibold mb-4">My Applications</h2>
      <div className="bg-white p-6 rounded-xl shadow">
        {applications.length > 0 ? (
          <div className="space-y-4">
            {applications.map((app) => (
              <div key={app._id} className="border border-gray-200 p-4 rounded-lg">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    {app.incubator?.logoUrl && (
                      <img
                        src={app.incubator.logoUrl}
                        alt={app.incubator.name}
                        className="w-12 h-12 object-cover rounded"
                      />
                    )}
                    <div>
                      <h3 className="font-semibold text-lg">{app.incubator?.name}</h3>
                      <p className="text-sm text-gray-600">{app.incubator?.location}</p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded text-sm ${
                    app.status === "applied" ? "bg-yellow-100 text-yellow-700" :
                    app.status === "under-review" ? "bg-blue-100 text-blue-700" :
                    app.status === "accepted" ? "bg-green-100 text-green-700" :
                    app.status === "rejected" ? "bg-red-100 text-red-700" :
                    "bg-gray-100 text-gray-700"
                  }`}>
                    {app.status}
                  </span>
                </div>

                <div className="text-sm text-gray-600 mb-3">
                  <p>Applied: {new Date(app.appliedDate).toLocaleDateString()}</p>
                  <p>Days since application: {app.daysSinceApplication}</p>
                </div>

                {app.reviewInfo?.reviewerNotes && (
                  <div className="p-3 bg-gray-50 rounded mb-3">
                    <p className="text-sm font-semibold mb-1">Review Notes:</p>
                    <p className="text-sm text-gray-700">{app.reviewInfo.reviewerNotes}</p>
                  </div>
                )}

                {app.applicationData && (
                  <details className="text-sm">
                    <summary className="cursor-pointer font-semibold mb-2">View Application Details</summary>
                    <div className="space-y-2 mt-2 p-3 bg-gray-50 rounded">
                      {app.applicationData.whyJoinProgram && (
                        <p><span className="font-semibold">Why Join:</span> {app.applicationData.whyJoinProgram}</p>
                      )}
                      {app.applicationData.expectedOutcomes && (
                        <p><span className="font-semibold">Expected Outcomes:</span> {app.applicationData.expectedOutcomes}</p>
                      )}
                      {app.applicationData.currentChallenges && (
                        <p><span className="font-semibold">Challenges:</span> {app.applicationData.currentChallenges}</p>
                      )}
                    </div>
                  </details>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No applications yet. Check out available incubators!</p>
        )}
      </div>
    </div>
  );


  // Main Render
  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-lg p-6 hidden md:block overflow-y-auto">
        <h1 className="text-2xl font-bold text-indigo-600 mb-8">Startup Portal</h1>
        <nav>
          <ul className="space-y-2">
            {[
              { id: "dashboard", label: "Dashboard", icon: BarChart3 },
              { id: "pitch", label: "Investor Pitch", icon: FileText },
              { id: "tasks", label: "Tasks", icon: CheckCircle2 },
              { id: "intros", label: "Intro Requests", icon: Users },
              { id: "commitments", label: "Soft Commitments", icon: DollarSign },
              { id: "incubators", label: "Incubators", icon: Building2 },
              { id: "applications", label: "My Applications", icon: Calendar }
            ].map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.id}>
                  <button
                    onClick={() => setActivePage(item.id)}
                    className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition ${
                      activePage === item.id
                        ? "bg-indigo-600 text-white font-semibold"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <Icon size={20} />
                    {item.label}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 overflow-y-auto">
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

        {/* Page Content */}
        {activePage === "dashboard" && <Dashboard />}
        {activePage === "pitch" && <PitchSection />}
        {activePage === "tasks" && <TaskSection />}
        {activePage === "intros" && <IntroRequestsSection />}
        {activePage === "commitments" && <SoftCommitmentsSection />}
        {activePage === "incubators" && <IncubatorsSection />}
        {activePage === "applications" && <ApplicationsSection />}
      </main>
    </div>
  );
};

export default StartupDashboard;
