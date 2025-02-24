import React, { useState } from 'react';
import { ArrowLeft, Plus, X, Shuffle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Allapi from '../utils/common';

const QUESTION_TYPES = ['html', 'css', 'js', 'jquery', 'php', 'nodejs', 'mongodb', 'python', 'java'];
const DIFFICULTY_LEVELS = ['easy', 'medium', 'hard'];

function CreateExam() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    exam_name: '',
    exam_type: 'internal',
    duration: '', // Initialize as empty string
    available_dates: [],
    questions: []
  });

  const [newQuestion, setNewQuestion] = useState({
    question: '',
    types: [],
    level: 'medium'
  });

  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [selectedType, setSelectedType] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Convert duration to number and validate
    const durationNum = parseInt(formData.duration);
    if (isNaN(durationNum) || durationNum <= 0) {
      alert('Please enter a valid duration in minutes');
      return;
    }
    console.log("form data: ",formData)
    // Create submission data with duration as number
    const submissionData = {
      ...formData,
      duration: durationNum
    };
    console.log("sub data: ",submissionData)
    try {
      const response = await fetch(Allapi.createExam.url, {
        method: Allapi.createExam.method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `${localStorage.getItem('token')}`
        },
        body: JSON.stringify(submissionData)
      });

      if (response.ok) {
        const data = await response.json();
        navigate(`/teacher/exams/${data.exam_id}`);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to create exam');
      }
    } catch (error) {
      console.error('Failed to create exam:', error);
      alert('Failed to create exam. Please try again.');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const addQuestion = () => {
    if (newQuestion.question.trim() && newQuestion.types.length > 0 && newQuestion.level) {
      setFormData(prev => ({
        ...prev,
        questions: [...prev.questions, { ...newQuestion }]
      }));
      setNewQuestion({ question: '', types: [], level: 'medium' });
      setSelectedType('');
    }
  };

  const addType = () => {
    if (selectedType && !newQuestion.types.includes(selectedType)) {
      setNewQuestion(prev => ({
        ...prev,
        types: [...prev.types, selectedType]
      }));
      setSelectedType('');
    }
  };

  const removeType = (typeToRemove) => {
    setNewQuestion(prev => ({
      ...prev,
      types: prev.types.filter(type => type !== typeToRemove)
    }));
  };

  const removeQuestion = (index) => {
    setFormData(prev => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index)
    }));
  };

  const addDate = () => {
    if (selectedDate && selectedTime) {
      const dateTime = new Date(`${selectedDate}T${selectedTime}`);
      setFormData(prev => ({
        ...prev,
        available_dates: [...prev.available_dates, dateTime.toISOString()]
      }));
      setSelectedDate('');
      setSelectedTime('');
    }
  };

  const removeDate = (index) => {
    setFormData(prev => ({
      ...prev,
      available_dates: prev.available_dates.filter((_, i) => i !== index)
    }));
  };

  const shuffleQuestions = () => {
    setFormData(prev => ({
      ...prev,
      questions: [...prev.questions].sort(() => Math.random() - 0.5)
    }));
  };

  return (
    <div className="space-y-6 animate-fade-slide-up">
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate('/teacher/exams')}
          className="p-2 text-gray-400 transition-colors duration-300 hover:text-white"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-3xl font-bold text-white">Create New Exam</h1>
      </div>

      <form onSubmit={handleSubmit} className="p-8 space-y-6 bg-gray-800 border-2 rounded-xl border-blue-500/20">
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-300">
              Exam Name
            </label>
            <input
              type="text"
              name="exam_name"
              value={formData.exam_name}
              onChange={handleChange}
              className="w-full px-4 py-2 text-white transition-colors duration-300 bg-gray-700 border-2 border-gray-600 rounded-lg focus:border-blue-500 focus:outline-none"
              placeholder="Enter exam name"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-300">
              Exam Type
            </label>
            <select
              name="exam_type"
              value={formData.exam_type}
              onChange={handleChange}
              className="w-full px-4 py-2 text-white transition-colors duration-300 bg-gray-700 border-2 border-gray-600 rounded-lg focus:border-blue-500 focus:outline-none"
            >
              <option value="internal">Internal</option>
              <option value="external">External</option>
              <option value="viva">Viva</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-300">
              Duration (in minutes)
            </label>
            <input
              type="number"
              name="duration"
              value={formData.duration}
              onChange={handleChange}
              min="1"
              className="w-full px-4 py-2 text-white transition-colors duration-300 bg-gray-700 border-2 border-gray-600 rounded-lg focus:border-blue-500 focus:outline-none"
              placeholder="Enter duration in minutes"
            />
          </div>

          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-300">
              Available Dates
            </label>
            <div className="flex space-x-4">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="flex-1 px-4 py-2 text-white transition-colors duration-300 bg-gray-700 border-2 border-gray-600 rounded-lg focus:border-blue-500 focus:outline-none"
              />
              <input
                type="time"
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
                className="flex-1 px-4 py-2 text-white transition-colors duration-300 bg-gray-700 border-2 border-gray-600 rounded-lg focus:border-blue-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={addDate}
                className="px-4 py-2 text-blue-400 transition-all duration-300 rounded-lg bg-blue-500/20 hover:bg-blue-500/30"
              >
                Add Date
              </button>
            </div>
            <div className="space-y-2">
              {formData.available_dates.map((date, index) => (
                <div key={index} className="flex items-center justify-between px-4 py-2 bg-gray-700 rounded-lg">
                  <span className="text-white">
                    {new Date(date).toLocaleString()}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeDate(index)}
                    className="text-red-400 transition-colors duration-300 hover:text-red-300"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">Questions</h2>
            {formData.questions.length > 1 && (
              <button
                type="button"
                onClick={shuffleQuestions}
                className="flex items-center px-4 py-2 text-purple-400 transition-all duration-300 rounded-lg bg-purple-500/20 hover:bg-purple-500/30"
              >
                <Shuffle className="w-5 h-5 mr-2" />
                Shuffle Questions
              </button>
            )}
          </div>

          <div className="space-y-4">
            <div className="space-y-4">
              <input
                type="text"
                value={newQuestion.question}
                onChange={(e) => setNewQuestion(prev => ({ ...prev, question: e.target.value }))}
                placeholder="Enter question"
                className="w-full px-4 py-2 text-white transition-colors duration-300 bg-gray-700 border-2 border-gray-600 rounded-lg focus:border-blue-500 focus:outline-none"
              />
              
              <div className="flex space-x-4">
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="flex-1 px-4 py-2 text-white transition-colors duration-300 bg-gray-700 border-2 border-gray-600 rounded-lg focus:border-blue-500 focus:outline-none"
                >
                  <option value="">Select Type</option>
                  {QUESTION_TYPES.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={addType}
                  className="px-4 py-2 text-blue-400 transition-all duration-300 rounded-lg bg-blue-500/20 hover:bg-blue-500/30"
                >
                  Add Type
                </button>
              </div>

              <div className="flex space-x-4">
                <select
                  value={newQuestion.level}
                  onChange={(e) => setNewQuestion(prev => ({ ...prev, level: e.target.value }))}
                  className="flex-1 px-4 py-2 text-white transition-colors duration-300 bg-gray-700 border-2 border-gray-600 rounded-lg focus:border-blue-500 focus:outline-none"
                >
                  {DIFFICULTY_LEVELS.map(level => (
                    <option key={level} value={level}>{level}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={addQuestion}
                  className="flex items-center px-4 py-2 text-blue-400 transition-all duration-300 rounded-lg bg-blue-500/20 hover:bg-blue-500/30"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Add Question
                </button>
              </div>

              {newQuestion.types.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {newQuestion.types.map(type => (
                    <span
                      key={type}
                      className="flex items-center px-3 py-1 space-x-2 text-sm text-blue-400 rounded-full bg-blue-500/20"
                    >
                      <span>{type}</span>
                      <button
                        onClick={() => removeType(type)}
                        className="text-blue-400 hover:text-blue-300"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              {formData.questions.map((q, index) => (
                <div key={index} className="p-4 space-y-2 bg-gray-700 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <p className="text-white">{q.question}</p>
                      <div className="flex flex-wrap gap-2">
                        {q.types.map((type, typeIndex) => (
                          <span
                            key={typeIndex}
                            className="px-2 py-1 text-sm text-blue-400 rounded-full bg-blue-500/20"
                          >
                            {type}
                          </span>
                        ))}
                        <span className={`px-2 py-1 text-sm rounded-full ${
                          q.level === 'easy' ? 'bg-green-500/20 text-green-400' :
                          q.level === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-red-500/20 text-red-400'
                        }`}>
                          {q.level}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeQuestion(index)}
                      className="text-red-400 transition-colors duration-300 hover:text-red-300"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-gray-700">
          <button 
            type="submit"
            className="px-6 py-2 text-white transition-all duration-300 bg-blue-500 rounded-lg hover:bg-blue-600 hover:scale-105"
          >
            Create Exam
          </button>
        </div>
      </form>
    </div>
  );
}

export default CreateExam;