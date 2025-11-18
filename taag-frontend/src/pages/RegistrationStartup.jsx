import React, { useState } from "react";
const API = import.meta.env.VITE_API_URL;
const RegistrationStartup = () => {
  const [formData, setFormData] = useState({
    phoneNumber: "",
    password: "",
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch(`${API}/api/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phoneNumber: formData.phoneNumber,
          password: formData.password,
          userType: "startup",
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Registration failed");
      }

      const data = await res.json();
      if (res.ok && data.success) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('userType', data.user.userType);
        localStorage.setItem('userId', data.user.id);
        localStorage.setItem('phoneNumber', data.user.phoneNumber);
        window.location.href = '/startup/';
      } else {
        throw new Error(data.message || "Registration failed");
      }
    } catch (err) {
      console.error("❌ Registration error:", err);
      alert(err.message);
    }
  };

  return (
    <div className="h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white shadow-xl rounded-xl p-10 w-full max-w-md">
        <h2 className="text-3xl font-bold mb-6 text-center text-gray-800">Startup Registration</h2>

        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <input
            type="tel"
            name="phoneNumber"
            value={formData.phoneNumber}
            onChange={handleChange}
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
            onChange={handleChange}
            placeholder="Enter your password"
            className="p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 placeholder-gray-400"
            required
          />

          <button
            type="submit"
            className="bg-yellow-400 text-black font-semibold py-3 rounded-lg hover:bg-yellow-500 transition"
          >
            Register
          </button>
        </form>
      </div>
    </div>
  );
};

export default RegistrationStartup;
