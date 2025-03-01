import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, User, Mail, CheckCircle, Clock, AlertTriangle, ChevronRight } from 'lucide-react';
import { Toaster, toast } from 'react-hot-toast';
import Allapi from '../utils/common';

function AnswerSheetsList() {
  const { examId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [exam, setExam] = useState(null);
  const [answerSheets, setAnswerSheets] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchExamDetails = async () => {
      try {
        const examResponse = await fetch(Allapi.getExamById.url(examId), {
          headers: {
            'Authorization': `${localStorage.getItem('token')}`
          }
        });

        if (!examResponse.ok) {
          throw new Error('Failed to fetch exam details');
        }

        const examData = await examResponse.json();
        setExam(examData);

        // Fetch answer sheets
        const answerSheetsResponse = await fetch(`${Allapi.backapi}/exam/getallanswersheetsbyexamid/${examId}`, {
          headers: {
            'Authorization': `${localStorage.getItem('token')}`
          }
        });
        // console.log("response:- ",answerSheetsResponse)
        if (!answerSheetsResponse.ok) {
          throw new Error('Failed to fetch Answer sheets');
        }

        const answerSheetsData = await answerSheetsResponse.json();
        // console.log("answer sheets data: ",answerSheetsData)
        if (answerSheetsData === null ){
          setAnswerSheets([])
        }else{
        setAnswerSheets(answerSheetsData);}
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load exam data');
      } finally {
        setLoading(false);
      }
    };

    fetchExamDetails();
  }, [examId]);

  const handleCreateEvaluation = async (answerSheetId) => {
    try {
      setLoading(true);
      const response = await fetch(`${Allapi.backapi}/exam/createevaluation/${answerSheetId}`, {
        headers: {
          'Authorization': `${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to create evaluation');
      }

      const data = await response.json();
      navigate(`/teacher/evaluations/grade/${data.evaluation_id}`);
    } catch (error) {
      console.error('Error creating evaluation:', error);
      toast.error('Failed to create evaluation');
      setLoading(false);
    }
  };

  const filteredAnswerSheets = answerSheets.filter(sheet => 
    sheet.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sheet.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <Toaster position="top-right" />
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/teacher/evaluations')}
            className="p-2 text-gray-400 transition-colors duration-300 bg-gray-800 rounded-full hover:text-white hover:bg-gray-700"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-white">
              {loading ? 'Loading...' : exam?.exam_name}
            </h1>
            <p className="text-gray-400">Answer Sheets</p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="relative w-16 h-16">
              <div className="absolute w-full h-full border-4 border-blue-500 rounded-full border-t-transparent animate-spin"></div>
              <div className="absolute border-4 border-blue-300 rounded-full top-1 left-1 w-14 h-14 border-t-transparent animate-spin" style={{ animationDuration: '1.5s' }}></div>
            </div>
          </div>
        ) : filteredAnswerSheets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <FileText className="w-16 h-16 text-gray-500" />
            <h2 className="text-2xl font-bold text-white">No Answer Sheets Found</h2>
          </div>
        ) : (
          <>
            {/* Search input */}
            <div className="relative">
              <input
                type="text"
                className="block w-full p-4 pl-4 text-white bg-gray-800 border border-gray-700 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                placeholder="Search by student name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="overflow-hidden bg-gray-800 border border-gray-700 rounded-lg">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-700">
                  <thead className="bg-gray-700">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-400 uppercase">
                        Student
                      </th>
                      <th scope="col" className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-400 uppercase">
                        Set
                      </th>
                      <th scope="col" className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-400 uppercase">
                        Status
                      </th>
                      <th scope="col" className="px-6 py-3 text-xs font-medium tracking-wider text-right text-gray-400 uppercase">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {filteredAnswerSheets.map((sheet) => (
                      <tr key={sheet.id} className="transition-colors duration-300 hover:bg-gray-700/50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex items-center justify-center flex-shrink-0 w-10 h-10 rounded-full bg-blue-500/20">
                              <User className="w-5 h-5 text-blue-400" />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-white">{sheet.studentName}</div>
                              <div className="flex items-center text-sm text-gray-400">
                                <Mail className="w-3 h-3 mr-1" />
                                {sheet.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-white">Set {sheet.set}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {sheet.submitted ? (
                              <>
                                <CheckCircle className="w-4 h-4 mr-2 text-green-400" />
                                <span className="px-2 py-1 text-xs font-medium text-green-400 rounded-full bg-green-500/20">
                                  Submitted
                                </span>
                              </>
                            ) : (
                              <>
                                <AlertTriangle className="w-4 h-4 mr-2 text-amber-400" />
                                <span className="px-2 py-1 text-xs font-medium rounded-full text-amber-400 bg-amber-500/20">
                                  {sheet.status === 'didnotstart' ? 'Not Started' : 
                                   sheet.status === 'started' ? 'In Progress' : 
                                   sheet.status === 'internal' ? 'Internal' : 'Unknown'}
                                </span>
                              </>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right whitespace-nowrap">
                          <button
                            onClick={() => handleCreateEvaluation(sheet.id)}
                            disabled={!sheet.submitted}
                            className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-md ${
                              sheet.submitted
                                ? 'text-white bg-blue-600 hover:bg-blue-700'
                                : 'text-gray-400 bg-gray-700 cursor-not-allowed'
                            }`}
                          >
                            Evaluate
                            <ChevronRight className="w-4 h-4 ml-1" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}

export default AnswerSheetsList;