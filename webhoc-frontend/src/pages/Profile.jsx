import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { userAPI, enrollmentAPI, progressAPI, courseAPI, courseAPI as courseStatsAPI } from '../services/api';
import { BookOpen, CheckCircle, Clock, Users, TrendingUp, DollarSign } from 'lucide-react';

const Profile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    displayName: '',
    bio: '',
    profileImageUrl: ''
  });
  const [enrollments, setEnrollments] = useState([]);
  const [courseProgresses, setCourseProgresses] = useState({});
  const [instructorStats, setInstructorStats] = useState({
    totalCourses: 0,
    totalStudents: 0,
    totalRevenue: 0,
    publishedCourses: 0
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [courseDetails, setCourseDetails] = useState({});
  const [loadingProgress, setLoadingProgress] = useState(true);

  useEffect(() => {
    if (user) {
      setFormData({
        displayName: user.displayName || '',
        bio: user.bio || '',
        profileImageUrl: user.profileImageUrl || ''
      });

      if (user.role === 'student') {
        fetchEnrollments();
      } else if (user.role === 'instructor') {
        fetchInstructorStats();
      }
    }
  }, [user]);

  const fetchEnrollments = async () => {
    try {
      setLoadingProgress(true);
      const response = await enrollmentAPI.getMyEnrollments();
      setEnrollments(response.data.data || []);

      // Fetch course details and progress for each enrollment
      for (const enrollment of response.data.data || []) {
        try {
          const courseRes = await courseAPI.getCourseDetail(enrollment.courseId);
          setCourseDetails(prev => ({
            ...prev,
            [enrollment.courseId]: courseRes.data.data || courseRes.data
          }));

          const progressRes = await progressAPI.getCourseProgress(enrollment.courseId);
          setCourseProgresses(prev => ({
            ...prev,
            [enrollment.courseId]: progressRes.data.data || progressRes.data
          }));
        } catch (err) {
          console.error('Error fetching course details:', err);
        }
      }
    } catch (error) {
      console.error('Error fetching enrollments:', error);
    } finally {
      setLoadingProgress(false);
    }
  };

  const fetchInstructorStats = async () => {
    try {
      setLoadingProgress(true);
      const coursesRes = await courseStatsAPI.getCourses({ instructorId: user?._id });
      const courses = coursesRes.data.data || coursesRes.data || [];
      
      let totalStudents = 0;
      let totalRevenue = 0;

      // Calculate stats from courses
      for (const course of courses) {
        // Fetch enrollments for each course
        try {
          const enrollRes = await enrollmentAPI.getEnrollmentsByCourse(course._id);
          totalStudents += enrollRes.data.length || 0;
        } catch (err) {
          console.error('Error fetching enrollments:', err);
        }
      }

      setInstructorStats({
        totalCourses: courses.length,
        totalStudents,
        totalRevenue,
        publishedCourses: courses.filter(c => c.isPublished).length
      });
    } catch (error) {
      console.error('Error fetching instructor stats:', error);
    } finally {
      setLoadingProgress(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      await userAPI.updateProfile(formData);
      setMessage('Cập nhật thông tin thành công!');
    } catch (error) {
      setMessage('Cập nhật thất bại: ' + (error.response?.data?.message || 'Lỗi không xác định'));
    } finally {
      setLoading(false);
    }
  };

  const calculateProgress = (courseId) => {
    const progress = courseProgresses[courseId];
    if (!progress || !progress.lessons) return 0;
    
    const completedCount = progress.lessons.filter(l => l.completed).length;
    return Math.round((completedCount / progress.lessons.length) * 100) || 0;
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <p>Vui lòng đăng nhập để xem thông tin cá nhân.</p>
        </div>
      </div>
    );
  }

  const isInstructor = user.role === 'instructor';

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Hồ sơ cá nhân</h1>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Left Column - User Info Form */}
          <div className="md:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="text-center mb-6">
                <div className="w-20 h-20 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold text-2xl mx-auto mb-4">
                  {formData.profileImageUrl ? (
                    <img src={formData.profileImageUrl} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    formData.displayName[0]?.toUpperCase()
                  )}
                </div>
                <h2 className="text-xl font-bold text-gray-900">{formData.displayName}</h2>
                <p className="text-sm text-gray-500 mt-1">{user.email}</p>
                <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-semibold ${
                  isInstructor 
                    ? 'bg-blue-100 text-blue-800' 
                    : 'bg-green-100 text-green-800'
                }`}>
                  {isInstructor ? '👨‍🏫 Giảng viên' : '👨‍🎓 Học viên'}
                </span>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {message && (
                  <div className={`p-3 rounded-lg text-sm ${
                    message.includes('thành công') 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {message}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Họ và tên
                  </label>
                  <input
                    type="text"
                    name="displayName"
                    value={formData.displayName}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Giới thiệu bản thân
                  </label>
                  <textarea
                    name="bio"
                    value={formData.bio}
                    onChange={handleChange}
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                    placeholder="Giới thiệu về bản thân..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-primary-700 disabled:opacity-50 text-sm"
                >
                  {loading ? 'Đang cập nhật...' : 'Cập nhật'}
                </button>

                {isInstructor && (
                  <button
                    type="button"
                    onClick={() => navigate('/instructor/dashboard')}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-blue-700 text-sm mt-4"
                  >
                    → Dashboard giảng viên
                  </button>
                )}
              </form>
            </div>
          </div>

          {/* Right Column - Stats & Progress */}
          <div className="md:col-span-2">
            {isInstructor ? (
              /* Instructor Stats */
              <div className="space-y-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white rounded-lg shadow-sm p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-600 text-sm">Khóa học</p>
                        <p className="text-2xl font-bold text-gray-900">{instructorStats.totalCourses}</p>
                      </div>
                      <BookOpen className="w-8 h-8 text-primary-600" />
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow-sm p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-600 text-sm">Học viên</p>
                        <p className="text-2xl font-bold text-gray-900">{instructorStats.totalStudents}</p>
                      </div>
                      <Users className="w-8 h-8 text-blue-600" />
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow-sm p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-600 text-sm">Đã xuất bản</p>
                        <p className="text-2xl font-bold text-gray-900">{instructorStats.publishedCourses}</p>
                      </div>
                      <CheckCircle className="w-8 h-8 text-green-600" />
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow-sm p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-600 text-sm">Doanh thu</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {(instructorStats.totalRevenue / 100).toLocaleString('vi-VN')} ₫
                        </p>
                      </div>
                      <DollarSign className="w-8 h-8 text-green-600" />
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Hành động nhanh</h3>
                  <div className="space-y-3">
                    <button
                      onClick={() => navigate('/instructor/dashboard')}
                      className="w-full px-4 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors text-sm"
                    >
                      📊 Quay lại Dashboard
                    </button>
                    <button
                      onClick={() => navigate('/instructor/courses')}
                      className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors text-sm"
                    >
                      📚 Xem tất cả khóa học
                    </button>
                    <button
                      onClick={() => navigate('/courses')}
                      className="w-full px-4 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors text-sm"
                    >
                      👀 Duyệt khóa học khác
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* Student Learning Progress */
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
                  <BookOpen className="w-5 h-5 mr-2 text-primary-600" />
                  Tiến độ học tập
                </h3>

                {loadingProgress ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                  </div>
                ) : enrollments.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">Bạn chưa đăng ký khóa học nào</p>
                    <button
                      onClick={() => navigate('/courses')}
                      className="mt-4 px-6 py-2 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700"
                    >
                      Khám phá khóa học
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {enrollments.map((enrollment) => {
                      const course = courseDetails[enrollment.courseId];
                      const progress = calculateProgress(enrollment.courseId);

                      return (
                        <div key={enrollment._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h4 className="font-semibold text-gray-900">
                                {course?.title || 'Khóa học'}
                              </h4>
                              <p className="text-sm text-gray-500 mt-1">
                                {course?.description?.substring(0, 60)}...
                              </p>
                            </div>
                            {progress === 100 ? (
                              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                            ) : (
                              <Clock className="w-5 h-5 text-primary-600 flex-shrink-0" />
                            )}
                          </div>

                          {/* Progress Bar */}
                          <div className="mb-3">
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-xs font-medium text-gray-600">Tiến độ</span>
                              <span className="text-xs font-bold text-primary-600">{progress}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${progress}%` }}
                              ></div>
                            </div>
                          </div>

                          {/* Stats */}
                          <div className="flex gap-4 text-xs text-gray-600">
                            <span>
                              {courseProgresses[enrollment.courseId]?.lessons?.filter(l => l.completed).length || 0}/
                              {courseProgresses[enrollment.courseId]?.lessons?.length || 0} bài
                            </span>
                            <span>
                              {courseProgresses[enrollment.courseId]?.totalTimeSpent 
                                ? `${Math.floor(courseProgresses[enrollment.courseId].totalTimeSpent / 60)} phút`
                                : '0 phút'
                              }
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;