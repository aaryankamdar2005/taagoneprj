import React, { useState } from 'react'
import { FcGoogle } from "react-icons/fc";
import { FaApple } from "react-icons/fa";
import { useNavigate } from 'react-router-dom';

const LoginInvestor = () => {
  const [formData, setFormData] = useState({
    phoneNumber: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Basic validation
    if (!formData.phoneNumber || !formData.password) {
      setError('Please fill in all fields');
      setLoading(false);
      return;
    }

    if (formData.phoneNumber.length !== 10) {
      setError('Please enter a valid 10-digit phone number');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber: formData.phoneNumber,
          password: formData.password,
          userType: 'investor' // Automatically set for investor route
        })
      });

      const data = await response.json();

      if (data.success) {
        // Store token and user info
        localStorage.setItem('token', data.token);
        localStorage.setItem('userType', data.user.userType);
        localStorage.setItem('userId', data.user.id);
        localStorage.setItem('phoneNumber', data.user.phoneNumber);
        
        // Navigate to investor dashboard
        navigate('/investor/dashboard');
      } else {
        setError(data.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white shadow-xl rounded-xl p-10 w-full max-w-md">
        <h2 className="text-3xl font-bold mb-6 text-center text-gray-800">
          Investor Login
        </h2>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <input
            type="tel"
            name="phoneNumber"
            value={formData.phoneNumber}
            onChange={handleInputChange}
            placeholder="Enter your mobile number"
            className="p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 placeholder-gray-400"
            maxLength="10"
            pattern="[0-9]{10}"
            required
          />
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleInputChange}
            placeholder="Enter your password"
            className="p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 placeholder-gray-400"
            required
          />
          <button 
            type="submit"
            disabled={loading}
            className="bg-yellow-400 text-black font-semibold py-3 rounded-lg hover:bg-yellow-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="my-6 flex items-center justify-center text-gray-500">
          <span className="border-b w-1/4 border-gray-300"></span>
          <span className="mx-2">or</span>
          <span className="border-b w-1/4 border-gray-300"></span>
        </div>

        <div className="flex flex-col gap-3">
          <button className="flex items-center justify-center gap-3 border rounded-lg py-2 hover:bg-gray-100 transition">
            <FcGoogle size={24} />
            <span className="text-gray-700 font-medium">Sign in with Google</span>
          </button>
          <button className="flex items-center justify-center gap-3 border rounded-lg py-2 hover:bg-gray-100 transition">
            <FaApple size={24} />
            <span className="text-gray-700 font-medium">Sign in with Apple</span>
          </button>
        </div>

        <p className="mt-6 text-center text-gray-500">
          Don't have an account?{" "}
          <a href="/investor/signup" className="text-yellow-400 font-medium hover:underline">
            Sign Up
          </a>
        </p>
      </div>
    </div>
  )
}

export default LoginInvestor;
