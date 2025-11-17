import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Award, Phone, Lock, ArrowRight, AlertCircle } from "lucide-react";
const API = import.meta.env.VITE_API_URL;
const LoginMentor = () => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState("phone"); // 'phone', 'otp', 'password'
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);
  const navigate = useNavigate();

  // Send OTP
  const sendOTP = async (e) => {
    e.preventDefault();
    setError("");

    if (!phoneNumber || phoneNumber.length !== 10) {
      setError("Please enter a valid 10-digit phone number");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`${API}/api/auth/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to send OTP");
      }

      setIsNewUser(data.isNewUser || false);
      setStep("otp");
      setLoading(false);
    } catch (err) {
      setError(err.message || "Could not send OTP. Please try again.");
      setLoading(false);
    }
  };

  // Verify OTP
  const verifyOTP = async (e) => {
    e.preventDefault();
    setError("");

    if (!otp || otp.length !== 6) {
      setError("Please enter a valid 6-digit OTP");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`${API}/api/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber, otp }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Invalid OTP");
      }

      setStep("password");
      setLoading(false);
    } catch (err) {
      setError(err.message || "OTP verification failed");
      setLoading(false);
    }
  };

  // Login with Password
  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    if (!password || password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`${API}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumber,
          password,
          userType: "mentor",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Login failed");
      }

      // Save token
      localStorage.setItem("token", data.data?.token || data.token);
      localStorage.setItem("userType", "mentor");

      setLoading(false);

      // Navigate to mentor dashboard
      navigate("/mentor-dashboard");
    } catch (err) {
      setError(err.message || "Login failed. Please try again.");
      setLoading(false);
    }
  };

  // Register New Mentor
  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");

    if (!password || password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    try {
      setLoading(true);

      // First register the user
      const registerRes = await fetch(`${API}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumber,
          password,
          userType: "mentor",
        }),
      });

      const registerData = await registerRes.json();

      if (!registerRes.ok) {
        throw new Error(registerData.message || "Registration failed");
      }

      // Save token
      const token = registerData.data?.token || registerData.token;
      localStorage.setItem("token", token);
      localStorage.setItem("userType", "mentor");

      setLoading(false);

      // Redirect to application page (you'll need to create this)
      navigate("/mentor-application");
    } catch (err) {
      setError(err.message || "Registration failed");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-600 rounded-full mb-4">
            <Award className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Mentor Login</h1>
          <p className="text-gray-600">
            {step === "phone" && "Enter your phone number to continue"}
            {step === "otp" && "Enter the OTP sent to your phone"}
            {step === "password" && (isNewUser ? "Create your password" : "Enter your password")}
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Login Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Step 1: Phone Number */}
          {step === "phone" && (
            <form onSubmit={sendOTP}>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, "").slice(0, 10))}
                    placeholder="Enter 10-digit phone number"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    maxLength="10"
                    required
                  />
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  We'll send you an OTP to verify your number
                </p>
              </div>

              <button
                type="submit"
                disabled={loading || phoneNumber.length !== 10}
                className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  "Sending OTP..."
                ) : (
                  <>
                    Send OTP
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Step 2: OTP Verification */}
          {step === "otp" && (
            <form onSubmit={verifyOTP}>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Enter OTP
                </label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="Enter 6-digit OTP"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-center text-2xl tracking-widest"
                  maxLength="6"
                  required
                />
                <p className="mt-2 text-xs text-gray-500 text-center">
                  OTP sent to {phoneNumber}
                </p>
              </div>

              <button
                type="submit"
                disabled={loading || otp.length !== 6}
                className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {loading ? "Verifying..." : "Verify OTP"}
              </button>

              <button
                type="button"
                onClick={() => setStep("phone")}
                className="w-full mt-3 text-indigo-600 hover:text-indigo-700 text-sm font-medium"
              >
                Change Phone Number
              </button>
            </form>
          )}

          {/* Step 3: Password */}
          {step === "password" && (
            <form onSubmit={isNewUser ? handleRegister : handleLogin}>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {isNewUser ? "Create Password" : "Password"}
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={isNewUser ? "Create a password" : "Enter your password"}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    minLength="6"
                    required
                  />
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  {isNewUser ? "Password must be at least 6 characters" : "Enter your account password"}
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {loading ? "Processing..." : isNewUser ? "Create Account" : "Login"}
              </button>

              <button
                type="button"
                onClick={() => setStep("phone")}
                className="w-full mt-3 text-indigo-600 hover:text-indigo-700 text-sm font-medium"
              >
                Start Over
              </button>
            </form>
          )}
        </div>

        {/* Additional Info */}
        {step === "phone" && (
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              New mentor?{" "}
              <span className="text-indigo-600 font-medium">
                Complete the login process to apply
              </span>
            </p>
          </div>
        )}

        {/* Back to Home */}
        <div className="mt-6 text-center">
          <button
            onClick={() => navigate("/")}
            className="text-sm text-gray-600 hover:text-gray-800"
          >
            ← Back to Home
          </button>
        </div>

        {/* Info Card */}
        <div className="mt-8 bg-white rounded-xl p-6 shadow-lg">
          <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <Award className="w-5 h-5 text-indigo-600" />
            Become a Mentor
          </h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-1">✓</span>
              Share your expertise with startups
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-1">✓</span>
              Guide entrepreneurs in their journey
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-1">✓</span>
              Build your mentoring portfolio
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-1">✓</span>
              Connect with innovative companies
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default LoginMentor;
