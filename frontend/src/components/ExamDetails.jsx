import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Clock, BookOpen, Save, Trash2, Plus, Shuffle, FileText, X } from 'lucide-react';
import { Toaster, toast } from 'react-hot-toast';
import Allapi from '../utils/common';

const QUESTION_TYPES = ['html', 'css', 'js', 'jquery', 'php', 'nodejs', 'mongodb', 'python', 'java','text','none'];
const DIFFICULTY_LEVELS = ['easy', 'medium', 'hard']

function ExamDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [exam, setExam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedExam, setEditedExam] = useState(null);
  const [showCreateSets, setShowCreateSets] = useState(false);
  const [selectedSet, setSelectedSet] = useState(null);
  const [setQuestions, setSetQuestions] = useState(null);
  const [showAddDateModal, setShowAddDateModal] = useState(false);
  const [showAddQuestionModal, setShowAddQuestionModal] = useState(false);
  const [newDate, setNewDate] = useState('');
  const [newQuestion, setNewQuestion] = useState({
    question: '',
    level: 'medium',
    types: [],
    type: '' // Temporary field for input
  });
  const [setConfig, setSetConfig] = useState({
    num_sets: 1,
    hard: 0,
    medium: 0,
    easy: 0
  });
  

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
          toast.error('Failed to fetch exam details');
          console.error('Failed to fetch exam:', error);
        }
      } catch (error) {
        toast.error('Error loading exam details');
        console.error('Failed to fetch exam:', error);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchExam();
    }
  }, [id]);

  const fetchQuestionPaper = async (setId) => {
    try {
      const response = await fetch(Allapi.getQuestionPaper.url(setId), {
        headers: {
          'Authorization': `${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSetQuestions(data);
        setSelectedSet(setId);
      } else {
        toast.error('Failed to fetch question paper');
        console.error('Failed to fetch question paper');
      }
    } catch (error) {
      toast.error('Error loading question paper');
      console.error('Error fetching question paper:', error);
    }
  };

  const handleSave = async () => {
    if (!editedExam) return;

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
        toast.success('Exam updated successfully');
      } else {
        const error = await response.json();
        toast.error('Failed to update exam');
        console.error('Failed to update exam:', error);
      }
    } catch (error) {
      toast.error('Error updating exam');
      console.error('Failed to update exam:', error);
    }
  };

  const handleCreateSets = async () => {
    try {
      const response = await fetch(Allapi.createSets.url, {
        method: Allapi.createSets.method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          exam_id: id,
          ...setConfig
        })
      });

      if (response.ok) {
        const result = await response.json();
        setShowCreateSets(false);
        toast.success(currentExam.sets?.length > 0 ? 'Sets reshuffled successfully' : 'Sets created successfully');
        
        // Refresh exam data to show new sets
        const examResponse = await fetch(Allapi.getExamById.url(id), {
          headers: {
            'Authorization': `${localStorage.getItem('token')}`
          }
        });
        if (examResponse.ok) {
          const examData = await examResponse.json();
          setExam(examData);
          setEditedExam(examData);
        }
      } else {
        const error = await response.json();
        toast.error('Failed to create sets');
        console.error('Failed to create sets:', error);
      }
    } catch (error) {
      toast.error('Error creating sets');
      console.error('Failed to create sets:', error);
    }
  };

  const handleAddDate = () => {
    if (!newDate) {
      toast.error('Please select a date');
      return;
    }

    const newDates = [...editedExam.available_dates, new Date(newDate).toISOString()];
    setEditedExam({ ...editedExam, available_dates: newDates });
    setShowAddDateModal(false);
    setNewDate('');
    toast.success('Date added successfully');
  };

  const handleAddQuestion = () => {
    if (!newQuestion.question.trim()) {
      toast.error('Please enter a question');
      return;
    }

    if (newQuestion.types.length === 0) {
      toast.error('Please add at least one question type');
      return;
    }

    const updatedQuestions = [...editedExam.questions, {
      ...newQuestion,
      type: undefined // Remove temporary field
    }];

    setEditedExam({ ...editedExam, questions: updatedQuestions });
    setNewQuestion({
      question: '',
      level: 'medium',
      types: [],
      type: ''
    });
    setShowAddQuestionModal(false);
    toast.success('Question added successfully');
  };

  const handleAddQuestionType = () => {
    if (!newQuestion.type) return;
    if (newQuestion.types.includes(newQuestion.type)) {
      toast.error('This type already exists');
      return;
    }
    setNewQuestion({
      ...newQuestion,
      types: [...newQuestion.types, newQuestion.type],
      type: ''
    });
  };

  const handleRemoveQuestionType = (typeToRemove) => {
    setNewQuestion({
      ...newQuestion,
      types: newQuestion.types.filter(type => type !== typeToRemove)
    });
  };

  const handleCancel = () => {
    setEditedExam(exam);
    setIsEditing(false);
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

  if (!exam) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4">
        <BookOpen className="w-16 h-16 text-gray-400" />
        <h2 className="text-2xl font-bold text-white">Exam Not Found</h2>
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

  const currentExam = isEditing ? editedExam : exam;

  return (
    <>
      <Toaster position="top-right" />
      <div className="space-y-6 animate-fade-slide-up">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/teacher/exams')}
              className="p-2 text-gray-400 transition-colors duration-300 hover:text-white"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h1 className="text-3xl font-bold text-white">
              {isEditing ? (
                <input
                  type="text"
                  value={editedExam?.exam_name}
                  onChange={(e) => setEditedExam({ ...editedExam, exam_name: e.target.value })}
                  className="px-2 py-1 text-white bg-gray-700 border-2 border-gray-600 rounded focus:border-blue-500 focus:outline-none"
                />
              ) : (
                exam.exam_name
              )}
            </h1>
          </div>
          <div className="flex space-x-4">
            {isEditing ? (
              <>
                <button
                  onClick={handleSave}
                  className="flex items-center px-4 py-2 text-white transition-all duration-300 bg-green-500 rounded-lg hover:bg-green-600"
                >
                  <Save className="w-5 h-5 mr-2" />
                  Save Changes
                </button>
                <button
                  onClick={handleCancel}
                  className="flex items-center px-4 py-2 text-white transition-all duration-300 bg-gray-600 rounded-lg hover:bg-gray-700"
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setShowCreateSets(true)}
                  className="flex items-center px-4 py-2 text-purple-400 transition-all duration-300 rounded-lg bg-purple-500/20 hover:bg-purple-500/30"
                >
                  {currentExam.sets && currentExam.sets.length > 0 ? (
                    <>
                      <Shuffle className="w-5 h-5 mr-2" />
                      Reshuffle Sets
                    </>
                  ) : (
                    <>
                      <FileText className="w-5 h-5 mr-2" />
                      Create Sets
                    </>
                  )}
                </button>
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center px-4 py-2 text-white transition-all duration-300 bg-blue-500 rounded-lg hover:bg-blue-600"
                >
                  Edit Exam
                </button>
              </>
            )}
          </div>
        </div>

        {/* Modals */}
        {showCreateSets && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="fixed inset-0 bg-black/50" onClick={() => setShowCreateSets(false)} />
            <div className="relative w-full max-w-2xl p-6 mx-4 space-y-4 bg-gray-800 border-2 rounded-xl border-purple-500/20 animate-slide-up">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-white">
                  {currentExam.sets && currentExam.sets.length > 0 ? 'Reshuffle Sets' : 'Create Question Paper Sets'}
                </h2>
                <button
                  onClick={() => setShowCreateSets(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-300">
                    Number of Sets
                  </label>
                  <input
                    type="number"
                    value={setConfig.num_sets}
                    onChange={(e) => setSetConfig({ ...setConfig, num_sets: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 bg-gray-700 border-2 border-gray-600 rounded-lg focus:border-purple-500 focus:outline-none"
                    min="1"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-300">
                    Hard Questions
                  </label>
                  <input
                    type="number"
                    value={setConfig.hard}
                    onChange={(e) => setSetConfig({ ...setConfig, hard: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 bg-gray-700 border-2 border-gray-600 rounded-lg focus:border-purple-500 focus:outline-none"
                    min="0"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-300">
                    Medium Questions
                  </label>
                  <input
                    type="number"
                    value={setConfig.medium}
                    onChange={(e) => setSetConfig({ ...setConfig, medium: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 bg-gray-700 border-2 border-gray-600 rounded-lg focus:border-purple-500 focus:outline-none"
                    min="0"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-300">
                    Easy Questions
                  </label>
                  <input
                    type="number"
                    value={setConfig.easy}
                    onChange={(e) => setSetConfig({ ...setConfig, easy: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 bg-gray-700 border-2 border-gray-600 rounded-lg focus:border-purple-500 focus:outline-none"
                    min="0"
                  />
                </div>
              </div>
              <button
                onClick={handleCreateSets}
                className="w-full px-4 py-2 mt-4 text-white transition-all duration-300 bg-purple-500 rounded-lg hover:bg-purple-600"
              >
                {currentExam.sets && currentExam.sets.length > 0 ? 'Reshuffle Sets' : 'Create Sets'}
              </button>
            </div>
          </div>
        )}

        {selectedSet && setQuestions && (
          <div className="fixed inset-0 z-50 flex items-center justify-center max-h-screen ">
            <div className="fixed inset-0 bg-black/50" onClick={() => {
              setSelectedSet(null);
              setSetQuestions(null);
            }} />
            <div className="relative w-full max-w-4xl p-6 mx-4 space-y-4 overflow-y-auto bg-gray-800 rounded-xl max-h-[80vh] animate-slide-up">
              <div id='qpaperset' className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-white">Question Paper Set</h2>
                <button
                  onClick={() => {
                    setSelectedSet(null);
                    setSetQuestions(null);
                  }}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-4">
                {setQuestions.questions?.map((question, index) => (
                  <div key={index} className="p-4 space-y-3 bg-gray-700 rounded-lg">
                    <p className="text-white">{`${index + 1}. ${question.question}`}</p>
                    <div className="flex flex-wrap gap-2">
                      {question.types?.map((type, typeIndex) => (
                        <span
                          key={typeIndex}
                          className="px-2 py-1 text-sm text-blue-400 rounded-full bg-blue-500/20"
                        >
                          {type}
                        </span>
                      ))}
                      <span className={`px-2 py-1 text-sm rounded-full ${
                        question.level === 'easy' ? 'bg-green-500/20 text-green-400' :
                        question.level === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {question.level}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {showAddDateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="fixed inset-0 bg-black/50" onClick={() => setShowAddDateModal(false)} />
            <div className="relative w-full max-w-md p-6 mx-4 space-y-4 bg-gray-800 border-2 rounded-xl border-blue-500/20 animate-slide-up">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-white">Add New Date</h2>
                <button
                  onClick={() => setShowAddDateModal(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-300">
                    Select Date and Time
                  </label>
                  <input
                    type="datetime-local"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-700 border-2 border-gray-600 rounded-lg focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <button
                  onClick={handleAddDate}
                  className="w-full px-4 py-2 text-white transition-all duration-300 bg-blue-500 rounded-lg hover:bg-blue-600"
                >
                  Add Date
                </button>
              </div>
            </div>
          </div>
        )}

        {showAddQuestionModal && (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={() => setShowAddQuestionModal(false)} />
      <div className="relative w-full max-w-2xl p-6 mx-4 space-y-4 bg-gray-800 border-2 rounded-xl border-blue-500/20 animate-slide-up">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">Add New Question</h2>
          <button
            onClick={() => setShowAddQuestionModal(false)}
            className="text-gray-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-300">
              Question
            </label>
            <textarea
              value={newQuestion.question}
              onChange={(e) => setNewQuestion({ ...newQuestion, question: e.target.value })}
              className="w-full px-3 py-2 bg-gray-700 border-2 border-gray-600 rounded-lg focus:border-blue-500 focus:outline-none"
              rows="3"
              placeholder="Enter your question"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-300">
              Difficulty Level
            </label>
            <select
              value={newQuestion.level}
              onChange={(e) => setNewQuestion({ ...newQuestion, level: e.target.value })}
              className="w-full px-3 py-2 bg-gray-700 border-2 border-gray-600 rounded-lg focus:border-blue-500 focus:outline-none"
            >
              {DIFFICULTY_LEVELS.map(level => (
                <option key={level} value={level}>{level}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-300">
              Question Types
            </label>
            <div className="flex space-x-4">
              <select
                value={newQuestion.type}
                onChange={(e) => setNewQuestion({ ...newQuestion, type: e.target.value })}
                className="flex-1 px-4 py-2 text-white transition-colors duration-300 bg-gray-700 border-2 border-gray-600 rounded-lg focus:border-blue-500 focus:outline-none"
              >
                <option value="">Select Type</option>
                {QUESTION_TYPES.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
              <button
                onClick={handleAddQuestionType}
                className="px-4 py-2 text-blue-400 transition-all duration-300 rounded-lg bg-blue-500/20 hover:bg-blue-500/30"
              >
                Add Type
              </button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {newQuestion.types.map((type, index) => (
                <span
                  key={index}
                  className="flex items-center px-3 py-1 space-x-2 text-sm text-blue-400 rounded-full bg-blue-500/20"
                >
                  <span>{type}</span>
                  <button
                    onClick={() => handleRemoveQuestionType(type)}
                    className="text-blue-400 hover:text-blue-300"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </span>
              ))}
            </div>
          </div>
          <button
            onClick={handleAddQuestion}
            className="w-full px-4 py-2 text-white transition-all duration-300 bg-blue-500 rounded-lg hover:bg-blue-600"
          >
            Add Question
          </button>
        </div>
      </div>
    </div>
  )}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="p-6 space-y-4 bg-gray-800 border-2 rounded-xl border-blue-500/20">
            <h2 className="text-xl font-semibold text-white">Exam Details</h2>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">
                  Exam Type
                </label>
                {isEditing ? (
                  <select
                    value={editedExam?.exam_type}
                    onChange={(e) => setEditedExam({ ...editedExam, exam_type: e.target.value })}
                    className="w-full px-3 py-2 text-white bg-gray-700 border-2 border-gray-600 rounded-lg focus:border-blue-500 focus:outline-none"
                  >
                    <option value="internal">Internal</option>
                    <option value="external">External</option>
                    <option value="viva">Viva</option>
                  </select>
                ) : (
                  <div className="px-3 py-2 text-white bg-gray-700 rounded-lg">
                    {currentExam.exam_type}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">
                  Duration
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editedExam?.duration}
                    onChange={(e) => setEditedExam({ ...editedExam, duration: e.target.value })}
                    className="w-full px-3 py-2 text-white bg-gray-700 border-2 border-gray-600 rounded-lg focus:border-blue-500 focus:outline-none"
                  />
                ) : (
                  <div className="px-3 py-2 text-white bg-gray-700 rounded-lg">
                    {currentExam.duration}
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-2 text-gray-300">
                <Calendar className="w-5 h-5" />
                <span>{currentExam.available_dates.length} available dates</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-300">
                <BookOpen className="w-5 h-5" />
                <span>{currentExam.questions.length} questions</span>
              </div>
              {currentExam.sets && (
                <div className="flex items-center space-x-2 text-gray-300">
                  <FileText className="w-5 h-5" />
                  <span>{currentExam.sets.length} question paper sets</span>
                </div>
              )}
            </div>
          </div>

          <div className="col-span-2 p-6 space-y-4 bg-gray-800 border-2 rounded-xl border-blue-500/20">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">Available Dates</h2>
              {isEditing && (
                <button 
                  onClick={() => setShowAddDateModal(true)}
                  className="flex items-center px-3 py-1 text-sm text-blue-400 transition-all duration-300 rounded-lg bg-blue-500/20 hover:bg-blue-500/30"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Date
                </button>
              )}
            </div>
            <div className="space-y-2">
              {currentExam.available_dates.map((date, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Clock className="w-5 h-5 text-gray-400" />
                    <span className="text-white">{new Date(date).toLocaleString()}</span>
                  </div>
                  {isEditing && (
                    <button
                      onClick={() => {
                        const newDates = [...editedExam.available_dates];
                        newDates.splice(index, 1);
                        setEditedExam({ ...editedExam, available_dates: newDates });
                      }}
                      className="text-red-400 transition-colors duration-300 hover:text-red-300"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="p-6 space-y-4 bg-gray-800 border-2 rounded-xl border-blue-500/20">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">Questions</h2>
            {isEditing && (
              <button
                onClick={() => setShowAddQuestionModal(true)}
                className="flex items-center px-4 py-2 text-blue-400 transition-all duration-300 rounded-lg bg-blue-500/20 hover:bg-blue-500/30"
              >
                <Plus className="w-5 h-5 mr-2" />
                Add Question
              </button>
            )}
          </div>
          <div className="space-y-4">
            {currentExam.questions.map((question, index) => (
              <div key={index} className="p-4 space-y-3 bg-gray-700 rounded-lg">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    {isEditing ? (
                      <input
                        type="text"
                        value={question.question}
                        onChange={(e) => {
                          const newQuestions = [...editedExam.questions];
                          newQuestions[index] = { ...question, question: e.target.value };
                          setEditedExam({ ...editedExam, questions: newQuestions });
                        }}
                        className="w-full px-3 py-2 text-white bg-gray-600 border-2 border-gray-500 rounded-lg focus:border-blue-500 focus:outline-none"
                      />
                    ) : (
                      <p className="text-white">{question.question}</p>
                    )}
                    <div className="flex flex-wrap gap-2">
                      {question.types.map((type, typeIndex) => (
                        <span
                          key={typeIndex}
                          className="px-2 py-1 text-sm text-blue-400 rounded-full bg-blue-500/20"
                        >
                          {type}
                        </span>
                      ))}
                      <span className={`px-2 py-1 text-sm rounded-full ${
                        question.level === 'easy' ? 'bg-green-500/20 text-green-400' :
                        question.level === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {question.level}
                      </span>
                    </div>
                  </div>
                  {isEditing && (
                    <button
                      onClick={() => {
                        const newQuestions = [...editedExam.questions];
                        newQuestions.splice(index, 1);
                        setEditedExam({ ...editedExam, questions: newQuestions });
                      }}
                      className="text-red-400 transition-colors duration-300 hover:text-red-300"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {currentExam.sets && currentExam.sets.length > 0 && (
          <div className="p-6 space-y-4 bg-gray-800 border-2 rounded-xl border-purple-500/20">
            <h2 className="text-xl font-semibold text-white">Question Paper Sets</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {currentExam.sets.map((setId, index) => (
                <div key={setId} className="p-4 bg-gray-700 rounded-lg">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-white">Set {index + 1}</h3>
                    <button
                      onClick={(e) => {
                        e.preventDefault(); // Prevent default anchor behavior
                        fetchQuestionPaper(setId);
                        window.scrollTo({ top: 0, behavior: "smooth" }); // Scroll to top smoothly
                      }}
                      className="text-purple-400 transition-colors duration-300 hover:text-purple-300"
                    >
                      <FileText className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default ExamDetails;