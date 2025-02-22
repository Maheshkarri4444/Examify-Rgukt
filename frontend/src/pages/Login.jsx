import React from 'react';
import Allapi from '../utils/common';
import rguktLogo from "../assets/rgukt.png";

function Login() {
  const handleGoogleLogin = () => {
    window.location.href = Allapi.googleLogin.url;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 p-4">
      <div className="max-w-md w-full space-y-8 bg-gray-800 p-8 rounded-xl shadow-lg animate-scale-in border-2 border-blue-500/20">
        <div className="text-center space-y-4">
          <div className="mx-auto flex content-center items-center w-24 h-28 rounded-lg duration-300 transition-all hover:bg-gray-100 bg-white hover:scale-110 animate-float border-2 border-blue-300">
            <img 
              src={rguktLogo} 
              alt="Examify Logo" 
              className="mx-auto h-17 w-16"
            />
          </div>
          
          <div className="space-y-2 animate-fade-slide-up" style={{ animationDelay: '200ms' }}>
            <h2 className="text-3xl font-bold text-white hover:tracking-wide transition-all duration-300">
              Welcome to Examify
            </h2>
            <p className="text-sm text-gray-400">Please sign in to continue</p>
          </div>
        </div>

        <div className="mt-8 animate-fade-slide-up" style={{ animationDelay: '400ms' }}>
          <button
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center px-4 py-3 bg-white hover:bg-gray-100 text-gray-800 font-medium rounded-lg transition-all duration-300 hover:shadow-xl hover:scale-105 group border border-blue-300 hover:border-blue-500"
          >
            <img
              src="https://www.google.com/favicon.ico"
              alt="Google"
              className="w-5 h-5 mr-2 group-hover:rotate-12 transition-transform duration-300"
            />
            <span className="group-hover:translate-x-1 transition-transform duration-300">
              Continue with Google
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default Login;