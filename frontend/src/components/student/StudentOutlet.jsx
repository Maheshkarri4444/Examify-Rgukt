import React from 'react';
import { Outlet } from 'react-router-dom';
import StudentSidebar from './StudentSidebar';
import PreventBack from '../../pages/PreventBack';

function StudentOutlet() {
  return (
    <div className="flex h-screen bg-gray-900">
    <PreventBack/>
      <StudentSidebar />
      <main className="flex-1 p-8 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}

export default StudentOutlet;