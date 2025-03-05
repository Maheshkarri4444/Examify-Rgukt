import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Download, Printer, Mail, User } from 'lucide-react';
import { Toaster, toast } from 'react-hot-toast';
import Allapi from '../utils/common';

function StudentResultsList() {
  const { examId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [examName, setExamName] = useState('');
  const printRef = useRef(null);

  useEffect(() => {
    const fetchStudentsAndMarks = async () => {
      try {
        setLoading(true);
        
        // Fetch exam details to get the name
        const examResponse = await fetch(Allapi.getExamById.url(examId), {
          headers: {
            'Authorization': `${localStorage.getItem('token')}`
          }
        });
        
        if (examResponse.ok) {
          const examData = await examResponse.json();
          setExamName(examData.exam_name || 'Exam Results');
        }
        
        // Fetch students and marks
        const response = await fetch(`${Allapi.backapi}/exam/getstudentsandmarks/${examId}`, {
          headers: {
            'Authorization': `${localStorage.getItem('token')}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch student results');
        }

        const data = await response.json();
        console.log("Data students marks",data)
        // Sort students by email in ascending order
        const sortedStudents = data.sort((a, b) => {
          return a.email.localeCompare(b.email);
        });
        
        setStudents(sortedStudents);
      } catch (error) {
        console.error('Error fetching student results:', error);
        toast.error('Failed to load student results');
      } finally {
        setLoading(false);
      }
    };

    fetchStudentsAndMarks();
  }, [examId]);

  const handlePrintResults = () => {
    const printContent = document.getElementById('printable-results');
    const originalContents = document.body.innerHTML;
    
    document.body.innerHTML = printContent.innerHTML;
    window.print();
    document.body.innerHTML = originalContents;
    
    // Reload the page to restore React functionality
    window.location.reload();
  };

  const handleRowClick = (evaluationId) => {
    if (evaluationId) {
      navigate(`/teacher/evaluation/${evaluationId}`);
    }
  };

  const filteredStudents = students.filter(student => 
    student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (student.student_name && student.student_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Extract ID number from email (e.g., n210506 from n210506@gmail.com)
  const getIdFromEmail = (email) => {
    const match = email.match(/^([a-zA-Z0-9]+)@/);
    return match ? match[1].toUpperCase() : 'N/A';
  };

  return (
    <>
      <Toaster position="top-right" />
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/teacher/results')}
            className="p-2 text-gray-400 transition-colors duration-300 bg-gray-800 rounded-full hover:text-white hover:bg-gray-700"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-white">{examName}</h1>
            <p className="text-gray-400">Student Results</p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="relative w-16 h-16">
              <div className="absolute w-full h-full border-4 border-blue-500 rounded-full border-t-transparent animate-spin"></div>
              <div className="absolute border-4 border-blue-300 rounded-full top-1 left-1 w-14 h-14 border-t-transparent animate-spin" style={{ animationDuration: '1.5s' }}></div>
            </div>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-4">
              {/* Search input */}
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Search className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  className="block w-full p-4 pl-10 text-white bg-gray-800 border border-gray-700 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Search by student ID or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              {/* Print button */}
              <button
                onClick={handlePrintResults}
                className="flex items-center px-4 py-3 text-white transition-all duration-300 bg-blue-600 rounded-lg hover:bg-blue-700"
              >
                <Printer className="w-5 h-5 mr-2" />
                Print Results
              </button>
            </div>

            {filteredStudents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-4">
                <User className="w-16 h-16 text-gray-500" />
                <h2 className="text-2xl font-bold text-white">No Students Found</h2>
                <p className="text-gray-400">
                  {searchTerm ? 'No students match your search criteria' : 'No students have taken this exam yet'}
                </p>
              </div>
            ) : (
              <>
                {/* Visible table for the UI */}
                <div className="overflow-hidden bg-gray-800 border border-gray-700 rounded-lg">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-700">
                      <thead className="bg-gray-700">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-400 uppercase">
                            ID Number
                          </th>
                          <th scope="col" className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-400 uppercase">
                            Student Name
                          </th>
                          <th scope="col" className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-400 uppercase">
                            Email
                          </th>
                          <th scope="col" className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-400 uppercase">
                            Marks
                          </th>
                          <th scope="col" className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-400 uppercase">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-700">
                        {filteredStudents.map((student, index) => (
                          <tr 
                            key={index} 
                            onClick={() => handleRowClick(student.evaluation_id)}
                            className="transition-colors duration-300 cursor-pointer hover:bg-gray-700/50"
                          >
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-white">{getIdFromEmail(student.email)}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-white">{student.student_name || 'N/A'}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center text-sm text-gray-400">
                                <Mail className="w-3 h-3 mr-1" />
                                {student.email}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-white">{student.total_marks || 0}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                student.evaluated 
                                  ? 'bg-green-500/20 text-green-400' 
                                  : 'bg-amber-500/20 text-amber-400'
                              }`}
                              
                            onClick={() => handleRowClick(student.evaluation_id)}
                              >
                                {student.evaluated ? 'Evaluated' : 'Pending'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                
                {/* Hidden printable version */}
                <div id="printable-results" className="hidden">
                  <style type="text/css" media="print">
                    {`
                      @page {
                        size: A4;
                        margin: 1cm;
                      }
                      body {
                        font-family: Arial, sans-serif;
                        color: #000;
                        background: #fff;
                      }
                      table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-top: 20px;
                      }
                      th, td {
                        border: 1px solid #ddd;
                        padding: 8px;
                        text-align: left;
                      }
                      th {
                        background-color: #f2f2f2;
                        font-weight: bold;
                      }
                      tr:nth-child(even) {
                        background-color: #f9f9f9;
                      }
                      .header {
                        text-align: center;
                        margin-bottom: 20px;
                      }
                      .header h1 {
                        margin: 0;
                        font-size: 24px;
                      }
                      .header p {
                        margin: 5px 0 0 0;
                        font-size: 16px;
                      }
                    `}
                  </style>
                  <div className="header">
                    <h1>{examName}</h1>
                    <p>Exam Results</p>
                  </div>
                  <table>
                    <thead>
                      <tr>
                        <th>ID Number</th>
                        <th>Student Name</th>
                        <th>Email</th>
                        <th>Marks</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredStudents.map((student, index) => (
                        <tr key={index}>
                          <td>{getIdFromEmail(student.email)}</td>
                          <td>{student.student_name || 'N/A'}</td>
                          <td>{student.email}</td>
                          <td>{student.total_marks || 0}</td>
                          <td>{student.evaluated ? 'Evaluated' : 'Pending'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </>
  );
}

export default StudentResultsList;