import { useState } from 'react';
import { useAuthStore } from './store/authStore';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import StudentDashboard from './pages/StudentDashboard';
import TeacherDashboard from './pages/TeacherDashboard';
import ExamView from './pages/ExamView';

function App() {
  const { role, setRole } = useAuthStore();
  const [currentExamId, setCurrentExamId] = useState<number | null>(null);

  const startExam = (examId: number) => {
    setCurrentExamId(examId);
    setRole('siswa_exam');
  };

  const endExam = () => {
    setCurrentExamId(null);
    setRole('siswa');
  };

  return (
    <div className="min-h-screen font-sans text-slate-800 transition-colors duration-500">
      {role === 'login' && <Login />}

      {role === 'admin' && <AdminDashboard />}
      {role === 'siswa' && (
        <StudentDashboard 
          onStartExam={startExam} 
        />
      )}
      {role === 'siswa_exam' && <ExamView examId={currentExamId} onEndExam={endExam} />}
      {role === 'guru' && <TeacherDashboard />}
    </div>
  );
}

export default App;
