import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Clock, User, Mail, FileText, Save } from 'lucide-react';
import { Toaster, toast } from 'react-hot-toast';
import Allapi from '../../utils/common';

function ExamSession() {
  const { id, answerSheetId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [questionPaper, setQuestionPaper] = useState(null);
  const [answerSheet, setAnswerSheet] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
  const [activeTypeIndex, setActiveTypeIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    const fetchExamData = async () => {
      try {
        setLoading(true);
        
        // Fetch answer sheet data
        const answerSheetResponse = await fetch(`${Allapi.backapi}/exam/answersheet/${answerSheetId}`, {
          headers: {
            'Authorization': `${localStorage.getItem('token')}`
          }
        });
        
        if (!answerSheetResponse.ok) {
          toast.error('Failed to fetch answer sheet');
          navigate('/student/exams');
          return;
        }
        
        const answerSheetData = await answerSheetResponse.json();
        setAnswerSheet(answerSheetData);
        
        // Initialize time left
        setTimeLeft(answerSheetData.duration * 60); // Convert minutes to seconds
        
        // Fetch question paper
        const questionPaperResponse = await fetch(Allapi.getQuestionPaper.url(answerSheetData.qpaper_id), {
          headers: {
            'Authorization': `${localStorage.getItem('token')}`
          }
        });
        
        if (!questionPaperResponse.ok) {
          toast.error('Failed to fetch question paper');
          return;
        }
        
        const questionPaperData = await questionPaperResponse.json();
        setQuestionPaper(questionPaperData);
        
        // Initialize answers array
        const initialAnswers = questionPaperData.questions.map(question => {
          return {
            question: question.question,
            answers: question.types.map(type => ({
              type,
              ans: ''
            }))
          };
        });
        
        setAnswers(initialAnswers);
      } catch (error) {
        console.error('Error fetching exam data:', error);
        toast.error('Failed to load exam');
      } finally {
        setLoading(false);
      }
    };
    
    if (answerSheetId) {
      fetchExamData();
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [answerSheetId, navigate]);
  
  useEffect(() => {
    if (timeLeft > 0 && !loading) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            submitExam();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [timeLeft, loading]);
  
  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  const handleAnswerChange = (questionIndex, typeIndex, value) => {
    const newAnswers = [...answers];
    newAnswers[questionIndex].answers[typeIndex].ans = value;
    setAnswers(newAnswers);
  };
  
  const submitExam = async () => {
    try {
      const response = await fetch(`${Allapi.backapi}/exam/submit-exam/${answerSheetId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ answers })
      });
      
      if (response.ok) {
        toast.success('Exam submitted successfully');
        navigate('/student/exams');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to submit exam');
      }
    } catch (error) {
      console.error('Error submitting exam:', error);
      toast.error('Failed to submit exam');
    }
  };
  
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
  
  if (!questionPaper || !answerSheet) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4">
        <FileText className="w-16 h-16 text-gray-400" />
        <h2 className="text-2xl font-bold text-white">Exam Not Found</h2>
        <button
          onClick={() => navigate('/student/exams')}
          className="flex items-center px-4 py-2 text-white transition-all duration-300 bg-green-500 rounded-lg hover:bg-green-600"
        >
          Back to Exams
        </button>
      </div>
    );
  }
  
  const currentQuestion = questionPaper.questions[activeQuestionIndex];
  
  return (
    <>
      <Toaster position="top-right" />
      <div className="flex flex-col h-full space-y-4">
        {/* Header with timer and user info */}
        <div className="flex flex-wrap items-center justify-between p-4 bg-gray-800 rounded-lg">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <User className="w-5 h-5 text-green-400" />
              <span className="text-white">{answerSheet.student_name}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Mail className="w-5 h-5 text-green-400" />
              <span className="text-white">{answerSheet.email}</span>
            </div>
            <div className="flex items-center space-x-2">
              <FileText className="w-5 h-5 text-green-400" />
              <span className="text-white">Set: {questionPaper.set}</span>
            </div>
          </div>
          
          <div className={`flex items-center px-4 py-2 space-x-2 rounded-lg ${
            timeLeft < 300 ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'
          }`}>
            <Clock className="w-5 h-5" />
            <span className="font-mono text-lg font-bold">{formatTime(timeLeft)}</span>
          </div>
        </div>
        
        {/* Question navigation */}
        <div className="flex flex-wrap gap-2 p-4 bg-gray-800 rounded-lg">
          {questionPaper.questions.map((question, index) => (
            <button
              key={index}
              onClick={() => setActiveQuestionIndex(index)}
              className={`w-10 h-10 flex items-center justify-center rounded-lg transition-all duration-300 ${
                activeQuestionIndex === index
                  ? 'bg-green-500 text-white'
                  : answers[index]?.answers.some(a => a.ans.trim() !== '')
                    ? 'bg-green-500/20 text-green-400'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {index + 1}
            </button>
          ))}
        </div>
        
        {/* Question and answer area */}
        <div className="flex-1 p-6 space-y-6 bg-gray-800 rounded-lg">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-white">
              Question {activeQuestionIndex + 1}
            </h2>
            <p className="text-lg text-white">{currentQuestion.question}</p>
            
            {/* Type tabs */}
            {currentQuestion.types.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {currentQuestion.types.map((type, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveTypeIndex(index)}
                    className={`px-4 py-2 rounded-lg transition-all duration-300 ${
                      activeTypeIndex === index
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            )}
            
            {/* Answer textarea */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300">
                {currentQuestion.types[activeTypeIndex] === 'text' 
                  ? 'Your Answer:' 
                  : `${currentQuestion.types[activeTypeIndex]} Code:`}
              </label>
              <textarea
                value={answers[activeQuestionIndex]?.answers[activeTypeIndex]?.ans || ''}
                onChange={(e) => handleAnswerChange(activeQuestionIndex, activeTypeIndex, e.target.value)}
                className="w-full h-64 px-4 py-3 font-mono text-white bg-gray-700 border-2 border-gray-600 rounded-lg focus:border-green-500 focus:outline-none"
                placeholder={currentQuestion.types[activeTypeIndex] === 'text' 
                  ? 'Type your answer here...' 
                  : `Write your ${currentQuestion.types[activeTypeIndex]} code here...`}
              />
            </div>
          </div>
          
          {/* Navigation buttons */}
          <div className="flex justify-between pt-4">
            <button
              onClick={() => setActiveQuestionIndex(prev => Math.max(0, prev - 1))}
              disabled={activeQuestionIndex === 0}
              className={`px-4 py-2 rounded-lg transition-all duration-300 ${
                activeQuestionIndex === 0
                  ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                  : 'bg-gray-700 text-white hover:bg-gray-600'
              }`}
            >
              Previous Question
            </button>
            
            {activeQuestionIndex < questionPaper.questions.length - 1 ? (
              <button
                onClick={() => setActiveQuestionIndex(prev => Math.min(questionPaper.questions.length - 1, prev + 1))}
                className="px-4 py-2 text-white transition-all duration-300 bg-green-500 rounded-lg hover:bg-green-600"
              >
                Next Question
              </button>
            ) : (
              <button
                onClick={submitExam}
                className="flex items-center px-6 py-2 text-white transition-all duration-300 bg-green-500 rounded-lg hover:bg-green-600"
              >
                <Save className="w-5 h-5 mr-2" />
                Submit Exam
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default ExamSession;