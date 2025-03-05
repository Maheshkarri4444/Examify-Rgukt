import React, { useState, useEffect } from 'react';
import { Clock, Calendar, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Allapi from '../../utils/common';

function StudentExams() {
  const navigate = useNavigate();
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchExams = async () => {
      try {
        // localStorage.removeItem('answerSheet')
        const response = await fetch(Allapi.getExamsByDate.url, {
          headers: {
            'Authorization': `${localStorage.getItem('token')}`
          }
        });
        if (response.ok) {
            let data = await response.json();
            if (!data) {
              data = [];
            }
            setExams(data);
        } else {
          const error = await response.json();
          console.error('Failed to fetch available exams:', error);
        }
      } catch (error) {
        console.error('Failed to fetch available exams:', error);
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
          <div className="absolute w-full h-full border-4 border-green-500 rounded-full border-t-transparent animate-spin"></div>
          <div className="absolute border-4 border-green-300 rounded-full top-1 left-1 w-14 h-14 border-t-transparent animate-spin" style={{ animationDuration: '1.5s' }}></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-slide-up">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Available Exams</h1>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {exams.map((exam) => (
          <div
            key={exam._id}
            className="p-6 transition-all duration-300 bg-gray-800 border-2 rounded-xl border-green-500/20 hover:border-green-500/40 hover:scale-105 animate-scale-in"
          >
            <div className="space-y-4">
              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-white">{exam.exam_name}</h3>
                <div className="flex flex-wrap gap-2">
                  <span className="inline-block px-3 py-1 text-sm text-green-400 rounded-full bg-green-500/20">
                    {exam.exam_type}
                  </span>
                  <span className="inline-block px-3 py-1 text-sm text-purple-400 rounded-full bg-purple-500/20">
                    {exam.duration} minutes
                  </span>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center text-gray-300">
                  <Clock className="w-4 h-4 mr-2" />
                  <span>Duration: {exam.duration} minutes</span>
                </div>
              </div>

              <button
                className="w-full px-4 py-2 text-green-400 transition-all duration-300 rounded-lg bg-green-500/20 hover:bg-green-500/30"
                onClick={() => navigate(`/student/exams/${exam._id}`)}
              >
                Enter Exam
              </button>
            </div>
          </div>
        ))}

        {exams.length === 0 && (
          <div className="py-12 text-center bg-gray-800 border-2 col-span-full rounded-xl border-green-500/20">
            <div className="space-y-4">
              <BookOpen className="w-12 h-12 mx-auto text-gray-400" />
              <div className="space-y-2">
                <p className="text-xl font-semibold text-white">No Exams Available Today</p>
                <p className="text-gray-400">Check back later for upcoming exams</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default StudentExams;