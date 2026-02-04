import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Footer from '../components/Footer';
import logo from '../assets/logo.png';

const Login = () => {
    const [id, setId] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

   const handleSubmit = async (e) => {
  e.preventDefault();
  setError("");

  const success = await login(id, password);

  if (success) {
    navigate("/dashboard");
  } else {
    setError("Invalid ID or Password");
  }
};


    return (
        <div className="min-h-screen flex items-center justify-center bg-sky-50 relative">
            <div className="bg-white p-8 rounded-xl shadow-xl w-full max-w-md border border-sky-100 z-10">
                
                {/* LOGO */}
                <div className="flex justify-center mb-6">
                    <img
                        src={logo}
                        alt="Company Logo"
                        className="h-20 object-contain"
                    />
                </div>

                {/* TITLE */}
                <h2 className="text-2xl font-bold text-center text-sky-900 mb-6">
                    Asset Management System
                </h2>

                {/* FORM */}
                <form onSubmit={handleSubmit} className="space-y-5">
                    {error && (
                        <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm border border-red-100">
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            User ID
                        </label>
                        <input
                            type="text"
                            value={id}
                            onChange={(e) => setId(e.target.value)}
                            className="w-full px-4 py-2 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 transition"
                            placeholder="Enter your ID"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Password
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-2 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 transition"
                            placeholder="Enter your password"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-sky-600 hover:bg-sky-700 text-white font-semibold py-2.5 rounded-md transition shadow-sm"
                    >
                        Login
                    </button>
                </form>

                {/* CREDENTIAL HINT */}
                <div className="mt-6 text-center text-xs text-slate-400">
                    <p>Admin: admin / admin123</p>
                    <p>User: user / user123</p>
                </div>
            </div>

            {/* FOOTER */}
            <div className="absolute bottom-0 w-full">
                <Footer />
            </div>
        </div>
    );
};

export default Login;


