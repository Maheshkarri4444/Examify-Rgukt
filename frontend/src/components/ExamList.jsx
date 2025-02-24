import React, { useState, useEffect } from 'react';
import { Plus, Clock, Calendar, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Allapi from '../utils/common';

function ExamsList() {
  const navigate = useNavigate();
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchExams = async () => {
      try {
        const response = await fetch(Allapi.getExams.url, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          setExams(data);
        } else {
          const error = await response.json();
          console.error('Failed to fetch exams:', error);
        }
      } catch (error) {
        console.error('Failed to fetch exams:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchExams();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="relative w-16 h-16">
          <div className="absolute w-full h-full border-4 border-blue-500 rounded-full border-t-transparent animate-spin"></div>
          <div className="absolute border-4 border-blue-300 rounded-full top-1 left-1 w-14 h-14 border-t-transparent animate-spin" style={{ animationDuration: '1.5s' }}></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-slide-up">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Exams</h1>
        <button
          onClick={() => navigate('/teacher/exams/create')}
          className="flex items-center px-4 py-2 text-white transition-all duration-300 bg-blue-500 rounded-lg hover:bg-blue-600 hover:scale-105"
        >
          <Plus className="w-5 h-5 mr-2" />
          Create New Exam
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {exams.map((exam) => (
          <div
            key={exam.id}
            className="p-6 transition-all duration-300 bg-gray-800 border-2 rounded-xl border-blue-500/20 hover:border-blue-500/40 hover:scale-105 animate-scale-in"
          >
            <div className="space-y-4">
              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-white">{exam.exam_name}</h3>
                <span className="inline-block px-3 py-1 text-sm text-blue-400 rounded-full bg-blue-500/20">
                  {exam.exam_type}
                </span>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center text-gray-300">
                  <Calendar className="w-4 h-4 mr-2" />
                  <span>
                    {exam.available_dates.length} available date{exam.available_dates.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="flex items-center text-gray-300">
                  <BookOpen className="w-4 h-4 mr-2" />
                  <span>{exam.questions.length} questions</span>
                </div>
                {exam.available_dates[0] && (
                  <div className="flex items-center text-gray-300">
                    <Clock className="w-4 h-4 mr-2" />
                    <span>Next: {new Date(exam.available_dates[0]).toLocaleDateString()}</span>
                  </div>
                )}
              </div>

              <button
                className="w-full px-4 py-2 mt-4 text-blue-400 transition-all duration-300 rounded-lg bg-blue-500/20 hover:bg-blue-500/30"
                onClick={() => navigate(`/teacher/exams/${exam.id}`)}
              >
                View Details
              </button>
            </div>
          </div>
        ))}

        {exams.length === 0 && (
          <div className="py-12 text-center bg-gray-800 border-2 col-span-full rounded-xl border-blue-500/20">
            <div className="space-y-4">
              <BookOpen className="w-12 h-12 mx-auto text-gray-400" />
              <div className="space-y-2">
                <p className="text-xl font-semibold text-white">No Exams Created</p>
                <p className="text-gray-400">Create your first exam to get started</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ExamsList;