// src/StartupDashboard.jsx
import React, { useState, useEffect } from 'react';
import Navbar from "../components/Navbar";

function StartupDash() {
  const [dashboardData, setDashboardData] = useState(null);
  const [pitchData, setPitchData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Get token from localStorage
  const getAuthToken = () => {
    return localStorage.getItem('token');
  };

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    try {
      const token = getAuthToken();
      if (!token) {
        setError('No authentication token found');
        return;
      }

      const response = await fetch('http://localhost:5000/api/startup/dashboard', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success) {
        setDashboardData(data.data);
      } else {
        setError(data.message || 'Failed to fetch dashboard data');
      }
    } catch (error) {
      console.error('Dashboard fetch error:', error);
      setError('Network error. Please try again.');
    }
  };

  // Fetch pitch data
  const fetchPitchData = async () => {
    try {
      const token = getAuthToken();
      if (!token) return;

      const response = await fetch('http://localhost:5000/api/startup/pitch', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success) {
        setPitchData(data.data);
      } else {
        console.error('Failed to fetch pitch data:', data.message);
      }
    } catch (error) {
      console.error('Pitch fetch error:', error);
    }
  };

  // Create new pitch
  const createPitch = async () => {
    try {
      const token = getAuthToken();
      if (!token) return;

      const response = await fetch('http://localhost:5000/api/startup/pitch', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: 'New Startup Pitch',
          description: 'Your amazing startup idea here...',
          fundingGoal: 100000,
          category: 'Technology'
        })
      });

      const data = await response.json();

      if (data.success) {
        alert('Pitch created successfully!');
        fetchPitchData(); // Refresh pitch data
      } else {
        alert(data.message || 'Failed to create pitch');
      }
    } catch (error) {
      console.error('Create pitch error:', error);
      alert('Network error. Please try again.');
    }
  };

  // Load data on component mount
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchDashboardData(), fetchPitchData()]);
      setLoading(false);
    };
    
    loadData();
  }, []);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Navbar />
        <div className="pt-20 px-8">
          <div className="flex justify-center items-center h-64">
            <div className="text-xl text-gray-600">Loading dashboard...</div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Navbar />
        <div className="pt-20 px-8">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />

      {/* Main content */}
      <div className="pt-20 px-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">
            Welcome, {dashboardData?.user?.phoneNumber || 'Startup'}!
          </h1>
          <button 
            onClick={createPitch}
            className="px-4 py-2 bg-yellow-400 text-black rounded-lg hover:bg-yellow-500 transition"
          >
            {pitchData?.pitch ? 'Update Pitch' : 'Create New Pitch'}
          </button>
        </div>

        {/* Pitch Status */}
        {pitchData?.pitch && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-semibold text-blue-800 mb-2">Your Current Pitch</h3>
            <p className="text-blue-600">{pitchData.pitch}</p>
          </div>
        )}

        {/* Stats cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white shadow-md rounded-lg p-6">
            <h2 className="text-gray-500 font-medium mb-2">Pitch Views</h2>
            <p className="text-2xl font-bold text-gray-800">
              {dashboardData?.stats?.pitchViews || 0}
            </p>
          </div>
          <div className="bg-white shadow-md rounded-lg p-6">
            <h2 className="text-gray-500 font-medium mb-2">Intro Requests</h2>
            <p className="text-2xl font-bold text-gray-800">
              {dashboardData?.stats?.introRequests || 0}
            </p>
          </div>
          <div className="bg-white shadow-md rounded-lg p-6">
            <h2 className="text-gray-500 font-medium mb-2">Soft Commitments</h2>
            <p className="text-2xl font-bold text-gray-800">
              {dashboardData?.stats?.softCommitments || 0}
            </p>
          </div>
        </div>

        {/* User Info */}
        <div className="bg-white shadow-md rounded-lg p-6 mb-6">
          <h2 className="text-xl font-bold mb-4 text-gray-800">Account Info</h2>
          <div className="space-y-2">
            <p><span className="font-medium">Phone:</span> {dashboardData?.user?.phoneNumber}</p>
            <p><span className="font-medium">User Type:</span> {dashboardData?.user?.userType}</p>
            <p><span className="font-medium">Account ID:</span> {dashboardData?.user?.id}</p>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4 text-gray-800">Recent Activity</h2>
          <ul className="space-y-3">
            <li className="flex justify-between border-b pb-2">
              <span>Dashboard accessed</span>
              <span className="text-gray-500 text-sm">Just now</span>
            </li>
            <li className="flex justify-between border-b pb-2">
              <span>Account authenticated</span>
              <span className="text-gray-500 text-sm">Few minutes ago</span>
            </li>
            {pitchData?.pitch && (
              <li className="flex justify-between border-b pb-2">
                <span>Pitch data retrieved</span>
                <span className="text-gray-500 text-sm">Just now</span>
              </li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default StartupDash;
