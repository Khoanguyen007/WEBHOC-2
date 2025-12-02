import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Courses from './pages/Courses';
import CourseDetail from './pages/CourseDetail';
import Profile from './pages/Profile';
import LessonDetail from './pages/LessonDetail';
import Quiz from './pages/Quiz';
import Checkout from './pages/Checkout';
import PaymentResult from './pages/PaymentResult';
import VerifyEmail from './pages/VerifyEmail';
import InstructorDashboard from './pages/InstructorDashboard';
import InstructorCourses from './pages/InstructorCourses';
import InstructorCourseDetail from './pages/InstructorCourseDetail';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route element={<Layout />}>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/courses" element={<Courses />} />
            <Route path="/courses/:id" element={<CourseDetail />} />
            <Route path="/verify-email" element={<VerifyEmail />} />

            {/* Protected Routes */}
            <Route 
              path="/profile" 
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } 
            />
            
            {/* Payment Routes */}
            <Route 
              path="/checkout/:courseId" 
              element={
                <ProtectedRoute>
                  <Checkout />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/payment-result" 
              element={
                <ProtectedRoute>
                  <PaymentResult />
                </ProtectedRoute>
              } 
            />
            
            {/* Lesson Routes */}
            <Route 
              path="/courses/:courseId/lessons/:lessonId" 
              element={
                <ProtectedRoute>
                  <LessonDetail />
                </ProtectedRoute>
              } 
            />

            {/* Quiz Routes */}
            <Route 
              path="/courses/:courseId/quiz/:quizId" 
              element={
                <ProtectedRoute>
                  <Quiz />
                </ProtectedRoute>
              } 
            />

            {/* Instructor Routes */}
            <Route 
              path="/instructor/dashboard" 
              element={
                <ProtectedRoute>
                  <InstructorDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/instructor/courses" 
              element={
                <ProtectedRoute>
                  <InstructorCourses />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/instructor/courses/:courseId" 
              element={
                <ProtectedRoute>
                  <InstructorCourseDetail />
                </ProtectedRoute>
              } 
            />

          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;