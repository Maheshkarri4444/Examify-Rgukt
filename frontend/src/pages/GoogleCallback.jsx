// import React, { useEffect, useRef } from 'react';
// import { useNavigate, useLocation } from 'react-router-dom';
// import Allapi from '../utils/common';
// import rguktLogo from "../assets/rgukt.png";

// function GoogleCallback() {
//   const navigate = useNavigate();
//   const location = useLocation();
//   const processedRef = useRef(false);

//   useEffect(() => {
//     const handleCallback = async () => {
//       if (processedRef.current) {
//         return;
//       }

//       try {
//         const code = new URLSearchParams(location.search).get('code');
//         if (!code) {
//           throw new Error('No authorization code received');
//         }

//         processedRef.current = true;

//         const response = await fetch(`${Allapi.googleCallback.url}?code=${code}`);
//         const data = await response.json();

//         // console.log("data present : ",JSON.stringify(data.user))
        
//         if (data.token && data.user) {
//           localStorage.setItem('token', data.token);
//           localStorage.setItem('user', JSON.stringify(data.user));
//           navigate(data.user.role === 'student' ? '/student' : '/teacher');
//         } else {
//           throw new Error('Invalid response from server');
//         }
//       } catch (error) {
//         console.error('Google callback error:', error);
//         if (processedRef.current) {
//           alert('Failed to complete Google login. Please try again.');
//           navigate('/login');
//         }
//       }
//     };

//     handleCallback();

//     return () => {
//       processedRef.current = false;
//     };
//   }, [location.search, navigate]);

//   return (
//     <div className="flex items-center justify-center min-h-screen p-4 bg-gray-900">
//       <div className="w-full max-w-md p-8 space-y-8 bg-gray-800 border-2 shadow-lg rounded-xl animate-scale-in border-blue-500/20">
//         <div className="space-y-4 text-center">
//           <div className="flex items-center content-center w-24 mx-auto transition-all duration-300 bg-white border-2 border-blue-300 rounded-lg h-28 animate-float">
//             <img 
//               src={rguktLogo} 
//               alt="Examify Logo" 
//               className="w-16 mx-auto h-17"
//             />
//           </div>
          
//           <div className="space-y-4 animate-fade-slide-up" style={{ animationDelay: '200ms' }}>
//             <h2 className="text-3xl font-bold text-white transition-all duration-300 hover:tracking-wide">
//               Processing Login
//             </h2>
//             <div className="flex flex-col items-center space-y-4">
//               <div className="relative w-16 h-16">
//                 <div className="absolute top-0 left-0 w-full h-full border-4 border-blue-500 rounded-full border-t-transparent animate-spin"></div>
//                 <div className="absolute border-4 border-blue-300 rounded-full top-1 left-1 w-14 h-14 border-t-transparent animate-spin" style={{ animationDuration: '1.5s' }}></div>
//               </div>
//               <p className="text-gray-400 animate-pulse">
//                 Please wait while we complete your sign in...
//               </p>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

// export default GoogleCallback;


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
    <div className="flex items-center justify-center min-h-screen p-4 bg-black">
      <div className="w-full max-w-md p-8 space-y-8 bg-gray-900 border-2 shadow-lg rounded-xl animate-scale-in border-blue-500/20">
        <div className="space-y-4 text-center">
          <div className="flex items-center content-center w-24 mx-auto transition-all duration-300 bg-white border-2 border-blue-300 rounded-lg h-28 animate-float">
            <img 
              src={rguktLogo} 
              alt="Examify Logo" 
              className="w-16 mx-auto h-17"
            />
          </div>
          
          <div className="space-y-4 animate-fade-slide-up" style={{ animationDelay: '200ms' }}>
            <h2 className="text-3xl font-bold text-blue-400 transition-all duration-300 hover:tracking-wide">
              Processing Login
            </h2>
            <div className="flex flex-col items-center space-y-4">
              <div className="relative w-16 h-16">
                <div className="absolute top-0 left-0 w-full h-full border-4 border-blue-500 rounded-full border-t-transparent animate-spin"></div>
                <div className="absolute border-4 border-blue-300 rounded-full top-1 left-1 w-14 h-14 border-t-transparent animate-spin" style={{ animationDuration: '1.5s' }}></div>
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