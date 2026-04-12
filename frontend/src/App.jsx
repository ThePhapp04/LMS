import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import CourseList from './pages/CourseList';
import CourseDetail from './pages/CourseDetail';
import CourseLearning from './pages/CourseLearning';
import Timetable from './pages/Timetable';
// we'll need to define Instructor Dashboard and Editor soon
import InstructorDashboard from './pages/InstructorDashboard'; 
import CourseEditor from './pages/CourseEditor';
import Gradebook from './pages/Gradebook';
import Forum from './pages/Forum';
import Guide from './pages/Guide';
import Profile from './pages/Profile';
import { useContext } from 'react';
import { AuthContext } from './contexts/AuthContext';

function PrivateRoute({ children, allowLearningLayout = false }) {
  const { user, loading } = useContext(AuthContext);
  
  if (loading) return <div className="main-content">Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  
  // Learning page uses the full screen so no .main-content wrapper
  if (allowLearningLayout) return children;
  return <div className="main-content">{children}</div>;
}

function App() {
  return (
    <Router>
      <div className="app-container">
        <Navbar />
        <main className="main-layout">
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
            <Route path="/timetable" element={<PrivateRoute><Timetable /></PrivateRoute>} />
            <Route path="/courses" element={<PrivateRoute><CourseList /></PrivateRoute>} />
            <Route path="/courses/:id" element={<PrivateRoute><CourseDetail /></PrivateRoute>} />
            <Route path="/courses/:id/learn" element={<PrivateRoute allowLearningLayout={true}><CourseLearning /></PrivateRoute>} />
            
            {/* Instructor Routes */}
            <Route path="/instructor/dashboard" element={<PrivateRoute><InstructorDashboard /></PrivateRoute>} />
            <Route path="/instructor/course/create" element={<PrivateRoute><CourseEditor /></PrivateRoute>} />
            <Route path="/instructor/course/:id/edit" element={<PrivateRoute><CourseEditor /></PrivateRoute>} />

            <Route path="/courses/:id/gradebook" element={<PrivateRoute><Gradebook /></PrivateRoute>} />
            <Route path="/forum" element={<PrivateRoute><Forum /></PrivateRoute>} />
            <Route path="/guide" element={<PrivateRoute><Guide /></PrivateRoute>} />
            <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
