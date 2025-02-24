import React from 'react';
import { NavLink } from 'react-router-dom';
import { ClipboardList, FileCheck } from 'lucide-react';

export default function TeacherSidebar() {
  return (
    <div className="w-64 p-6 space-y-8 text-white bg-gray-800 border-r-2 border-blue-500/20">
      <div className="flex items-center justify-center space-x-3">
        <h1 className="text-2xl font-bold text-blue-400">Examify</h1>
      </div>
      
      <nav className="space-y-2">
        <NavLink
          to="/teacher/exams"
          className={({ isActive }) =>
            `flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-300 ${
              isActive
                ? 'bg-blue-500/20 text-blue-400'
                : 'hover:bg-gray-700/50 text-gray-300'
            }`
          }
        >
          <ClipboardList className="w-5 h-5" />
          <span>Exams</span>
        </NavLink>
        
        <NavLink
          to="/teacher/evaluations"
          className={({ isActive }) =>
            `flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-300 ${
              isActive
                ? 'bg-blue-500/20 text-blue-400'
                : 'hover:bg-gray-700/50 text-gray-300'
            }`
          }
        >
          <FileCheck className="w-5 h-5" />
          <span>Evaluations</span>
        </NavLink>
      </nav>
    </div>
  );
}