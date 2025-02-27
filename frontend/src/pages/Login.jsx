import React from 'react';
import Allapi from '../utils/common';
import rguktLogo from "../assets/rgukt.png";

function Login() {
  const handleGoogleLogin = () => {
    window.location.href = Allapi.googleLogin.url;
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-gray-900">
      <div className="w-full max-w-md p-8 space-y-8 transition-all duration-300 bg-gray-800 border-2 shadow-lg rounded-xl animate-scale-in border-blue-500/40 hover:border-blue-500/60">
        <div className="space-y-4 text-center">
          <div className="flex items-center content-center w-24 mx-auto transition-all duration-300 bg-white rounded-lg border-6 border-blue-500/40 h-28 hover:bg-gray-100 hover:scale-110 animate-float">
            <img 
              src={rguktLogo} 
              alt="rgukt Logo" 
              className="w-16 mx-auto h-17"
            />
          </div>
          
          <div className="space-y-2 animate-fade-slide-up" style={{ animationDelay: '200ms' }}>
            <h2 className="text-3xl font-bold text-blue-400 transition-all duration-300 hover:tracking-wide">
              Welcome to Examify
            </h2>
            <p className="text-gray-400">Please sign in to continue</p>
          </div>
        </div>

        <div className="mt-8 animate-fade-slide-up " style={{ animationDelay: '400ms' }}>
          <button
            onClick={handleGoogleLogin}
            className="flex items-center justify-center w-full px-4 py-3 font-medium text-gray-800 transition-all duration-300 bg-white border-2 rounded-lg border-blue-500/40 hover:bg-gray-100 hover:shadow-xl hover:scale-105 group hover:border-blue-500/60"
          >
            <img
              src="https://www.google.com/favicon.ico"
              alt="Google"
              className="w-5 h-5 mr-2 transition-transform duration-300 group-hover:rotate-180"
            />
            <span className="transition-transform duration-300 group-hover:translate-x-1">
              Continue with Google
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default Login;