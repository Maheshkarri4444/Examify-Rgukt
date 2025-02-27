import React from 'react';
import { Award } from 'lucide-react';

function StudentResults() {
  return (
    <div className="flex flex-col items-center justify-center h-full space-y-6">
      <Award className="w-16 h-16 text-green-400" />
      <h1 className="text-3xl font-bold text-white">Results</h1>
      <p className="text-gray-400">Your exam results will appear here once available</p>
    </div>
  );
}

export default StudentResults;