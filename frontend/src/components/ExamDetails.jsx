import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Clock, BookOpen, Pencil, Trash2, AlertCircle } from 'lucide-react';
import Allapi from '../utils/common';

function ExamDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [exam, setExam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedExam, setEditedExam] = useState(null);

  useEffect(() => {
    const fetchExam = async () => {
      try {
        const response = await fetch(Allapi.getExamById.url(id), {
          headers: {
            'Authorization': `${localStorage.getItem('token')}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setExam(data);
          setEditedExam(data);
        } else {
          const error = await response.json();
          setError(error.error || 'Failed to fetch exam details');
        }
      } catch (error) {
        setError('Failed to fetch exam details. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchExam();
  }, [id]);

  const handleSave = async () => {
    try {
      const response = await fetch(Allapi.updateExam.url, {
        method: Allapi.updateExam.method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `${localStorage.getItem('token')}`
        },
        body: JSON.stringify(editedExam)
      });

      if (response.ok) {
        setExam(editedExam);
        setIsEditing(false);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to update exam');
      }
    } catch (error) {
      alert('Failed to update exam. Please try again.');
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

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4">
        <AlertCircle className="w-16 h-16 text-red-500" />
        <p className="text-xl font-semibold text-white">{error}</p>
        <button
          onClick={() => navigate('/teacher/exams')}
          className="flex items-center px-4 py-2 text-white transition-all duration-300 bg-blue-500 rounded-lg hover:bg-blue-600"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Exams
        </button>
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4">
        <AlertCircle className="w-16 h-16 text-yellow-500" />
        <p className="text-xl font-semibold text-white">Exam not found</p>
        <button
          onClick={() => navigate('/teacher/exams')}
          className="flex items-center px-4 py-2 text-white transition-all duration-300 bg-blue-500 rounded-lg hover:bg-blue-600"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Exams
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-slide-up">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/teacher/exams')}
            className="p-2 text-gray-400 transition-colors duration-300 hover:text-white"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          {isEditing ? (
            <input
              type="text"
              value={editedExam.exam_name}
              onChange={(e) => setEditedExam({ ...editedExam, exam_name: e.target.value })}
              className="px-4 py-2 text-3xl font-bold text-white bg-transparent border-2 border-blue-500 rounded-lg focus:outline-none"
            />
          ) : (
            <h1 className="text-3xl font-bold text-white">{exam.exam_name}</h1>
          )}
        </div>
        <div className="flex space-x-4">
          {isEditing ? (
            <>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setEditedExam(exam);
                }}
                className="px-4 py-2 text-gray-400 transition-all duration-300 bg-gray-700 rounded-lg hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 text-white transition-all duration-300 bg-blue-500 rounded-lg hover:bg-blue-600"
              >
                Save Changes
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center px-4 py-2 text-blue-400 transition-all duration-300 rounded-lg bg-blue-500/20 hover:bg-blue-500/30"
              >
                <Pencil className="w-5 h-5 mr-2" />
                Edit
              </button>
              <button
                onClick={() => {
                  if (window.confirm('Are you sure you want to delete this exam?')) {
                    // Implement delete functionality
                  }
                }}
                className="flex items-center px-4 py-2 text-red-400 transition-all duration-300 rounded-lg bg-red-500/20 hover:bg-red-500/30"
              >
                <Trash2 className="w-5 h-5 mr-2" />
                Delete
              </button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="col-span-2 space-y-6">
          <div className="p-6 bg-gray-800 border-2 rounded-xl border-blue-500/20">
            <h2 className="mb-4 text-xl font-semibold text-white">Questions</h2>
            <div className="space-y-4">
              {exam.questions.map((q, index) => (
                <div key={index} className="p-4 transition-colors duration-300 bg-gray-700 rounded-lg hover:bg-gray-600">
                  <div className="space-y-2">
                    {isEditing ? (
                      <input
                        type="text"
                        value={editedExam.questions[index].question}
                        onChange={(e) => {
                          const newQuestions = [...editedExam.questions];
                          newQuestions[index] = { ...newQuestions[index], question: e.target.value };
                          setEditedExam({ ...editedExam, questions: newQuestions });
                        }}
                        className="w-full px-3 py-2 text-white bg-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <p className="text-white">{q.question}</p>
                    )}
                    <div className="flex flex-wrap gap-2">
                      {q.types.map((type, typeIndex) => (
                        <span
                          key={typeIndex}
                          className="px-2 py-1 text-sm text-blue-400 rounded-full bg-blue-500/20"
                        >
                          {type}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="p-6 bg-gray-800 border-2 rounded-xl border-blue-500/20">
            <h2 className="mb-4 text-xl font-semibold text-white">Exam Details</h2>
            <div className="space-y-4">
              <div className="flex items-center text-gray-300">
                <BookOpen className="w-5 h-5 mr-3" />
                <span>Type: {exam.exam_type}</span>
              </div>
              <div className="flex items-center text-gray-300">
                <Calendar className="w-5 h-5 mr-3" />
                <span>{exam.available_dates.length} available dates</span>
              </div>
              <div className="flex items-center text-gray-300">
                <Clock className="w-5 h-5 mr-3" />
                <span>{exam.questions.length} questions</span>
              </div>
            </div>
          </div>

          <div className="p-6 bg-gray-800 border-2 rounded-xl border-blue-500/20">
            <h2 className="mb-4 text-xl font-semibold text-white">Available Dates</h2>
            <div className="space-y-2">
              {exam.available_dates.map((date, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                  <span className="text-white">
                    {new Date(date).toLocaleString()}
                  </span>
                  {isEditing && (
                    <button
                      onClick={() => {
                        const newDates = editedExam.available_dates.filter((_, i) => i !== index);
                        setEditedExam({ ...editedExam, available_dates: newDates });
                      }}
                      className="text-red-400 hover:text-red-300"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ExamDetails;