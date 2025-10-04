import React, { useState, useEffect } from "react";
import { User, CheckCircle, XCircle, Clock, Award, Briefcase, MessageCircle } from "lucide-react";

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

const MentorDashboard = () => {
  const [activePage, setActivePage] = useState("dashboard");
  const [dashboard, setDashboard] = useState({});
  const [profile, setProfile] = useState({});
  const [profileForm, setProfileForm] = useState({});
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);

  // Chat state
  const [chatOpen, setChatOpen] = useState(false);
  const [chatList, setChatList] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [activeChatMessages, setActiveChatMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");

  // Load initial data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [dashRes, profileRes] = await Promise.all([
        fetchWithAuth("http://localhost:5000/api/mentor/dashboard"),
        fetchWithAuth("http://localhost:5000/api/mentor/profile")
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
      const res = await fetchWithAuth("http://localhost:5000/api/chat/chats");
      setChatList((res.data || res).chats || []);
    } catch (e) {
      console.error('Error loading chats:', e);
    }
  };

  const openChat = async (startupId) => {
    try {
      const res = await fetchWithAuth("http://localhost:5000/api/chat/chats", {
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
      const res = await fetchWithAuth(`http://localhost:5000/api/chat/chats/${chatId}/messages`);
      const data = res.data || res;
      setActiveChatMessages(data.messages || []);
    } catch (e) {
      console.error('Error loading messages:', e);
    }
  };

  const sendChatMessage = async () => {
    if (!inputMessage.trim() || !activeChat) return;
    
    try {
      await fetchWithAuth(`http://localhost:5000/api/chat/chats/${activeChat._id}/messages`, {
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

  // Dashboard Home
  const DashboardHome = () => {
    if (loading) {
      return <div className="text-center py-10">Loading dashboard...</div>;
    }

    const mentorInfo = dashboard.mentorInfo || {};
    const applicationStatus = dashboard.applicationStatus || {};

    return (
      <div>
        <h2 className="text-2xl font-semibold mb-6">Mentor Dashboard</h2>

        {/* Application Status Card */}
        <div className="bg-white p-6 rounded-xl shadow mb-6">
          <h3 className="text-lg font-semibold mb-4">Application Status</h3>
          <div className="flex items-center gap-4">
            {applicationStatus.status === 'pending' && (
              <>
                <Clock className="text-yellow-500 w-12 h-12" />
                <div>
                  <p className="text-xl font-bold text-yellow-600">Pending Review</p>
                  <p className="text-sm text-gray-600">
                    Your application is under review. You'll be notified once it's processed.
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    Applied: {new Date(applicationStatus.appliedDate).toLocaleDateString()}
                  </p>
                </div>
              </>
            )}
            {applicationStatus.status === 'approved' && (
              <>
                <CheckCircle className="text-green-500 w-12 h-12" />
                <div>
                  <p className="text-xl font-bold text-green-600">Approved</p>
                  <p className="text-sm text-gray-600">
                    Congratulations! Your mentor application has been approved.
                  </p>
                  {applicationStatus.reviewedAt && (
                    <p className="text-xs text-gray-500 mt-2">
                      Approved: {new Date(applicationStatus.reviewedAt).toLocaleDateString()}
                    </p>
                  )}
                  {applicationStatus.reviewNotes && (
                    <p className="text-sm text-gray-700 mt-2 p-2 bg-green-50 rounded">
                      Note: {applicationStatus.reviewNotes}
                    </p>
                  )}
                </div>
              </>
            )}
            {applicationStatus.status === 'rejected' && (
              <>
                <XCircle className="text-red-500 w-12 h-12" />
                <div>
                  <p className="text-xl font-bold text-red-600">Not Approved</p>
                  <p className="text-sm text-gray-600">
                    Your application was not approved at this time.
                  </p>
                  {applicationStatus.reviewedAt && (
                    <p className="text-xs text-gray-500 mt-2">
                      Reviewed: {new Date(applicationStatus.reviewedAt).toLocaleDateString()}
                    </p>
                  )}
                  {applicationStatus.reviewNotes && (
                    <p className="text-sm text-gray-700 mt-2 p-2 bg-red-50 rounded">
                      Reason: {applicationStatus.reviewNotes}
                    </p>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Profile Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white p-6 rounded-xl shadow">
            <div className="flex items-center gap-3 mb-4">
              <User className="text-indigo-500 w-8 h-8" />
              <h3 className="text-lg font-semibold">Profile</h3>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-gray-600">
                <span className="font-semibold">Name:</span> {mentorInfo.mentorName}
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-semibold">Experience:</span> {mentorInfo.experience || 'Not specified'}
              </p>
              {mentorInfo.linkedinUrl && (
                <a 
                  href={mentorInfo.linkedinUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline inline-block"
                >
                  View LinkedIn Profile →
                </a>
              )}
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow">
            <div className="flex items-center gap-3 mb-4">
              <Award className="text-yellow-500 w-8 h-8" />
              <h3 className="text-lg font-semibold">Expertise</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {mentorInfo.expertise && mentorInfo.expertise.length > 0 ? (
                mentorInfo.expertise.map((skill, idx) => (
                  <span 
                    key={idx} 
                    className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm"
                  >
                    {skill}
                  </span>
                ))
              ) : (
                <p className="text-sm text-gray-500">No expertise added yet</p>
              )}
            </div>
          </div>
        </div>

        {/* Previous Companies */}
        {mentorInfo.previousCompanies && mentorInfo.previousCompanies.length > 0 && (
          <div className="bg-white p-6 rounded-xl shadow">
            <div className="flex items-center gap-3 mb-4">
              <Briefcase className="text-green-500 w-8 h-8" />
              <h3 className="text-lg font-semibold">Previous Companies</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {mentorInfo.previousCompanies.map((company, idx) => (
                <span 
                  key={idx} 
                  className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-sm"
                >
                  {company}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        {applicationStatus.status === 'approved' && (
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-6 rounded-xl shadow mt-6">
            <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => setActivePage("profile")}
                className="p-4 bg-white rounded-lg shadow hover:shadow-md transition text-left"
              >
                <User className="text-indigo-500 w-6 h-6 mb-2" />
                <p className="font-semibold">Update Profile</p>
                <p className="text-xs text-gray-600">Edit your information</p>
              </button>
              <button
                onClick={() => {
                  setChatOpen(true);
                  loadChats();
                }}
                className="p-4 bg-white rounded-lg shadow hover:shadow-md transition text-left"
              >
                <MessageCircle className="text-green-500 w-6 h-6 mb-2" />
                <p className="font-semibold">Messages</p>
                <p className="text-xs text-gray-600">Chat with startups</p>
              </button>
              <button
                className="p-4 bg-white rounded-lg shadow hover:shadow-md transition text-left opacity-50 cursor-not-allowed"
              >
                <Award className="text-yellow-500 w-6 h-6 mb-2" />
                <p className="font-semibold">Sessions</p>
                <p className="text-xs text-gray-600">Coming soon</p>
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Profile Page
  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileForm({ ...profileForm, [name]: value });
  };

  const handleArrayInput = (field, value) => {
    const array = value.split(",").map(item => item.trim()).filter(item => item);
    setProfileForm({ ...profileForm, [field]: array });
  };

  const saveProfile = async () => {
    try {
      setError("");
      setSuccessMsg("");
      
      // Note: You'll need to add an update endpoint in the backend
      await fetchWithAuth("http://localhost:5000/api/mentor/profile", {
        method: "PUT",
        body: JSON.stringify(profileForm)
      });
      
      const profileRes = await fetchWithAuth("http://localhost:5000/api/mentor/profile");
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
      <h2 className="text-2xl font-semibold mb-4">Mentor Profile</h2>
      <form 
        className="bg-white p-6 rounded shadow space-y-4 max-w-2xl" 
        onSubmit={(e) => { e.preventDefault(); saveProfile(); }}
      >
        <div>
          <label className="block text-gray-700 mb-1">Mentor Name</label>
          <input 
            type="text" 
            name="mentorName"
            placeholder="Your Name" 
            value={profileForm.mentorName || profile.mentorName || ""}
            onChange={handleProfileChange}
            className="border rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-indigo-500" 
          />
        </div>

        <div>
          <label className="block text-gray-700 mb-1">Experience</label>
          <input 
            type="text" 
            name="experience"
            placeholder="e.g., 15 years" 
            value={profileForm.experience || profile.experience || ""}
            onChange={handleProfileChange}
            className="border rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-indigo-500" 
          />
        </div>

        <div>
          <label className="block text-gray-700 mb-1">Expertise (comma-separated)</label>
          <input 
            type="text" 
            placeholder="e.g., FinTech, Product Strategy, Marketing" 
            value={profileForm.expertise?.join(", ") || profile.expertise?.join(", ") || ""}
            onChange={(e) => handleArrayInput("expertise", e.target.value)}
            className="border rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-indigo-500" 
          />
        </div>

        <div>
          <label className="block text-gray-700 mb-1">Previous Companies (comma-separated)</label>
          <input 
            type="text" 
            placeholder="e.g., Paytm, Razorpay, Google" 
            value={profileForm.previousCompanies?.join(", ") || profile.previousCompanies?.join(", ") || ""}
            onChange={(e) => handleArrayInput("previousCompanies", e.target.value)}
            className="border rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-indigo-500" 
          />
        </div>

        <div>
          <label className="block text-gray-700 mb-1">LinkedIn URL</label>
          <input 
            type="url" 
            name="linkedinUrl"
            placeholder="https://linkedin.com/in/yourprofile" 
            value={profileForm.linkedinUrl || profile.linkedinUrl || ""}
            onChange={handleProfileChange}
            className="border rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-indigo-500" 
          />
        </div>

        <button 
          type="submit" 
          className="bg-indigo-600 text-white px-6 py-2 rounded shadow hover:bg-indigo-700 transition"
        >
          Save Changes
        </button>
      </form>
    </div>
  );

  // Chat Component
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
          <h3 className="font-semibold text-lg">
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
                className={`flex ${msg.senderType === 'mentor' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] p-3 rounded-lg ${
                    msg.senderType === 'mentor'
                      ? 'bg-indigo-600 text-white rounded-br-none'
                      : 'bg-white text-gray-800 rounded-bl-none shadow'
                  }`}
                >
                  <p className="text-sm break-words">{msg.message}</p>
                  <p className={`text-xs mt-1 ${msg.senderType === 'mentor' ? 'text-indigo-200' : 'text-gray-400'}`}>
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center mt-10">
              <MessageCircle size={48} className="mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500">No messages yet</p>
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
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-lg p-6 hidden md:block">
        <h1 className="text-2xl font-bold text-indigo-600 mb-8">Mentor Portal</h1>
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

      {/* Main Content */}
      <main className="flex-1 p-6 overflow-y-auto">
        {loading && (
          <div className="fixed inset-0 bg-black bg-opacity-20 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <p className="text-lg font-semibold">Loading...</p>
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

        {activePage === "dashboard" && <DashboardHome />}
        {activePage === "profile" && <ProfilePage />}
        {chatOpen && <ChatBox />}
      </main>
    </div>
  );
};

export default MentorDashboard;
