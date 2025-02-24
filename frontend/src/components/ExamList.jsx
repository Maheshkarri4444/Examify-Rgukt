import React, { useState, useEffect } from 'react';
import { Plus, Clock, Calendar, BookOpen, Shuffle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Allapi from '../utils/common';

function ExamsList() {
  const navigate = useNavigate();
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generatingVariations, setGeneratingVariations] = useState(null);
  const [variationCount, setVariationCount] = useState({});

  useEffect(() => {
    const fetchExams = async () => {
      try {
        const response = await fetch(Allapi.getExams.url, {
          headers: {
            'Authorization': `${localStorage.getItem('token')}`
          }
        });
        if (response.ok) {
            console.log("response: ",response)
          const data = await response.json();
          setExams(data);
          console.log("exams: ",exams)
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

  const handleGenerateVariations = async (examId) => {
    if (!variationCount[examId]) {
      alert('Please enter the number of variations to generate');
      return;
    }

    setGeneratingVariations(examId);
    try {
      // Here you would call your API to generate variations
      // For now, we'll just simulate a delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      alert(`Generated ${variationCount[examId]} variations successfully!`);
    } catch (error) {
      console.error('Failed to generate variations:', error);
      alert('Failed to generate variations. Please try again.');
    } finally {
      setGeneratingVariations(null);
      setVariationCount(prev => ({ ...prev, [examId]: '' }));
    }
  };

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

              <div className="space-y-3">
                <button
                  className="w-full px-4 py-2 text-blue-400 transition-all duration-300 rounded-lg bg-blue-500/20 hover:bg-blue-500/30"
                  onClick={() => navigate(`/teacher/exams/${exam.id}`)}
                >
                  View Details
                </button>

                <div className="flex space-x-2">
                  <input
                    type="number"
                    value={variationCount[exam.id] || ''}
                    onChange={(e) => setVariationCount(prev => ({ ...prev, [exam.id]: e.target.value }))}
                    placeholder="# of variations"
                    className="flex-1 px-3 py-2 text-sm text-white transition-colors duration-300 bg-gray-700 border-2 border-gray-600 rounded-lg focus:border-blue-500 focus:outline-none"
                  />
                  <button
                    onClick={() => handleGenerateVariations(exam.id)}
                    disabled={generatingVariations === exam.id}
                    className="flex items-center px-3 py-2 text-purple-400 transition-all duration-300 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {generatingVariations === exam.id ? (
                      <div className="w-5 h-5 border-2 border-purple-400 rounded-full animate-spin border-t-transparent" />
                    ) : (
                      <Shuffle className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>
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