import React, { useState } from "react";
import { useAuth } from "./authContext";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, ArrowLeft } from "lucide-react";

const LoggingInAnimation = () => (
  <motion.div
    key="animation"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1, transition: { delay: 0.3 } }}
    exit={{ opacity: 0 }}
    className="flex flex-col items-center justify-center min-h-[300px]"
  >
    <div className="relative w-16 h-16 mb-6">
      <div 
        className="absolute inset-0 rounded-full border-4 border-transparent border-t-cyan-400 border-b-cyan-400 animate-spin" 
        style={{ animationDuration: '2s' }} 
      />
      <div 
        className="absolute inset-2 rounded-full border-4 border-transparent border-l-blue-500 border-r-blue-500 animate-spin" 
        style={{ animationDuration: '3s', animationDirection: 'reverse' }} 
      />
      <motion.div
        animate={{ scale: [1, 1.2, 1], opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 1.5, repeat: Infinity }}
        className="absolute inset-5 bg-gradient-to-tr from-cyan-400 to-blue-500 rounded-full shadow-lg"
      />
    </div>
    <p className="text-gray-600 font-bold animate-pulse text-lg">Verifying Access...</p>
  </motion.div>
);

export const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitting) return;
    setError("");
    setIsSubmitting(true);
    try {
      await login(username, password);
    } catch (err: any) {
      setError(err.message || "Login failed. Please check your credentials.");
      setIsSubmitting(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative z-10">

      {/* Back Button */}
      <a
        href="https://www.rohrmanacademy.com/"
        className="absolute top-6 left-6 flex items-center gap-2 transition-colors font-medium"
        style={{ color: "white" }}
      >
        <ArrowLeft className="w-5 h-5" />
        <span>Back</span>
      </a>

      {/* Glassmorphism Card */}
      <div className="bg-white/80 backdrop-blur-xl shadow-2xl rounded-3xl p-8 max-w-md w-full border border-white/40">
        <AnimatePresence mode="wait">
          {!isSubmitting ? (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
            >
              <div className="text-center mb-8">
                <h2 className="text-3xl font-extrabold text-gray-800">
                  Rohrman <span className="text-cyan-500">Access</span>
                </h2>
                <p className="text-gray-500 mt-2 font-medium">Please login with your credentials</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <div className="bg-rose-100 border border-rose-200 text-rose-700 p-4 rounded-xl text-sm font-medium flex items-center">
                    <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {error}
                  </div>
                )}

                {/* Username Input */}
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Email or Username"
                    value={username}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUsername(e.target.value)}
                    className="w-full bg-white/60 border border-gray-200 text-gray-800 py-3.5 pr-4 pl-12 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-400 transition-all shadow-sm"
                    required
                  />
                </div>

                {/* Password Input */}
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    value={password}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                    className="w-full bg-white/60 border border-gray-200 text-gray-800 py-3.5 pr-12 pl-12 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-400 transition-all shadow-sm"
                    required
                  />
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-cyan-500 transition-colors"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>

                {/* Options Row */}
                <div className="flex justify-between items-center text-sm font-medium px-1">
                  <label className="flex items-center text-gray-600 cursor-pointer hover:text-gray-800 transition-colors">
                    <input type="checkbox" className="mr-2 rounded border-gray-300 text-cyan-500 focus:ring-cyan-400 w-4 h-4 cursor-pointer" />
                    Remember me
                  </label>
                  <a href="https://www.rohrmanacademy.com/reset-password/" target="_blank" rel="noopener noreferrer" className="text-cyan-600 hover:text-cyan-700 hover:underline transition-colors">
                    Forgot Password?
                  </a>
                </div>

                {/* Submit Button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-gradient-to-r from-cyan-500 via-blue-600 to-green-400 bg-[length:200%_auto] hover:bg-[right_center] text-white px-6 py-3.5 rounded-xl font-bold shadow-md hover:shadow-lg hover:-translate-y-0.5 active:scale-95 active:translate-y-0 active:shadow-sm transition-all duration-200 ease-out disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Login to Dashboard
                  </button>
                </div>
              </form>
            </motion.div>
          ) : (
            <LoggingInAnimation />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};