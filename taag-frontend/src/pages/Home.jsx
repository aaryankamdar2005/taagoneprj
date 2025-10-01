import React from 'react'
import Navbar from '../components/Navbar'

const Home = () => {
  return (
    <div>
        <Navbar/>
        <div className="h-screen flex items-center justify-between px-20">
            {/* Left Section */}
            <div className="flex flex-col gap-6 max-w-xl text-left">
            {/* Main tagline */}
            <h1 className="text-4xl font-bold leading-tight text-gray-900">
                Connecting Startups, Investors <br /> & Incubators in One Place
            </h1>

            {/* Small description */}
            <p className="text-lg text-gray-600">
                Build. Invest. Connect. TIX brings startups, investors, and incubators
                together on one platform to spark growth, unlock funding, and
                accelerate innovation.
            </p>

            {/* Buttons */}
            <div className="flex gap-4 mt-4">
                <button className="px-6 py-3 bg-black text-white rounded-full font-medium hover:bg-gray-800 transition">
                Get Started
                </button>
                <button className="px-6 py-3 bg-yellow-400 text-black rounded-full font-medium hover:bg-yellow-500 transition">
                Explore
                </button>
            </div>
            </div>

            {/* Right Section (Image) */}
            <img
            src="./hero.png"
            alt="Hero"
            className="w-[400px] object-contain"
            />
        </div>
    </div>
  )
}

export default Home