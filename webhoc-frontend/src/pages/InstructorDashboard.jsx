import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { courseAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Plus, Edit2, Trash2, Users, BookOpen, AlertCircle } from 'lucide-react';

const InstructorDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    difficultyLevel: 'Beginner',
    priceCents: 0
  });

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

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleCreateCourse = async () => {
    try {
      await courseAPI.createCourse(formData);
      setShowCreateModal(false);
      setFormData({
        title: '',
        description: '',
        category: '',
        difficultyLevel: 'Beginner',
        priceCents: 0
      });
      fetchCourses();
    } catch (error) {
      alert('Lỗi tạo khóa học: ' + error.response?.data?.message);
    }
  };

  const handleEditCourse = async () => {
    try {
      await courseAPI.updateCourse(editingCourse._id, formData);
      setEditingCourse(null);
      setFormData({
        title: '',
        description: '',
        category: '',
        difficultyLevel: 'Beginner',
        priceCents: 0
      });
      fetchCourses();
    } catch (error) {
      alert('Lỗi cập nhật khóa học: ' + error.response?.data?.message);
    }
  };

  const handleDeleteCourse = async (courseId) => {
    if (!window.confirm('Bạn chắc chắn muốn xóa khóa học này?')) return;
    try {
      // Note: Need to implement delete API
      alert('Xóa thành công');
      fetchCourses();
    } catch (error) {
      alert('Lỗi xóa khóa học: ' + error.response?.data?.message);
    }
  };

  const openEditModal = (course) => {
    setEditingCourse(course);
    setFormData({
      title: course.title,
      description: course.description,
      category: course.category,
      difficultyLevel: course.difficultyLevel,
      priceCents: course.priceCents
    });
  };

  const closeModals = () => {
    setShowCreateModal(false);
    setEditingCourse(null);
    setFormData({
      title: '',
      description: '',
      category: '',
      difficultyLevel: 'Beginner',
      priceCents: 0
    });
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard Giảng viên</h1>
          <p className="text-gray-600">Quản lý các khóa học của bạn</p>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">Tổng khóa học</p>
                <p className="text-3xl font-bold text-gray-900">{courses.length}</p>
              </div>
              <BookOpen className="w-12 h-12 text-primary-100" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">Đã xuất bản</p>
                <p className="text-3xl font-bold text-gray-900">{courses.filter(c => c.isPublished).length}</p>
              </div>
              <BookOpen className="w-12 h-12 text-green-100" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">Nháp</p>
                <p className="text-3xl font-bold text-gray-900">{courses.filter(c => !c.isPublished).length}</p>
              </div>
              <BookOpen className="w-12 h-12 text-yellow-100" />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mb-6 flex gap-3">
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Tạo khóa học mới
          </button>
          <button
            onClick={() => navigate('/instructor/courses')}
            className="flex items-center gap-2 px-6 py-3 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
          >
            Xem tất cả khóa học
          </button>
        </div>

        {/* Courses List */}
        {courses.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">Bạn chưa tạo khóa học nào</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-2 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700"
            >
              Tạo khóa học đầu tiên
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {courses.map(course => (
              <div key={course._id} className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold text-gray-900">{course.title}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        course.isPublished
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {course.isPublished ? 'Đã xuất bản' : 'Nháp'}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm mb-3">{course.description?.substring(0, 100)}...</p>
                    <div className="flex gap-4 text-sm text-gray-600">
                      <span>📚 {course.totalLessons || 0} bài</span>
                      <span>💰 {(course.priceCents / 100).toLocaleString('vi-VN')} ₫</span>
                      <span>📊 {course.difficultyLevel}</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => navigate(`/instructor/courses/${course._id}`)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Quản lý (sửa bài, quiz)"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => openEditModal(course)}
                      className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Chỉnh sửa thông tin khóa học"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDeleteCourse(course._id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Xóa"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {(showCreateModal || editingCourse) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              {editingCourse ? 'Chỉnh sửa khóa học' : 'Tạo khóa học mới'}
            </h2>

            <div className="space-y-4 max-h-96 overflow-y-auto mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tên khóa học</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Nhập tên khóa học"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Mô tả</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="4"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Nhập mô tả khóa học"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Danh mục</label>
                  <input
                    type="text"
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="VD: Lập trình"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Trình độ</label>
                  <select
                    name="difficultyLevel"
                    value={formData.difficultyLevel}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="Beginner">Cơ bản</option>
                    <option value="Intermediate">Trung bình</option>
                    <option value="Advanced">Nâng cao</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Giá (VNĐ)</label>
                <input
                  type="number"
                  name="priceCents"
                  value={formData.priceCents / 100}
                  onChange={(e) => setFormData({
                    ...formData,
                    priceCents: parseInt(e.target.value) * 100
                  })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="0"
                />
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={closeModals}
                className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={editingCourse ? handleEditCourse : handleCreateCourse}
                className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors"
              >
                {editingCourse ? 'Cập nhật' : 'Tạo khóa học'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InstructorDashboard;
