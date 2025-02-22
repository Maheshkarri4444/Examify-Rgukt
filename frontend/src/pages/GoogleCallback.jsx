import React, { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Allapi from '../utils/common';
import rguktLogo from "../assets/rgukt.png";

function GoogleCallback() {
  const navigate = useNavigate();
  const location = useLocation();
  const processedRef = useRef(false);

  useEffect(() => {
    const handleCallback = async () => {
      if (processedRef.current) {
        return;
      }

      try {
        const code = new URLSearchParams(location.search).get('code');
        if (!code) {
          throw new Error('No authorization code received');
        }

        processedRef.current = true;

        const response = await fetch(`${Allapi.googleCallback.url}?code=${code}`);
        const data = await response.json();
        
        if (data.token && data.user) {
          localStorage.setItem('token', data.token);
          localStorage.setItem('user', JSON.stringify(data.user));
          navigate(data.user.role === 'student' ? '/student' : '/teacher');
        } else {
          throw new Error('Invalid response from server');
        }
      } catch (error) {
        console.error('Google callback error:', error);
        if (processedRef.current) {
          alert('Failed to complete Google login. Please try again.');
          navigate('/login');
        }
      }
    };

    handleCallback();

    return () => {
      processedRef.current = false;
    };
  }, [location.search, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 p-4">
      <div className="max-w-md w-full space-y-8 bg-gray-800 p-8 rounded-xl shadow-lg animate-scale-in border-2 border-blue-500/20">
        <div className="text-center space-y-4">
          <div className="mx-auto flex content-center items-center w-24 h-28 rounded-lg duration-300 transition-all bg-white animate-float border-2 border-blue-300">
            <img 
              src={rguktLogo} 
              alt="Examify Logo" 
              className="mx-auto h-17 w-16"
            />
          </div>
          
          <div className="space-y-4 animate-fade-slide-up" style={{ animationDelay: '200ms' }}>
            <h2 className="text-3xl font-bold text-white hover:tracking-wide  transition-all duration-300">
              Processing Login
            </h2>
            <div className="flex flex-col items-center space-y-4">
              <div className="relative w-16 h-16">
                <div className="absolute top-0 left-0 w-full h-full border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <div className="absolute top-1 left-1 w-14 h-14 border-4 border-blue-300 border-t-transparent rounded-full animate-spin" style={{ animationDuration: '1.5s' }}></div>
              </div>
              <p className="text-gray-400 animate-pulse">
                Please wait while we complete your sign in...
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default GoogleCallback;