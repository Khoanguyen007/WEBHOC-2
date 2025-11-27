import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Clock, Award, Play, AlertCircle, RefreshCw } from 'lucide-react';
import { enrollmentAPI, progressAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  const fetchEnrollments = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await enrollmentAPI.getMyEnrollments();
      const enrollmentsWithProgress = await Promise.all(
        response.data.data.map(async (enrollment) => {
          try {
            const progressResponse = await progressAPI.getCourseProgress(enrollment.courseId._id);
            return {
              ...enrollment,
              progress: progressResponse.data
            };
          } catch (error) {
            console.warn('Failed to fetch progress for enrollment:', enrollment._id);
            return { ...enrollment, progress: null };
          }
        })
      );
      setEnrollments(enrollmentsWithProgress);
    } catch (error) {
      console.error('Error fetching enrollments:', error);
      setError('Không thể tải khóa học của bạn. Vui lòng thử lại.');
      setEnrollments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEnrollments();
  }, []);

  const LoadingSkeleton = () => (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="bg-gray-200 rounded-lg h-64 animate-pulse">
          <div className="h-40 bg-gray-300"></div>
          <div className="p-4 space-y-3">
            <div className="h-4 bg-gray-300 rounded w-3/4"></div>
            <div className="h-4 bg-gray-300 rounded w-1/2"></div>
          </div>
        </div>
      ))}
    </div>
  );

  const ErrorAlert = () => (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3 mb-8">
      <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
      <div className="flex-1">
        <p className="text-red-800 font-medium">Lỗi tải dữ liệu</p>
        <p className="text-red-700 text-sm">{error}</p>
      </div>
      <button
        onClick={fetchEnrollments}
        className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors flex items-center gap-2 ml-auto flex-shrink-0"
      >
        <RefreshCw className="h-4 w-4" />
        Thử lại
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Xin chào, {user?.displayName || 'bạn'}!
        </h1>
        <p className="text-gray-600 mb-8">
          Tiếp tục hành trình học tập của bạn
        </p>

        {/* Error Alert */}
        {error && <ErrorAlert />}

        {/* Stats */}
        {!loading && (
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center">
                <BookOpen className="h-8 w-8 text-primary-600 mr-4" />
                <div>
                  <p className="text-2xl font-bold">{enrollments.length}</p>
                  <p className="text-gray-600">Khóa học</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-green-600 mr-4" />
                <div>
                  <p className="text-2xl font-bold">
                    {enrollments.reduce((total, e) => total + (e.progress?.completedLessons || 0), 0)}
                  </p>
                  <p className="text-gray-600">Bài đã hoàn thành</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center">
                <Award className="h-8 w-8 text-yellow-600 mr-4" />
                <div>
                  <p className="text-2xl font-bold">
                    {enrollments.filter(e => e.progress?.completionPercentage === 100).length}
                  </p>
                  <p className="text-gray-600">Khóa hoàn thành</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Enrolled Courses */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-6">Khóa học của tôi</h2>
          
          {loading ? (
            <LoadingSkeleton />
          ) : enrollments.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-12 text-center">
              <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Chưa có khóa học nào</h3>
              <p className="text-gray-600 mb-6">Bắt đầu học ngay bằng cách đăng ký khóa học đầu tiên</p>
              <Link
                to="/courses"
                className="inline-block bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors"
              >
                Khám phá khóa học
              </Link>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {enrollments.map((enrollment) => (
                <div key={enrollment._id} className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-all">
                  <div className="relative">
                    <img
                      src={enrollment.courseId.coverImageUrl || '/placeholder-course.jpg'}
                      alt={enrollment.courseId.title}
                      className="w-full h-40 object-cover"
                      onError={(e) => {
                        e.target.src = '/placeholder-course.jpg';
                      }}
                    />
                    <div className="absolute top-2 right-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        enrollment.paymentStatus === 'paid' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {enrollment.paymentStatus === 'paid' ? 'Đã thanh toán' : 'Chờ thanh toán'}
                      </span>
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="font-semibold text-lg mb-2 line-clamp-2 hover:text-primary-600 transition-colors">
                      {enrollment.courseId.title}
                    </h3>
                    
                    {enrollment.progress ? (
                      <div className="mb-4">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-600">Tiến độ</span>
                          <span className="font-medium">{enrollment.progress.completionPercentage}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${enrollment.progress.completionPercentage}%` }}
                          ></div>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {enrollment.progress.completedLessons} / {enrollment.progress.totalLessons} bài
                        </p>
                      </div>
                    ) : (
                      <div className="mb-4 p-2 bg-gray-50 rounded text-sm text-gray-600">
                        Không thể tải tiến độ
                      </div>
                    )}

                    <div className="flex justify-between items-center">
                      <Link
                        to={`/courses/${enrollment.courseId._id}`}
                        className="flex items-center space-x-1 text-primary-600 hover:text-primary-700 font-semibold transition-colors"
                      >
                        <Play className="h-4 w-4" />
                        <span>Học tiếp</span>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;