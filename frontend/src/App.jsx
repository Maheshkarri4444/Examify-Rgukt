import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import GoogleCallback from './pages/GoogleCallback';
import TeacherOutlet from './components/TeacherOutlet';
import ExamsList from './components/ExamList';
import CreateExam from './components/CreateExam';
import ExamDetails from './components/ExamDetails';
import StudentOutlet from './components/student/StudentOutlet';
import StudentExams from './components/student/StudentExams';
import StudentResults from './components/student/StudentResults';
import ExamEntryPoint from './components/student/ExamEntryPoint';
import ExamSession from './components/student/ExamSession';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-900">
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/google/callback" element={<GoogleCallback />} />
          <Route path="/teacher" element={<TeacherOutlet />}>
            <Route index element={<Navigate to="exams" replace />} />
            <Route path="exams" element={<ExamsList />} />
            <Route path="exams/:id" element={<ExamDetails />} />
            <Route path="exams/create" element={<CreateExam />} />
            <Route path="evaluations" element={<div className="text-white">Evaluations Page</div>} />
          </Route>
          
          {/* Student Routes */}
          <Route path="/student" element={<StudentOutlet />}>
            <Route index element={<Navigate to="exams" replace />} />
            <Route path="exams" element={<StudentExams />} />
            <Route path="exams/:id" element={<ExamEntryPoint />} />
            <Route path="exams/:id/session/:answerSheetId" element={<ExamSession />} />
            <Route path="results" element={<StudentResults />} />
          </Route>
        </Routes>
      </div>
    </Router>
  );
}

export default App;