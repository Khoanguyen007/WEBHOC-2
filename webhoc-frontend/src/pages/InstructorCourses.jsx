import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { courseAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Plus, Edit2, Trash2, ArrowRight } from 'lucide-react';

const InstructorCourses = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role !== 'instructor') {
      navigate('/');
      return;
    }
    fetchCourses();
  }, [user, navigate]);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const response = await courseAPI.getCourses({ instructorId: user?._id });
      setCourses(response.data.data || response.data || []);
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/instructor/dashboard')}
            className="text-primary-600 hover:text-primary-700 mb-4 flex items-center gap-1"
          >
            ← Quay lại Dashboard
          </button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Khóa học của tôi</h1>
          <p className="text-gray-600">Quản lý tất cả các khóa học</p>
        </div>

        {/* Grid of Courses */}
        {courses.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-600 mb-4">Bạn chưa tạo khóa học nào</p>
            <button
              onClick={() => navigate('/instructor/dashboard')}
              className="px-6 py-2 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700"
            >
              Tạo khóa học đầu tiên
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map(course => (
              <div
                key={course._id}
                className="bg-white rounded-lg shadow hover:shadow-xl transition-shadow overflow-hidden"
              >
                {/* Course Image */}
                <div className="relative h-40 bg-gradient-to-br from-primary-400 to-primary-600 overflow-hidden">
                  {course.imageUrl && (
                    <img
                      src={course.imageUrl}
                      alt={course.title}
                      className="w-full h-full object-cover"
                    />
                  )}
                  <div className="absolute top-3 right-3 bg-white bg-opacity-90 px-3 py-1 rounded-full text-xs font-semibold">
                    {course.isPublished ? '✓ Xuất bản' : '• Nháp'}
                  </div>
                </div>

                {/* Course Info */}
                <div className="p-4">
                  <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">
                    {course.title}
                  </h3>
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {course.description}
                  </p>

                  {/* Course Stats */}
                  <div className="space-y-2 mb-4 text-sm text-gray-600">
                    <p>📚 {course.totalLessons || 0} bài học</p>
                    <p>📊 {course.difficultyLevel}</p>
                    <p>💰 {(course.priceCents / 100).toLocaleString('vi-VN')} ₫</p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => navigate(`/instructor/courses/${course._id}`)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors text-sm"
                    >
                      <Edit2 className="w-4 h-4" />
                      Quản lý
                    </button>
                    <button
                      onClick={() => navigate(`/courses/${course._id}`)}
                      className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                      title="Xem trang khóa học"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default InstructorCourses;
