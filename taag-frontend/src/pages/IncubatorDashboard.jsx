import React, { useState, useEffect } from "react";
import { Users, BarChart3, Settings, Star, CheckCircle, XCircle, Eye } from "lucide-react";

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

const IncubatorDashboard = () => {
  const [activePage, setActivePage] = useState("dashboard");
  const [dashboard, setDashboard] = useState({});
  const [profile, setProfile] = useState({});
  const [profileForm, setProfileForm] = useState({});
  const [mentors, setMentors] = useState([]);
  const [applications, setApplications] = useState([]);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [funnel, setFunnel] = useState({});
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);

  // Load initial data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [dashRes, profileRes, mentorsRes, appsRes, funnelRes] = await Promise.all([
        fetchWithAuth("http://localhost:5000/api/incubator/dashboard"),
        fetchWithAuth("http://localhost:5000/api/incubator/profile"),
        fetchWithAuth("http://localhost:5000/api/incubator/mentors/pending"),
        fetchWithAuth("http://localhost:5000/api/incubator/applications"),
        fetchWithAuth("http://localhost:5000/api/incubator/analytics/funnel")
      ]);

      setDashboard(dashRes.data || dashRes);
      setProfile(profileRes.data || profileRes);
      setMentors((mentorsRes.data || mentorsRes).mentors || []);
      setApplications((appsRes.data || appsRes).applications || []);
      setFunnel(funnelRes.data || funnelRes);
      setLoading(false);
    } catch (e) {
      setError(e.message || String(e));
      setLoading(false);
    }
  };

  // Dashboard Home
  const DashboardHome = () => {
    if (loading) {
      return <div className="text-center py-10">Loading dashboard...</div>;
    }

    const stats = dashboard.overview || {};

    return (
      <div>
        <h2 className="text-2xl font-semibold mb-6">Incubator Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow flex items-center space-x-4">
            <BarChart3 className="text-pink-500 w-8 h-8" />
            <div>
              <p className="text-gray-500">Total Applications</p>
              <h3 className="text-xl font-bold">{applications.length || 0}</h3>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow flex items-center space-x-4">
            <Users className="text-indigo-500 w-8 h-8" />
            <div>
              <p className="text-gray-500">Active Startups</p>
              <h3 className="text-xl font-bold">{stats.activeStartups || 0}</h3>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow flex items-center space-x-4">
            <Star className="text-yellow-500 w-8 h-8" />
            <div>
              <p className="text-gray-500">Active Mentors</p>
              <h3 className="text-xl font-bold">{stats.activeMentors || 0}</h3>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow flex items-center space-x-4">
            <Settings className="text-green-500 w-8 h-8" />
            <div>
              <p className="text-gray-500">Pending Reviews</p>
              <h3 className="text-xl font-bold">{mentors.length || 0}</h3>
            </div>
          </div>
        </div>

        {/* Recent Applications */}
        <div className="bg-white p-6 rounded-xl shadow">
          <h3 className="text-lg font-semibold mb-4">Recent Applications</h3>
          {applications.length > 0 ? (
            <ul className="space-y-3">
              {applications.slice(0, 5).map((app) => (
                <li key={app._id} className="flex justify-between items-center border-b pb-2">
                  <div>
                    <p className="font-semibold">{app.startup?.companyName}</p>
                    <p className="text-sm text-gray-600">{app.startup?.industry} • {app.startup?.stage}</p>
                  </div>
                  <span className={`px-3 py-1 rounded text-sm ${
                    app.status === 'applied' ? 'bg-yellow-100 text-yellow-700' :
                    app.status === 'viewed' ? 'bg-blue-100 text-blue-700' :
                    app.status === 'closed-deal' ? 'bg-green-100 text-green-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {app.status}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">No applications yet</p>
          )}
        </div>
      </div>
    );
  };

  // Profile
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
      await fetchWithAuth("http://localhost:5000/api/incubator/profile", {
        method: "PUT",
        body: JSON.stringify(profileForm)
      });
      
      const profileRes = await fetchWithAuth("http://localhost:5000/api/incubator/profile");
      setProfile(profileRes.data || profileRes);
      setProfileForm({});
      
      setSuccessMsg("Profile updated successfully!");
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err) {
      setError("Could not update profile: " + (err.message || String(err)));
    }
  };

  const ProfilePage = () => (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Incubator Profile</h2>
      <form className="bg-white p-6 rounded shadow space-y-4 max-w-2xl" onSubmit={(e) => { e.preventDefault(); saveProfile(); }}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-700 mb-1">Incubator Name</label>
            <input 
              type="text" 
              name="incubatorName"
              placeholder="My Incubator" 
              value={profileForm.incubatorName || ""}
              onChange={handleProfileChange}
              className="border rounded px-3 py-2 w-full" 
            />
          </div>
          <div>
            <label className="block text-gray-700 mb-1">Website</label>
            <input 
              type="text" 
              name="website"
              placeholder="https://incubator.com" 
              value={profileForm.website || ""}
              onChange={handleProfileChange}
              className="border rounded px-3 py-2 w-full" 
            />
          </div>
          <div>
            <label className="block text-gray-700 mb-1">Location</label>
            <input 
              type="text" 
              name="location"
              placeholder="Mumbai, India" 
              value={profileForm.location || ""}
              onChange={handleProfileChange}
              className="border rounded px-3 py-2 w-full" 
            />
          </div>
          <div>
            <label className="block text-gray-700 mb-1">Founded Year</label>
            <input 
              type="number" 
              name="foundedYear"
              placeholder="2020" 
              value={profileForm.foundedYear || ""}
              onChange={handleProfileChange}
              className="border rounded px-3 py-2 w-full" 
            />
          </div>
        </div>

        <div>
          <label className="block text-gray-700 mb-1">Description</label>
          <textarea 
            name="description"
            value={profileForm.description || ""}
            onChange={handleProfileChange}
            className="border rounded px-3 py-2 w-full" 
            rows={3}
            placeholder="Brief description of your incubator"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-700 mb-1">Program Duration</label>
            <input 
              type="text" 
              name="programDetails.duration"
              placeholder="6 months" 
              value={profileForm.programDetails?.duration || ""}
              onChange={handleProfileChange}
              className="border rounded px-3 py-2 w-full" 
            />
          </div>
          <div>
            <label className="block text-gray-700 mb-1">Batch Size</label>
            <input 
              type="number" 
              name="programDetails.batchSize"
              placeholder="10" 
              value={profileForm.programDetails?.batchSize || ""}
              onChange={handleProfileChange}
              className="border rounded px-3 py-2 w-full" 
            />
          </div>
          <div>
            <label className="block text-gray-700 mb-1">Equity Taken (%)</label>
            <input 
              type="number" 
              name="programDetails.equityTaken"
              placeholder="5" 
              value={profileForm.programDetails?.equityTaken || ""}
              onChange={handleProfileChange}
              className="border rounded px-3 py-2 w-full" 
            />
          </div>
          <div>
            <label className="block text-gray-700 mb-1">Investment Amount (₹)</label>
            <input 
              type="number" 
              name="programDetails.investmentAmount"
              placeholder="5000000" 
              value={profileForm.programDetails?.investmentAmount || ""}
              onChange={handleProfileChange}
              className="border rounded px-3 py-2 w-full" 
            />
          </div>
        </div>

        <div>
          <label className="block text-gray-700 mb-1">Focus Industries (comma-separated)</label>
          <input 
            type="text" 
            placeholder="Technology, Healthcare, Finance"
            value={profileForm.programDetails?.industries?.join(", ") || ""}
            onChange={(e) => handleArrayInput("programDetails.industries", e.target.value)}
            className="border rounded px-3 py-2 w-full" 
          />
        </div>

        <div>
          <label className="block text-gray-700 mb-1">Focus Stages (comma-separated)</label>
          <input 
            type="text" 
            placeholder="idea, mvp, growth"
            value={profileForm.programDetails?.stages?.join(", ") || ""}
            onChange={(e) => handleArrayInput("programDetails.stages", e.target.value)}
            className="border rounded px-3 py-2 w-full" 
          />
        </div>

        <button type="submit" className="bg-indigo-600 text-white px-6 py-2 rounded shadow hover:bg-indigo-700">
          Save Changes
        </button>
      </form>
    </div>
  );

  // Mentors & Reviews
  const reviewMentor = async (mentorId, action) => {
    const notes = prompt(`Add review notes for ${action} (optional):`);
    try {
      setError("");
      await fetchWithAuth(`http://localhost:5000/api/incubator/mentors/${mentorId}/review`, {
        method: "PUT",
        body: JSON.stringify({ action, reviewNotes: notes })
      });
      
      setSuccessMsg(`Mentor ${action}d successfully!`);
      
      // Reload mentors
      const mentorsRes = await fetchWithAuth("http://localhost:5000/api/incubator/mentors/pending");
      setMentors((mentorsRes.data || mentorsRes).mentors || []);
      
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err) {
      setError("Could not review mentor: " + (err.message || String(err)));
    }
  };

  const MentorsPage = () => (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Pending Mentors</h2>
      {mentors.length > 0 ? (
        <ul className="space-y-3">
          {mentors.map((mentor) => (
            <li key={mentor._id} className="bg-white p-4 rounded shadow">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="font-semibold text-lg">{mentor.mentorName}</p>
                  <p className="text-sm text-gray-600">{mentor.expertise}</p>
                  <p className="text-sm text-gray-600">Experience: {mentor.experience} years</p>
                  {mentor.previousCompanies && (
                    <p className="text-sm text-gray-600">Companies: {mentor.previousCompanies}</p>
                  )}
                  {mentor.linkedinUrl && (
                    <a href={mentor.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">
                      LinkedIn Profile
                    </a>
                  )}
                </div>
                <span className="text-sm text-gray-500">
                  Applied: {new Date(mentor.appliedDate).toLocaleDateString()}
                </span>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => reviewMentor(mentor._id, 'approve')}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition flex items-center gap-2"
                >
                  <CheckCircle size={16} />
                  Approve
                </button>
                <button 
                  onClick={() => reviewMentor(mentor._id, 'reject')}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition flex items-center gap-2"
                >
                  <XCircle size={16} />
                  Reject
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-500">No pending mentor applications</p>
      )}
    </div>
  );

  // Applications
  const viewApplication = (app) => {
    setSelectedApplication(app);
    setActivePage("application-detail");
  };

  const reviewApplication = async (applicationId, action) => {
    const notes = prompt(`Add review notes for ${action} (optional):`);
    try {
      setError("");
      await fetchWithAuth(`http://localhost:5000/api/incubator/applications/${applicationId}/review`, {
        method: "PUT",
        body: JSON.stringify({ action, reviewNotes: notes })
      });
      
      setSuccessMsg(`Application ${action}ed successfully!`);
      
      // Reload applications
      const appsRes = await fetchWithAuth("http://localhost:5000/api/incubator/applications");
      setApplications((appsRes.data || appsRes).applications || []);
      
      if (action === 'accept' || action === 'reject') {
        setActivePage("applications");
        setSelectedApplication(null);
      }
      
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err) {
      setError("Could not review application: " + (err.message || String(err)));
    }
  };

  const ApplicationsPage = () => (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Startup Applications</h2>
      <div className="bg-white rounded shadow overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50">
            <tr className="border-b">
              <th className="p-3">Startup</th>
              <th className="p-3">Industry</th>
              <th className="p-3">Stage</th>
              <th className="p-3">Funding Ask</th>
              <th className="p-3">Status</th>
              <th className="p-3">Days Since</th>
              <th className="p-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {applications.length > 0 ? (
              applications.map((app) => (
                <tr key={app._id} className="border-b hover:bg-gray-50">
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      {app.startup?.logoUrl && (
                        <img src={app.startup.logoUrl} alt="" className="w-8 h-8 rounded" />
                      )}
                      <span className="font-semibold">{app.startup?.companyName}</span>
                    </div>
                  </td>
                  <td className="p-3">{app.startup?.industry}</td>
                  <td className="p-3">{app.startup?.stage}</td>
                  <td className="p-3">₹{(app.startup?.fundingAsk?.amount || 0).toLocaleString()}</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded text-xs ${
                      app.status === 'applied' ? 'bg-yellow-100 text-yellow-700' :
                      app.status === 'viewed' ? 'bg-blue-100 text-blue-700' :
                      app.status === 'closed-deal' ? 'bg-green-100 text-green-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {app.status}
                    </span>
                  </td>
                  <td className="p-3">{app.daysSinceApplication} days</td>
                  <td className="p-3">
                    <button 
                      onClick={() => viewApplication(app)}
                      className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition text-sm"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="p-6 text-center text-gray-500">
                  No applications yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  // Application Detail View
  const ApplicationDetail = () => {
    if (!selectedApplication) return <p>Loading...</p>;

    const app = selectedApplication;
    const startup = app.startup || {};

    return (
      <div>
        <button
          onClick={() => {
            setActivePage("applications");
            setSelectedApplication(null);
          }}
          className="text-indigo-600 hover:underline mb-4"
        >
          ← Back to Applications
        </button>

        <div className="bg-white p-6 rounded shadow">
          <div className="flex items-start gap-4 mb-6">
            {startup.logoUrl && (
              <img src={startup.logoUrl} alt="" className="w-20 h-20 rounded" />
            )}
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-2">{startup.companyName}</h2>
              <p className="text-gray-700 mb-2">{startup.oneLineDescription}</p>
              <div className="flex gap-2">
                <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded text-sm">
                  {startup.industry}
                </span>
                <span className="px-3 py-1 bg-green-100 text-green-700 rounded text-sm">
                  {startup.stage}
                </span>
              </div>
            </div>
          </div>

          {/* Funding Ask */}
          {startup.fundingAsk && (
            <div className="mb-6">
              <h3 className="font-semibold mb-2">Funding Ask</h3>
              <p className="text-2xl font-bold text-green-600">₹{startup.fundingAsk.amount?.toLocaleString()}</p>
              <p className="text-sm text-gray-600">Timeline: {startup.fundingAsk.timeline}</p>
              {startup.fundingAsk.useOfFunds && (
                <p className="text-sm text-gray-700 mt-2">{startup.fundingAsk.useOfFunds}</p>
              )}
            </div>
          )}

          {/* Metrics */}
          {startup.metrics && Object.keys(startup.metrics).length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold mb-2">Key Metrics</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {startup.metrics.monthlyRevenue !== undefined && (
                  <div className="bg-green-50 p-3 rounded">
                    <p className="text-xs text-gray-600">Monthly Revenue</p>
                    <p className="text-lg font-bold text-green-700">₹{startup.metrics.monthlyRevenue.toLocaleString()}</p>
                  </div>
                )}
                {startup.metrics.growthRate && (
                  <div className="bg-blue-50 p-3 rounded">
                    <p className="text-xs text-gray-600">Growth Rate</p>
                    <p className="text-lg font-bold text-blue-700">{startup.metrics.growthRate}</p>
                  </div>
                )}
                {startup.metrics.customerCount !== undefined && (
                  <div className="bg-purple-50 p-3 rounded">
                    <p className="text-xs text-gray-600">Customers</p>
                    <p className="text-lg font-bold text-purple-700">{startup.metrics.customerCount.toLocaleString()}</p>
                  </div>
                )}
                {startup.metrics.teamSize !== undefined && (
                  <div className="bg-orange-50 p-3 rounded">
                    <p className="text-xs text-gray-600">Team Size</p>
                    <p className="text-lg font-bold text-orange-700">{startup.metrics.teamSize}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Application Data */}
          {app.applicationData && (
            <div className="mb-6">
              <h3 className="font-semibold mb-2">Application Details</h3>
              <div className="space-y-3 bg-gray-50 p-4 rounded">
                {app.applicationData.whyJoinProgram && (
                  <div>
                    <p className="text-sm font-semibold text-gray-600">Why Join:</p>
                    <p className="text-sm text-gray-700">{app.applicationData.whyJoinProgram}</p>
                  </div>
                )}
                {app.applicationData.expectedOutcomes && (
                  <div>
                    <p className="text-sm font-semibold text-gray-600">Expected Outcomes:</p>
                    <p className="text-sm text-gray-700">{app.applicationData.expectedOutcomes}</p>
                  </div>
                )}
                {app.applicationData.currentChallenges && (
                  <div>
                    <p className="text-sm font-semibold text-gray-600">Current Challenges:</p>
                    <p className="text-sm text-gray-700">{app.applicationData.currentChallenges}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {app.status === 'applied' || app.status === 'viewed' ? (
            <div className="flex gap-2">
              {app.status === 'applied' && (
                <button
                  onClick={() => reviewApplication(app._id, 'view')}
                  className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2"
                >
                  <Eye size={16} />
                  Mark as Viewed
                </button>
              )}
              <button
                onClick={() => reviewApplication(app._id, 'accept')}
                className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-2"
              >
                <CheckCircle size={16} />
                Accept
              </button>
              <button
                onClick={() => reviewApplication(app._id, 'reject')}
                className="px-6 py-2 bg-red-600 text-white rounded hover:bg-red-700 flex items-center gap-2"
              >
                <XCircle size={16} />
                Reject
              </button>
            </div>
          ) : (
            <div className="p-4 bg-gray-100 rounded">
              <p className="text-gray-700">Status: <span className="font-semibold capitalize">{app.status}</span></p>
              {app.reviewInfo?.reviewNotes && (
                <p className="text-sm text-gray-600 mt-2">Notes: {app.reviewInfo.reviewNotes}</p>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  // Funnel Analytics
// Funnel Analytics - ✅ FIXED WITH PROPER CALCULATIONS
const FunnelPage = () => {
  const funnelData = funnel.funnel || {};
  let conversions = funnel.conversionRates || {};

  // ✅ FALLBACK: Calculate conversion rates if not provided by backend
  if (!conversions.applicationToView && !conversions.viewToAccept && !conversions.overallSuccess) {
    const total = (funnelData.applied || 0) + (funnelData.viewed || 0) + 
                  (funnelData.closedDeals || 0) + (funnelData.rejected || 0);
    
    const reviewed = (funnelData.viewed || 0) + (funnelData.closedDeals || 0) + (funnelData.rejected || 0);
    const viewedPlusAccepted = (funnelData.viewed || 0) + (funnelData.closedDeals || 0);
    
    conversions = {
      applicationToView: total > 0 ? Math.round((reviewed / total) * 100) : 0,
      viewToAccept: viewedPlusAccepted > 0 ? Math.round(((funnelData.closedDeals || 0) / viewedPlusAccepted) * 100) : 0,
      overallSuccess: total > 0 ? Math.round(((funnelData.closedDeals || 0) / total) * 100) : 0
    };
  }

  const insights = funnel.insights || {};

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Funnel Analytics</h2>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-6 rounded shadow">
          <p className="text-gray-600 text-sm">Applied</p>
          <p className="text-3xl font-bold text-yellow-600">{funnelData.applied || 0}</p>
          <p className="text-xs text-gray-500 mt-1">Pending Review</p>
        </div>
        <div className="bg-white p-6 rounded shadow">
          <p className="text-gray-600 text-sm">Viewed</p>
          <p className="text-3xl font-bold text-blue-600">{funnelData.viewed || 0}</p>
          <p className="text-xs text-gray-500 mt-1">Under Consideration</p>
        </div>
        <div className="bg-white p-6 rounded shadow">
          <p className="text-gray-600 text-sm">Accepted</p>
          <p className="text-3xl font-bold text-green-600">{funnelData.closedDeals || 0}</p>
          <p className="text-xs text-gray-500 mt-1">Successful</p>
        </div>
        <div className="bg-white p-6 rounded shadow">
          <p className="text-gray-600 text-sm">Rejected</p>
          <p className="text-3xl font-bold text-red-600">{funnelData.rejected || 0}</p>
          <p className="text-xs text-gray-500 mt-1">Not Selected</p>
        </div>
      </div>

      {/* Conversion Rates */}
      <div className="bg-white p-6 rounded shadow mb-6">
        <h3 className="font-semibold mb-4">Conversion Rates</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-blue-50 rounded">
            <p className="text-sm text-gray-600 mb-2">Application → Reviewed</p>
            <p className="text-4xl font-bold text-blue-600">{conversions.applicationToView}%</p>
            <p className="text-xs text-gray-500 mt-2">
              Applications that were reviewed
            </p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded">
            <p className="text-sm text-gray-600 mb-2">Reviewed → Accepted</p>
            <p className="text-4xl font-bold text-green-600">{conversions.viewToAccept}%</p>
            <p className="text-xs text-gray-500 mt-2">
              Reviewed applications that were accepted
            </p>
          </div>
          <div className="text-center p-4 bg-indigo-50 rounded">
            <p className="text-sm text-gray-600 mb-2">Overall Success Rate</p>
            <p className="text-4xl font-bold text-indigo-600">{conversions.overallSuccess}%</p>
            <p className="text-xs text-gray-500 mt-2">
              Total applications accepted
            </p>
          </div>
        </div>
      </div>

      {/* Insights Summary */}
      {insights.totalApplications > 0 && (
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-6 rounded shadow mb-6">
          <h3 className="font-semibold mb-3">Key Insights</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-indigo-600">{insights.totalApplications || funnelData.total || 0}</p>
              <p className="text-sm text-gray-600">Total Applications</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-yellow-600">{insights.pendingReview || funnelData.applied || 0}</p>
              <p className="text-sm text-gray-600">Awaiting Review</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">{insights.successful || funnelData.closedDeals || 0}</p>
              <p className="text-sm text-gray-600">Successful</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-red-600">{insights.unsuccessful || funnelData.rejected || 0}</p>
              <p className="text-sm text-gray-600">Rejected</p>
            </div>
          </div>
        </div>
      )}

      {/* Visual Funnel */}
      <div className="bg-white p-6 rounded shadow">
        <h3 className="font-semibold mb-6">Application Journey</h3>
        <div className="flex items-end justify-around h-72 bg-gray-50 rounded p-4">
          {[
            { key: 'applied', label: 'Applied', color: 'bg-yellow-500', value: funnelData.applied || 0 },
            { key: 'viewed', label: 'Viewed', color: 'bg-blue-500', value: funnelData.viewed || 0 },
            { key: 'closedDeals', label: 'Accepted', color: 'bg-green-500', value: funnelData.closedDeals || 0 },
            { key: 'rejected', label: 'Rejected', color: 'bg-red-500', value: funnelData.rejected || 0 }
          ].map((item) => {
            const maxValue = Math.max(
              funnelData.applied || 0,
              funnelData.viewed || 0,
              funnelData.closedDeals || 0,
              funnelData.rejected || 0,
              1 // Prevent division by zero
            );
            const heightPercent = (item.value / maxValue) * 100;

            return (
              <div key={item.key} className="flex flex-col items-center">
                <div 
                  className={`w-20 ${item.color} rounded-t transition-all duration-500`}
                  style={{ height: `${heightPercent}%`, minHeight: item.value > 0 ? '20px' : '0' }}
                />
                <p className="mt-3 text-2xl font-bold text-gray-800">{item.value}</p>
                <p className="text-sm text-gray-600 font-medium">{item.label}</p>
              </div>
            );
          })}
        </div>

        {/* Flow Description */}
        <div className="mt-6 p-4 bg-blue-50 rounded">
          <p className="text-sm text-gray-700">
            <span className="font-semibold">Journey Flow:</span> Applications start as <span className="font-semibold text-yellow-600">Applied</span>, 
            move to <span className="font-semibold text-blue-600">Viewed</span> when reviewed, and are then either 
            <span className="font-semibold text-green-600"> Accepted</span> or <span className="font-semibold text-red-600">Rejected</span>.
          </p>
        </div>
      </div>
    </div>
  );
};


  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-lg p-6 hidden md:block">
        <h1 className="text-2xl font-bold text-indigo-600 mb-8">Incubator</h1>
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
            className={`cursor-pointer ${activePage === "mentors" ? "text-indigo-600 font-semibold" : "text-gray-700"} hover:text-indigo-600`} 
            onClick={() => setActivePage("mentors")}
          >
            Mentors ({mentors.length})
          </li>
          <li 
            className={`cursor-pointer ${activePage === "applications" ? "text-indigo-600 font-semibold" : "text-gray-700"} hover:text-indigo-600`} 
            onClick={() => setActivePage("applications")}
          >
            Applications ({applications.length})
          </li>
          <li 
            className={`cursor-pointer ${activePage === "funnel" ? "text-indigo-600 font-semibold" : "text-gray-700"} hover:text-indigo-600`} 
            onClick={() => setActivePage("funnel")}
          >
            Funnel Analytics
          </li>
        </ul>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 overflow-y-auto">
        {/* Loading Overlay */}
        {loading && (
          <div className="fixed inset-0 bg-black bg-opacity-20 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <p className="text-lg font-semibold">Loading...</p>
            </div>
          </div>
        )}

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

        {activePage === "dashboard" && <DashboardHome />}
        {activePage === "profile" && <ProfilePage />}
        {activePage === "mentors" && <MentorsPage />}
        {activePage === "applications" && <ApplicationsPage />}
        {activePage === "application-detail" && <ApplicationDetail />}
        {activePage === "funnel" && <FunnelPage />}
      </main>
    </div>
  );
};

export default IncubatorDashboard;
