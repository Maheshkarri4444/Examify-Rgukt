import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, Play, Clock, BookOpen } from 'lucide-react';
import { Toaster, toast } from 'react-hot-toast';
import Allapi from '../../utils/common';

function ExamEntryPoint() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [examDetails, setExamDetails] = useState(null);
  const [answerSheet, setAnswerSheet] = useState(null);
  const [questionPaper, setQuestionPaper] = useState(null);
  const [showQuestions, setShowQuestions] = useState(false);

  useEffect(() => {
    const assignQuestionPaper = async () => {
      try {
        setLoading(true);
  
        // Check if answerSheet already exists in localStorage
        const savedAnswerSheet = localStorage.getItem('answerSheet');
        if (savedAnswerSheet) {
          setAnswerSheet(JSON.parse(savedAnswerSheet));
        //   setLoading(false);
        //   return;
        }
  
        const response = await fetch(`${Allapi.assignSetAndCreateAnswerSheet.url}/${id}`, {
          method: Allapi.assignSetAndCreateAnswerSheet.method,
          headers: {
            'Authorization': `${localStorage.getItem('token')}`
          }
        });
  
        if (response.ok) {
          const data = await response.json();
          // console.log("answersheet data: ",data)
          setAnswerSheet(data);
  
          // Store answerSheet in localStorage
          localStorage.setItem('answerSheet', JSON.stringify(data));
  
          // Fetch exam details
          const examResponse = await fetch(Allapi.getExamById.url(id), {
            headers: {
              'Authorization': `${localStorage.getItem('token')}`
            }
          });
  
          if (examResponse.ok) {
            const examData = await examResponse.json();
            setExamDetails(examData);
          }
        } else {
          const error = await response.json();
          toast.error(error.error || 'Failed to assign question paper');
        }
      } catch (error) {
        console.error('Error assigning question paper:', error);
        toast.error('Failed to assign question paper');
      } finally {
        setLoading(false);
      }
    };
  
    if (id) {
      assignQuestionPaper();
    }
  }, [id]);
  

  const fetchQuestionPaper = async () => {
    if (!answerSheet || !answerSheet.qpaper_id) {
      toast.error('Question paper ID not found');
      return;
    }

    try {
      const response = await fetch(Allapi.getQuestionPaper.url(answerSheet.qpaper_id), {
        headers: {
          'Authorization': `${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setQuestionPaper(data);
        setShowQuestions(true);
      } else {
        toast.error('Failed to fetch question paper');
      }
    } catch (error) {
      console.error('Error fetching question paper:', error);
      toast.error('Failed to fetch question paper');
    }
  };

  const startExam = async () => {
    if (!answerSheet || !answerSheet._id) {
      toast.error('Answer sheet ID not found');
      return;
    }

    try {
      const response = await fetch(`${Allapi.backapi}/exam/start-exam/${answerSheet._id}`, {
        method: 'POST',
        headers: {
          'Authorization': `${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        console.log("answersheet: ",answerSheet.qpaper_id)
        toast.success('Exam started successfully');
        navigate(`/exams/${answerSheet._id}/session/${answerSheet.qpaper_id}`);
        localStorage.removeItem('answerSheet')
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to start exam');
      }
    } catch (error) {
      console.error('Error starting exam:', error);
      toast.error('Failed to start exam');
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

  if (!answerSheet) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4">
        <BookOpen className="w-16 h-16 text-gray-400" />
        <h2 className="text-2xl font-bold text-white">Exam Not Found</h2>
        <button
          onClick={() => navigate('/student/exams')}
          className="flex items-center px-4 py-2 text-white transition-all duration-300 bg-green-500 rounded-lg hover:bg-green-600"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Exams
        </button>
      </div>
    );
  }

  return (
    <>
      <Toaster position="top-right" />
      <div className="space-y-6 animate-fade-slide-up">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/student/exams')}
            className="p-2 text-gray-400 transition-colors duration-300 hover:text-white"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-3xl font-bold text-white">{answerSheet.exam_name}</h1>
        </div>

        <div className="p-8 space-y-6 bg-gray-800 border-2 rounded-xl border-green-500/20">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-white">Exam Details</h2>
              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-gray-300">
                  <Clock className="w-5 h-5 text-green-400" />
                  <span>Duration: {answerSheet.duration} minutes</span>
                </div>
                <div className="flex items-center space-x-2 text-gray-300">
                  <FileText className="w-5 h-5 text-green-400" />
                  <span>Set Number: {answerSheet.set}</span>
                </div>
                <div className="flex items-center space-x-2 text-gray-300">
                  <BookOpen className="w-5 h-5 text-green-400" />
                  <span>Exam Type: {answerSheet.exam_type}</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-white">Student Information</h2>
              <div className="space-y-2">
                <p className="text-gray-300">Name: <span className="text-white">{answerSheet.student_name}</span></p>
                <p className="text-gray-300">Email: <span className="text-white">{answerSheet.email}</span></p>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center pt-6 space-y-4 border-t border-gray-700">
            <div className="text-center">
              <p className="text-lg text-white">Ready to begin your exam?</p>
              <p className="text-gray-400">Make sure you have enough time to complete the exam once started.</p>
            </div>
            
            <div className="flex flex-wrap justify-center gap-4">

                <button
                  onClick={fetchQuestionPaper}
                  className="flex items-center px-6 py-3 text-purple-400 transition-all duration-300 rounded-lg bg-purple-500/20 hover:bg-purple-500/30"
                >
                  <FileText className="w-5 h-5 mr-2" />
                  View Questions
                </button>
              
                {(answerSheet.exam_type != 'internal' ) && (
              <button
                onClick={startExam}
                className="flex items-center px-6 py-3 text-white transition-all duration-300 bg-green-500 rounded-lg hover:bg-green-600"
              >
                <Play className="w-5 h-5 mr-2" />
                Start Exam
              </button>)}
            </div>
          </div>
        </div>

        {showQuestions && questionPaper && (
          <div className="p-8 space-y-6 bg-gray-800 border-2 rounded-xl border-purple-500/20">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">Question Paper - Set {questionPaper.set}</h2>
              <button
                onClick={() => setShowQuestions(false)}
                className="px-4 py-2 text-purple-400 transition-all duration-300 rounded-lg bg-purple-500/20 hover:bg-purple-500/30"
              >
                Hide Questions
              </button>
            </div>
            
            <div className="space-y-4">
              {questionPaper.questions?.map((question, index) => (
                <div key={index} className="p-4 space-y-3 bg-gray-700 rounded-lg">
                  <p className="text-white">{`${index + 1}. ${question.question}`}</p>
                  <div className="flex flex-wrap gap-2">
                    {question.types?.map((type, typeIndex) => (
                      <span
                        key={typeIndex}
                        className="px-2 py-1 text-sm text-purple-400 rounded-full bg-purple-500/20"
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
        )}
      </div>
    </>
  );
}

export default ExamEntryPoint;
