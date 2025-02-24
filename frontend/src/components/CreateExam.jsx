import React, { useState } from 'react';
import { ArrowLeft, Plus, Shuffle, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Allapi from '../utils/common';

function CreateExam() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    exam_name: '',
    exam_type: 'internal',
    available_dates: [],
    questions: []
  });
  const [shuffleCount, setShuffleCount] = useState('');
  const [newQuestion, setNewQuestion] = useState({
    question: '',
    types: []
  });
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(Allapi.createExam.url, {
        method: Allapi.createExam.method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        navigate('/teacher/exams');
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
    if (newQuestion.question.trim() && newQuestion.types.length > 0) {
      setFormData(prev => ({
        ...prev,
        questions: [...prev.questions, { ...newQuestion }]
      }));
      setNewQuestion({ question: '', types: [] });
    }
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
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <input
                type="text"
                value={newQuestion.question}
                onChange={(e) => setNewQuestion(prev => ({ ...prev, question: e.target.value }))}
                placeholder="Enter question"
                className="w-full px-4 py-2 text-white transition-colors duration-300 bg-gray-700 border-2 border-gray-600 rounded-lg focus:border-blue-500 focus:outline-none"
              />
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newQuestion.types.join(', ')}
                  onChange={(e) => setNewQuestion(prev => ({ ...prev, types: e.target.value.split(',').map(t => t.trim()) }))}
                  placeholder="Enter types (comma-separated)"
                  className="flex-1 px-4 py-2 text-white transition-colors duration-300 bg-gray-700 border-2 border-gray-600 rounded-lg focus:border-blue-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={addQuestion}
                  className="flex items-center px-4 py-2 text-blue-400 transition-all duration-300 rounded-lg bg-blue-500/20 hover:bg-blue-500/30"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Add Question
                </button>
              </div>
            </div>

            <div className="space-y-2">
              {formData.questions.map((q, index) => (
                <div key={index} className="p-4 space-y-2 bg-gray-700 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <p className="text-white">{q.question}</p>
                      <p className="text-sm text-gray-400">Types: {q.types.join(', ')}</p>
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

        <div className="flex items-center pt-4 space-x-4 border-t border-gray-700">
          <div className="flex-1">
            <div className="flex items-center space-x-4">
              <input
                type="number"
                value={shuffleCount}
                onChange={(e) => setShuffleCount(e.target.value)}
                placeholder="Enter number of variations"
                className="w-48 px-4 py-2 text-white transition-colors duration-300 bg-gray-700 border-2 border-gray-600 rounded-lg focus:border-blue-500 focus:outline-none"
              />
              <button 
                type="button"
                className="flex items-center px-4 py-2 text-purple-400 transition-all duration-300 rounded-lg bg-purple-500/20 hover:bg-purple-500/30"
              >
                <Shuffle className="w-5 h-5 mr-2" />
                Generate Variations
              </button>
            </div>
          </div>
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