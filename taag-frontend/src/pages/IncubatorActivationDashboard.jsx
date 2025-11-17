import React, { useState, useEffect } from 'react';
import { FileDown, Eye, EyeOff, Copy, Check, Building2, Users, Clock } from 'lucide-react';

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
      errorMessage = errorData.message || errorData.error || errorMessage;
    } else {
      const errorText = await res.text();
      errorMessage = errorText || errorMessage;
    }
    
    throw new Error(errorMessage);
  }
  
  if (contentType.includes("json")) {
    return await res.json();
  }
  
  throw new Error(await res.text());
};
const API = import.meta.env.VITE_API_URL;

const IncubatorActivationDashboard = () => {
  const [credentials, setCredentials] = useState([]);
  const [showPasswords, setShowPasswords] = useState({});
  const [copied, setCopied] = useState({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCredentials();
  }, []);

  const loadCredentials = async () => {
    try {
      setLoading(true);
      const res = await fetchWithAuth(`${API}/api/incubator/startup-credentials`);
      setCredentials((res.data || res).credentials || []);
      setLoading(false);
    } catch (err) {
      setError(err.message || 'Failed to load credentials');
      setLoading(false);
    }
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopied({ ...copied, [id]: true });
    setTimeout(() => {
      setCopied({ ...copied, [id]: false });
    }, 2000);
  };

  const downloadCredentials = () => {
    const csvContent = [
      ['Company Name', 'Email', 'Phone', 'Temporary Password', 'Activation Link', 'Status'],
      ...credentials.map(c => [
        c.companyName,
        c.email || '',
        c.phone || '',
        c.tempPassword || '',
        c.activationLink || '',
        c.activated ? 'Activated' : 'Pending'
      ])
    ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `startup_credentials_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const togglePassword = (index) => {
    setShowPasswords({ ...showPasswords, [index]: !showPasswords[index] });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading credentials...</p>
        </div>
      </div>
    );
  }

  const activatedCount = credentials.filter(c => c.activated).length;
  const pendingCount = credentials.filter(c => !c.activated).length;

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Startup Activation Management</h1>
            <p className="text-gray-600">Manage imported startup credentials and activation status</p>
          </div>
          <button
            onClick={downloadCredentials}
            disabled={credentials.length === 0}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            <FileDown size={20} />
            Download CSV
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="max-w-7xl mx-auto mb-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
            {error}
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
              <Building2 className="text-indigo-600" size={24} />
            </div>
            <div>
              <p className="text-gray-500 text-sm">Total Imported</p>
              <p className="text-3xl font-bold text-gray-800">{credentials.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Users className="text-green-600" size={24} />
            </div>
            <div>
              <p className="text-gray-500 text-sm">Activated</p>
              <p className="text-3xl font-bold text-green-600">{activatedCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <Clock className="text-orange-600" size={24} />
            </div>
            <div>
              <p className="text-gray-500 text-sm">Pending Activation</p>
              <p className="text-3xl font-bold text-orange-600">{pendingCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Credentials Table */}
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {credentials.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b-2 border-gray-200">
                  <tr>
                    <th className="text-left p-4 font-semibold text-gray-700">Company Name</th>
                    <th className="text-left p-4 font-semibold text-gray-700">Contact</th>
                    <th className="text-left p-4 font-semibold text-gray-700">Temp Password</th>
                    <th className="text-left p-4 font-semibold text-gray-700">Activation Link</th>
                    <th className="text-left p-4 font-semibold text-gray-700">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {credentials.map((cred, index) => (
                    <tr key={index} className="border-b hover:bg-gray-50 transition">
                      <td className="p-4">
                        <p className="font-semibold text-gray-800">{cred.companyName}</p>
                      </td>
                      <td className="p-4">
                        <div className="space-y-1">
                          {cred.email && (
                            <div className="flex items-center gap-2">
                              <p className="text-sm text-gray-600">{cred.email}</p>
                              <button
                                onClick={() => copyToClipboard(cred.email, `email-${index}`)}
                                className="text-gray-400 hover:text-indigo-600 transition"
                                title="Copy email"
                              >
                                {copied[`email-${index}`] ? 
                                  <Check size={14} className="text-green-600" /> : 
                                  <Copy size={14} />
                                }
                              </button>
                            </div>
                          )}
                          {cred.phone && (
                            <div className="flex items-center gap-2">
                              <p className="text-sm text-gray-600">{cred.phone}</p>
                              <button
                                onClick={() => copyToClipboard(cred.phone, `phone-${index}`)}
                                className="text-gray-400 hover:text-indigo-600 transition"
                                title="Copy phone"
                              >
                                {copied[`phone-${index}`] ? 
                                  <Check size={14} className="text-green-600" /> : 
                                  <Copy size={14} />
                                }
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        {!cred.activated ? (
                          <div className="flex items-center gap-2">
                            <code className="bg-gray-100 px-3 py-1 rounded text-sm font-mono border border-gray-300">
                              {showPasswords[index] ? cred.tempPassword : '••••••••'}
                            </code>
                            <button
                              onClick={() => togglePassword(index)}
                              className="text-gray-400 hover:text-indigo-600 transition"
                              title={showPasswords[index] ? 'Hide password' : 'Show password'}
                            >
                              {showPasswords[index] ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                            <button
                              onClick={() => copyToClipboard(cred.tempPassword, `pass-${index}`)}
                              className="text-gray-400 hover:text-indigo-600 transition"
                              title="Copy password"
                            >
                              {copied[`pass-${index}`] ? 
                                <Check size={14} className="text-green-600" /> : 
                                <Copy size={14} />
                              }
                            </button>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm italic">Password changed</span>
                        )}
                      </td>
                      <td className="p-4">
                        {!cred.activated ? (
                          <div className="flex items-center gap-2">
                            <a
                              href={cred.activationLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-700 text-sm underline"
                            >
                              Open Link
                            </a>
                            <button
                              onClick={() => copyToClipboard(cred.activationLink, `link-${index}`)}
                              className="text-gray-400 hover:text-indigo-600 transition"
                              title="Copy activation link"
                            >
                              {copied[`link-${index}`] ? 
                                <Check size={14} className="text-green-600" /> : 
                                <Copy size={14} />
                              }
                            </button>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">-</span>
                        )}
                      </td>
                      <td className="p-4">
                        {cred.activated ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                            <Check size={12} />
                            Activated
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-semibold">
                            <Clock size={12} />
                            Pending
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center">
              <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-800 mb-2">No Imported Startups</h3>
              <p className="text-gray-600">Upload a CSV or Excel file to import startups</p>
            </div>
          )}
        </div>
      </div>

      {/* Instructions */}
      {credentials.length > 0 && (
        <div className="max-w-7xl mx-auto mt-8">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
              📧 How to Share Credentials with Startups
            </h3>
            <ol className="space-y-2 text-sm text-blue-800">
              <li className="flex items-start gap-2">
                <span className="font-bold">1.</span>
                <span>Click "Download CSV" to get all credentials in a spreadsheet</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold">2.</span>
                <span>Send activation links and temporary passwords to respective startups via email/WhatsApp</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold">3.</span>
                <span>Startups click the activation link, verify details, and set their new password</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold">4.</span>
                <span>Once activated, startups can login with their phone number and new password</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold">5.</span>
                <span>The status will change from "Pending" to "Activated" automatically</span>
              </li>
            </ol>
          </div>
        </div>
      )}
    </div>
  );
};

export default IncubatorActivationDashboard;
