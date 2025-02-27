import React from 'react';
import { Outlet } from 'react-router-dom';
import StudentSidebar from './StudentSidebar';

function StudentOutlet() {
  return (
    <div className="flex h-screen bg-gray-900">
      <StudentSidebar />
      <main className="flex-1 p-8 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}

export default StudentOutlet;