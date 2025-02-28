import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileCheck, Search, CheckCircle, Clock, AlertTriangle, ChevronRight } from 'lucide-react';
import { Toaster, toast } from 'react-hot-toast';
import Allapi from '../utils/common';

function TeacherEvaluations() {
  const [loading, setLoading] = useState(true);
  const [exams, setExams] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchFinishedExams = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${Allapi.backapi}/exam/getfinishedexamsbycontainer`, {
          headers: {
            'Authorization': `${localStorage.getItem('token')}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch exams');
        }

        const data = await response.json();
        setExams(data);
      } catch (error) {
        console.error('Error fetching exams:', error);
        toast.error('Failed to load exams');
      } finally {
        setLoading(false);
      }
    };

    fetchFinishedExams();
  }, []);

  const handleViewAnswerSheets = async (examId) => {
    navigate(`/teacher/evaluations/${examId}`);
  };

  const filteredExams = exams.filter(exam => 
    exam.exam_name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  console.log("filtered exams: ",filteredExams)

  return (
    <>
      <Toaster position="top-right" />
      <div className="space-y-6">
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl font-bold text-white">Evaluations</h1>
          <p className="text-gray-400">Review and grade student submissions</p>
        </div>

        {/* Search bar */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search className="w-5 h-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full p-4 pl-10 text-white bg-gray-800 border border-gray-700 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            placeholder="Search exams..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="relative w-16 h-16">
              <div className="absolute w-full h-full border-4 border-blue-500 rounded-full border-t-transparent animate-spin"></div>
              <div className="absolute border-4 border-blue-300 rounded-full top-1 left-1 w-14 h-14 border-t-transparent animate-spin" style={{ animationDuration: '1.5s' }}></div>
            </div>
          </div>
        ) : filteredExams.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <FileCheck className="w-16 h-16 text-gray-500" />
            <h2 className="text-2xl font-bold text-white">No Exams Found</h2>
            <p className="text-gray-400">
              {searchTerm ? 'No exams match your search criteria' : 'No exams are available for evaluation yet'}
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredExams.map((exam) => (
              <div key={exam.id} className="flex flex-col overflow-hidden transition-all duration-300 bg-gray-800 border border-gray-700 rounded-lg hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/10">
                <div className="p-6 space-y-4">
                  <div className="flex items-start justify-between">
                    <h3 className="text-xl font-bold text-white">{exam.exam_name}</h3>
                    <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                      exam.exam_type === 'internal' ? 'bg-purple-500/20 text-purple-400' :
                      exam.exam_type === 'external' ? 'bg-blue-500/20 text-blue-400' :
                      'bg-amber-500/20 text-amber-400'
                    }`}>
                      {exam.exam_type.charAt(0).toUpperCase() + exam.exam_type.slice(1)}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-2 text-gray-400">
                    <Clock className="w-4 h-4" />
                    <span>{exam.duration} minutes</span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-400">Answer Sheets:</span>
                    <span className="px-2 py-1 text-sm font-medium text-blue-400 rounded-md bg-blue-500/20">
                      {exam.answer_sheets.length}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between px-6 py-4 mt-auto bg-gray-700/50">
                  <div className="flex items-center space-x-2">
                    {exam.answer_sheets.length > 0 ? (
                      <CheckCircle className="w-5 h-5 text-green-400" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-amber-400" />
                    )}
                    <span className="text-gray-300">
                      {exam.answer_sheets.length > 0 
                        ? `${exam.answer_sheets.length} submissions` 
                        : 'No submissions yet'}
                    </span>
                  </div>
                  
                  <button
                    onClick={() => handleViewAnswerSheets(exam.id)}
                    className="flex items-center text-blue-400 transition-colors duration-300 hover:text-blue-300"
                  >
                    View
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

export default TeacherEvaluations;