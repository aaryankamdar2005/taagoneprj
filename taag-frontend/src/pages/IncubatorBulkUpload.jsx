import React, { useState } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, Download, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
const API = import.meta.env.VITE_API_URL;
const fetchWithAuth = async (url, opts = {}) => {
  const token = localStorage.getItem("token");
  const res = await fetch(url, {
    ...opts,
    headers: {
      ...opts.headers,
      Authorization: `Bearer ${token}`,
    }
  });
  
  const contentType = res.headers.get("content-type") || "";
  
  if (!res.ok) {
    let errorMessage = `HTTP ${res.status}: ${res.statusText}`;
    
    if (contentType.includes("json")) {
      const errorData = await res.json();
      errorMessage = errorData.message || errorData.error || errorMessage;
    }
    
    throw new Error(errorMessage);
  }
  
  if (contentType.includes("json")) {
    return await res.json();
  }
  
  return await res.text();
};

const IncubatorBulkUpload = () => {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [extractedData, setExtractedData] = useState([]);
  const [parseComplete, setParseComplete] = useState(false);
  const [importing, setImporting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Drag and drop handlers
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const uploadedFile = e.dataTransfer.files[0];
      const validTypes = ['.xlsx', '.xls', '.csv'];
      const fileExtension = uploadedFile.name.toLowerCase().slice(uploadedFile.name.lastIndexOf('.'));
      
      if (validTypes.includes(fileExtension)) {
        setFile(uploadedFile);
        setError('');
      } else {
        setError('Please upload an Excel (.xlsx, .xls) or CSV file');
      }
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError('');
    }
  };

  // Parse the uploaded file
  const parseFile = async () => {
    if (!file) {
      setError('Please select a file');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const formData = new FormData();
      formData.append('excelFile', file);

      const token = localStorage.getItem('token');
      const res = await fetch(`${API}/api/incubator/bulk-upload/parse-excel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to parse file');
      }

      setExtractedData((data.data || data).startups || []);
      setParseComplete(true);
      setLoading(false);
      setSuccessMsg(`Successfully extracted ${(data.data || data).totalExtracted} startups from ${file.name}`);
      setTimeout(() => setSuccessMsg(''), 5000);

    } catch (err) {
      setError(err.message || 'Failed to parse file');
      setLoading(false);
    }
  };

  // Import startups to database
  const importStartups = async () => {
    if (extractedData.length === 0) {
      setError('No startup data to import');
      return;
    }

    if (!window.confirm(`Import ${extractedData.length} startups to database? This will create user accounts for them.`)) {
      return;
    }

    try {
      setImporting(true);
      setError('');

      const res = await fetchWithAuth(`${API}/api/incubator/bulk-upload/import-excel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ startups: extractedData })
      });

      const result = res.data || res;
      
      setImporting(false);
      setSuccessMsg(`Import completed! ✅ ${result.imported} new, ${result.updated} updated, ${result.failed} failed`);
      
      // Navigate to activation page after 2 seconds
      setTimeout(() => {
        navigate('/incubator-activation');
      }, 2000);

    } catch (err) {
      setError(err.message || 'Import failed');
      setImporting(false);
    }
  };

  // Download sample template
  const downloadTemplate = () => {
    const csvContent = `Company Name,Industry,Stage,Funding,Description,Website,Email,Phone,Founders,Location
TechVista Solutions,Technology,mvp,5000000,AI-powered business analytics platform,https://techvista.com,contact@techvista.com,+919876543210,Rahul Sharma,Mumbai
HealthCare Plus,Healthcare,early-revenue,10000000,Telemedicine platform,https://healthcareplus.in,info@healthcareplus.in,+919123456789,Dr. Amit Kumar,Bangalore
EduTech Pro,Education,growth,20000000,Online learning platform,https://edutechpro.com,support@edutechpro.com,+919988776655,Sneha Reddy,Delhi`;
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'startup_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Bulk Upload Startups</h1>
            <p className="text-gray-600">Import multiple startups from Excel or CSV file</p>
          </div>
          <button
            onClick={downloadTemplate}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
          >
            <Download size={18} />
            Download Template
          </button>
        </div>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="max-w-6xl mx-auto mb-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
            <p className="text-red-800">{error}</p>
          </div>
        </div>
      )}

      {successMsg && (
        <div className="max-w-6xl mx-auto mb-6">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
            <CheckCircle className="text-green-600 flex-shrink-0 mt-0.5" size={20} />
            <p className="text-green-800">{successMsg}</p>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto">
        {/* Upload Section */}
        {!parseComplete && (
          <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
            <h2 className="text-xl font-semibold mb-4">Step 1: Upload File</h2>
            
            <div
              className={`border-2 border-dashed rounded-lg p-12 text-center transition ${
                dragActive ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 bg-gray-50'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              {file ? (
                <div className="space-y-4">
                  <FileText className="w-16 h-16 mx-auto text-indigo-600" />
                  <div>
                    <p className="font-semibold text-lg text-gray-800">{file.name}</p>
                    <p className="text-sm text-gray-600">{(file.size / 1024).toFixed(2)} KB</p>
                  </div>
                  <button
                    onClick={() => {
                      setFile(null);
                      setError('');
                    }}
                    className="text-sm text-red-600 hover:underline"
                  >
                    Remove file
                  </button>
                </div>
              ) : (
                <div>
                  <Upload className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-700 mb-2 font-medium">Drag and drop your file here</p>
                  <p className="text-gray-500 text-sm mb-4">or</p>
                  <input
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileChange}
                    className="hidden"
                    id="file-upload"
                  />
                  <label
                    htmlFor="file-upload"
                    className="inline-block px-6 py-3 bg-indigo-600 text-white rounded-lg cursor-pointer hover:bg-indigo-700 transition"
                  >
                    Choose File
                  </label>
                  <p className="text-xs text-gray-500 mt-4">Supported formats: .xlsx, .xls, .csv (Max 20MB)</p>
                </div>
              )}
            </div>

            {file && (
              <button
                onClick={parseFile}
                disabled={loading}
                className="mt-6 w-full px-6 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold text-lg transition"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Parsing file...
                  </span>
                ) : (
                  'Parse File & Extract Data'
                )}
              </button>
            )}
          </div>
        )}

        {/* Preview Section */}
        {parseComplete && extractedData.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-semibold">Step 2: Review & Import</h2>
                <p className="text-gray-600 mt-1">Found {extractedData.length} startups</p>
              </div>
              <button
                onClick={() => {
                  setParseComplete(false);
                  setExtractedData([]);
                  setFile(null);
                }}
                className="text-sm text-indigo-600 hover:underline"
              >
                Upload Different File
              </button>
            </div>

            {/* Preview Table */}
            <div className="max-h-96 overflow-y-auto mb-6 border rounded-lg">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="text-left p-3 font-semibold">Company</th>
                    <th className="text-left p-3 font-semibold">Industry</th>
                    <th className="text-left p-3 font-semibold">Stage</th>
                    <th className="text-left p-3 font-semibold">Funding</th>
                    <th className="text-left p-3 font-semibold">Contact</th>
                  </tr>
                </thead>
                <tbody>
                  {extractedData.map((startup, index) => (
                    <tr key={index} className="border-b hover:bg-gray-50">
                      <td className="p-3">
                        <p className="font-semibold">{startup.companyName}</p>
                        <p className="text-xs text-gray-500">{startup.location || 'N/A'}</p>
                      </td>
                      <td className="p-3">{startup.industry || 'N/A'}</td>
                      <td className="p-3">
                        <span className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded text-xs">
                          {startup.stage || 'idea'}
                        </span>
                      </td>
                      <td className="p-3">₹{(startup.fundingAmount || 0).toLocaleString()}</td>
                      <td className="p-3">
                        <p className="text-xs">{startup.email || 'N/A'}</p>
                        <p className="text-xs text-gray-500">{startup.phone || 'N/A'}</p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Import Button */}
            <div className="space-y-4">
              <button
                onClick={importStartups}
                disabled={importing}
                className="w-full px-6 py-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold text-lg transition"
              >
                {importing ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Importing {extractedData.length} startups...
                  </span>
                ) : (
                  `Import ${extractedData.length} Startups to Database`
                )}
              </button>

              <button
                onClick={() => navigate('/incubator-activation')}
                className="w-full px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition flex items-center justify-center gap-2"
              >
                <Eye size={18} />
                View Activation Dashboard
              </button>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-6">
          <h3 className="font-semibold text-blue-900 mb-3">📋 File Format Guidelines</h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li className="flex items-start gap-2">
              <span>•</span>
              <span><strong>Required columns:</strong> Company Name, Industry</span>
            </li>
            <li className="flex items-start gap-2">
              <span>•</span>
              <span><strong>Optional columns:</strong> Stage, Funding, Description, Website, Email, Phone, Founders, Location</span>
            </li>
            <li className="flex items-start gap-2">
              <span>•</span>
              <span><strong>Stage values:</strong> idea, mvp, early-revenue, growth, scale</span>
            </li>
            <li className="flex items-start gap-2">
              <span>•</span>
              <span><strong>Funding:</strong> Enter numbers only (e.g., 5000000 for 50 lakhs)</span>
            </li>
            <li className="flex items-start gap-2">
              <span>•</span>
              <span><strong>After import:</strong> Activation credentials will be generated for all startups</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default IncubatorBulkUpload;
