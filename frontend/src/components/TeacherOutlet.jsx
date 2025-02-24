import React from 'react';
import { Outlet } from 'react-router-dom';
import TeacherSidebar from './TeacherSidebar';

function TeacherOutlet() {
  return (
    <div className="flex h-screen bg-gray-900">
      <TeacherSidebar />
      <main className="flex-1 p-8 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}

export default TeacherOutlet;