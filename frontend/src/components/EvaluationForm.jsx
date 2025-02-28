import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, User, Mail, FileText, CheckCircle, AlertTriangle, Cpu } from 'lucide-react';
import { Toaster, toast } from 'react-hot-toast';
import Allapi from '../utils/common';

function EvaluationForm() {
  const { evaluationId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [evaluation, setEvaluation] = useState(null);
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
  const [marks, setMarks] = useState([]);
  const [totalMarks, setTotalMarks] = useState(0);
  const [saving, setSaving] = useState(false);
  const [aiEvaluating, setAiEvaluating] = useState(false);

  useEffect(() => {
    const fetchEvaluation = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${Allapi.backapi}/exam/getevaluation/${evaluationId}`, {
          headers: {
            'Authorization': `${localStorage.getItem('token')}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch evaluation');
        }

        const data = await response.json();
        setEvaluation(data);
        
        // Initialize marks array
        const initialMarks = data.data.map(item => item.marks || 0);
        setMarks(initialMarks);
        
        // Calculate total marks
        const total = initialMarks.reduce((sum, mark) => sum + mark, 0);
        setTotalMarks(total);
      } catch (error) {
        console.error('Error fetching evaluation:', error);
        toast.error('Failed to load evaluation');
      } finally {
        setLoading(false);
      }
    };

    fetchEvaluation();
  }, [evaluationId]);

  const handleMarkChange = (index, value) => {
    const newMarks = [...marks];
    const parsedValue = parseInt(value);
    newMarks[index] = parsedValue;
    setMarks(newMarks);
    
    // Update total marks
    const total = newMarks.reduce((sum, mark) => sum + mark, 0);
    setTotalMarks(total);
  };

  const handleAiEvaluate = async () => {
    try {
      setAiEvaluating(true);
      const currentQuestion = evaluation.data[activeQuestionIndex];
      
      // Prepare the prompt for AI
      let prompt = `Please evaluate the following answer to this question:\n\n`;
      prompt += `Question: ${currentQuestion.question}\n\n`;
      
      // Add all answers
      prompt += `Answers:\n`;
      currentQuestion.answers.forEach(answer => {
        if (answer.ans.trim()) {
          prompt += `${answer.type.toUpperCase()}: ${answer.ans}\n\n`;
        }
      });
      
      prompt += `Please provide two things:\n`;
      prompt += `1. A brief evaluation of the answer quality and correctness (2-3 sentences maximum).\n`;
      prompt += `2. A percentage score from 0-100% that represents how good the answer is.\n\n`;
      prompt += `Format your response as follows:\n`;
      prompt += `Evaluation: [Your brief evaluation]\n`;
      prompt += `Score: [percentage]%`;
      
      // Call the AI API
      const response = await fetch(`${Allapi.backapi}/ai/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          prompt: prompt
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to get AI evaluation');
      }
      
      const data = await response.json();
      
      // Update the evaluation with AI feedback
      const updatedEvaluation = { ...evaluation };
      updatedEvaluation.data[activeQuestionIndex].ai_evaluation = data.response;
      
      // Try to extract percentage score
      try {
        const scoreMatch = data.response.match(/Score:\s*(\d+)%/i);
        if (scoreMatch && scoreMatch[1]) {
          updatedEvaluation.data[activeQuestionIndex].ai_score = parseInt(scoreMatch[1]);
        }
      } catch (err) {
        console.error('Error parsing AI score:', err);
      }
      
      setEvaluation(updatedEvaluation);
      
      toast.success('AI evaluation completed');
    } catch (error) {
      console.error('Error getting AI evaluation:', error);
      toast.error('Failed to get AI evaluation');
    } finally {
      setAiEvaluating(false);
    }
  };

  const handleSaveEvaluation = async () => {
    try {
      setSaving(true);
      
      // Update evaluation data with marks
      const updatedData = evaluation.data.map((item, index) => ({
        ...item,
        marks: marks[index]
      }));
      
      const response = await fetch(`${Allapi.backapi}/exam/updateevaluation/${evaluationId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          data: updatedData,
          total_marks: totalMarks
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save evaluation');
      }

      toast.success('Evaluation saved successfully');
      navigate('/teacher/evaluations');
    } catch (error) {
      console.error('Error saving evaluation:', error);
      toast.error('Failed to save evaluation');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="relative w-16 h-16">
          <div className="absolute w-full h-full border-4 border-blue-500 rounded-full border-t-transparent animate-spin"></div>
          <div className="absolute border-4 border-blue-300 rounded-full top-1 left-1 w-14 h-14 border-t-transparent animate-spin" style={{ animationDuration: '1.5s' }}></div>
        </div>
      </div>
    );
  }

  if (!evaluation) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4">
        <FileText className="w-16 h-16 text-gray-400" />
        <h2 className="text-2xl font-bold text-white">Evaluation Not Found</h2>
        <button
          onClick={() => navigate('/teacher/evaluations')}
          className="flex items-center px-4 py-2 text-white transition-all duration-300 bg-blue-500 rounded-lg hover:bg-blue-600"
        >
          Back to Evaluations
        </button>
      </div>
    );
  }

  const currentQuestion = evaluation.data[activeQuestionIndex];

  return (
    <>
      <Toaster position="top-right" />
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 text-gray-400 transition-colors duration-300 bg-gray-800 rounded-full hover:text-white hover:bg-gray-700"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-white">Evaluation</h1>
            <p className="text-gray-400">{evaluation.exam_name}</p>
          </div>
        </div>

        {/* Student info */}
        <div className="p-6 bg-gray-800 border border-gray-700 rounded-lg">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center justify-center flex-shrink-0 w-12 h-12 rounded-full bg-blue-500/20">
                <User className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-white">{evaluation.student_name}</h3>
                <div className="flex items-center text-gray-400">
                  <Mail className="w-4 h-4 mr-2" />
                  {evaluation.email}
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="px-4 py-2 bg-gray-700 rounded-lg">
                <span className="text-sm text-gray-400">Set:</span>
                <span className="ml-2 text-white">{evaluation.set}</span>
              </div>
              <div className="px-4 py-2 bg-gray-700 rounded-lg">
                <span className="text-sm text-gray-400">Total Marks:</span>
                <span className="ml-2 text-white">{totalMarks}</span>
              </div>
              {evaluation.ai_score && (
                <div className="px-4 py-2 rounded-lg bg-blue-500/20">
                  <span className="text-sm text-gray-400">AI Score:</span>
                  <span className="ml-2 text-blue-400">{evaluation.ai_score.toFixed(2)}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Question navigation */}
        <div className="flex flex-wrap gap-2 p-4 bg-gray-800 border border-gray-700 rounded-lg">
          {evaluation.data.map((item, index) => (
            <button
              key={index}
              onClick={() => setActiveQuestionIndex(index)}
              className={`w-10 h-10 flex items-center justify-center rounded-lg transition-all duration-300 ${
                activeQuestionIndex === index
                  ? 'bg-blue-500 text-white'
                  : marks[index] > 0
                    ? 'bg-blue-500/20 text-blue-400'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {index + 1}
            </button>
          ))}
        </div>

        {/* Question and answer area */}
        <div className="p-6 space-y-6 bg-gray-800 border border-gray-700 rounded-lg">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-white">
              Question {activeQuestionIndex + 1}
            </h2>
            <p className="text-lg text-white">{currentQuestion.question}</p>
            
            {/* Student answers */}
            <div className="space-y-4">
              {currentQuestion.answers.map((answer, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-medium text-gray-300">
                      {answer.type.toUpperCase()} Answer:
                    </label>
                    {answer.ans.trim() ? (
                      <span className="flex items-center text-sm text-green-400">
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Answered
                      </span>
                    ) : (
                      <span className="flex items-center text-sm text-amber-400">
                        <AlertTriangle className="w-4 h-4 mr-1" />
                        Not Answered
                      </span>
                    )}
                  </div>
                  <div className="p-4 font-mono text-white whitespace-pre-wrap bg-gray-700 border border-gray-600 rounded-lg">
                    {answer.ans.trim() || 'No answer provided'}
                  </div>
                </div>
              ))}
            </div>
            
            {/* AI Evaluation Button */}
            <div className="flex justify-end">
              <button
                onClick={handleAiEvaluate}
                disabled={aiEvaluating || currentQuestion.answers.every(a => !a.ans.trim())}
                className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${
                  aiEvaluating || currentQuestion.answers.every(a => !a.ans.trim())
                    ? 'text-gray-400 bg-gray-700 cursor-not-allowed'
                    : 'text-white bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {aiEvaluating ? (
                  <>
                    <div className="w-4 h-4 mr-2 border-2 border-gray-400 rounded-full border-t-transparent animate-spin"></div>
                    AI Evaluating...
                  </>
                ) : (
                  <>
                    <Cpu className="w-4 h-4 mr-2" />
                    AI Evaluate
                  </>
                )}
              </button>
            </div>
            
            {/* AI Evaluation */}
            {currentQuestion.ai_evaluation && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-blue-400">AI Evaluation</h3>
                  {currentQuestion.ai_score && (
                    <div className="px-3 py-1 text-sm font-medium text-blue-400 rounded-full bg-blue-500/20">
                      AI Score: {currentQuestion.ai_score}%
                    </div>
                  )}
                </div>
                <div className="p-5 text-white border rounded-lg bg-blue-500/10 border-blue-500/30">
                  {currentQuestion.ai_evaluation.includes('Evaluation:') ? (
                    <div className="space-y-3">
                      {currentQuestion.ai_evaluation.split(/\n+/).map((line, idx) => {
                        // Skip the Score line as we're displaying it separately
                        if (line.trim().startsWith('Score:')) return null;
                        
                        return (
                          <p key={idx} className={line.trim().startsWith('Evaluation:') ? 'font-semibold' : ''}>
                            {line}
                          </p>
                        );
                      })}
                    </div>
                  ) : (
                    <p>{currentQuestion.ai_evaluation}</p>
                  )}
                </div>
              </div>
            )}
            
            {/* Marks input */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300">
                Marks:
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={marks[activeQuestionIndex]}
                onChange={(e) => handleMarkChange(activeQuestionIndex, e.target.value)}
                className="w-full px-4 py-3 text-white bg-gray-700 border-2 border-gray-600 rounded-lg focus:border-blue-500 focus:outline-none"
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
            
            {activeQuestionIndex < evaluation.data.length - 1 ? (
              <button
                onClick={() => setActiveQuestionIndex(prev => Math.min(evaluation.data.length - 1, prev + 1))}
                className="px-4 py-2 text-white transition-all duration-300 bg-blue-500 rounded-lg hover:bg-blue-600"
              >
                Next Question
              </button>
            ) : (
              <button
                onClick={handleSaveEvaluation}
                disabled={saving}
                className="flex items-center px-6 py-2 text-white transition-all duration-300 bg-blue-500 rounded-lg hover:bg-blue-600 disabled:bg-gray-600 disabled:text-gray-400"
              >
                {saving ? (
                  <>
                    <div className="w-5 h-5 mr-2 border-2 border-white rounded-full border-t-transparent animate-spin"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5 mr-2" />
                    Save Evaluation
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default EvaluationForm;