import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Clock, Users, Star, Play, BookOpen, CheckCircle } from 'lucide-react';
import { courseAPI, enrollmentAPI, lessonAPI, progressAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const CourseDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [course, setCourse] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [courseResponse, lessonsResponse] = await Promise.all([
          courseAPI.getCourse(id),
          lessonAPI.getLessons(id)
        ]);

        setCourse(courseResponse.data);
        setLessons(lessonsResponse.data.data);

        if (user) {
          try {
            const progressResponse = await progressAPI.getCourseProgress(id);
            setProgress(progressResponse.data);
          } catch (error) {
            // User not enrolled, progress will be null
          }
        }
      } catch (error) {
        console.error('Error fetching course details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, user]);

  const handleEnroll = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    setEnrolling(true);
    try {
      const response = await enrollmentAPI.enroll(id);
      
      if (response.data.paymentStatus === 'paid') {
        alert('Đăng ký thành công! Bắt đầu học ngay.');
        navigate('/dashboard');
      } else if (course.priceCents === 0) {
        // Free course
        alert('Đăng ký thành công! Bắt đầu học ngay.');
        navigate('/dashboard');
      } else {
        // Redirect to checkout page
        navigate(`/checkout/${id}`);
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Đăng ký thất bại');
    } finally {
      setEnrolling(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="bg-gray-200 rounded-lg h-96 animate-pulse mb-8"></div>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-2xl font-bold text-gray-900">Khóa học không tồn tại</h1>
        </div>
      </div>
    );
  }

  const isEnrolled = progress !== null;
  const isInstructor = user && user.role === 'instructor';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Course Header */}
      <div className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-8">
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                {course.title}
              </h1>
              <p className="text-gray-600 text-lg mb-6">
                {course.description}
              </p>
              
              <div className="flex flex-wrap gap-4 mb-6">
                <div className="flex items-center text-gray-600">
                  <Clock className="h-5 w-5 mr-2" />
                  <span>{lessons.length} bài học</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <Users className="h-5 w-5 mr-2" />
                  <span>100+ học viên</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <Star className="h-5 w-5 mr-2" />
                  <span>4.8 (120 đánh giá)</span>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <img
                  src={course.instructorId?.profileImageUrl || '/default-avatar.png'}
                  alt="Instructor"
                  className="h-12 w-12 rounded-full"
                />
                <div>
                  <p className="font-semibold">{course.instructorId?.displayName || 'Instructor'}</p>
                  <p className="text-gray-600">Giảng viên</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6 h-fit">
              <img
                src={course.coverImageUrl}
                alt={course.title}
                className="w-full h-48 object-cover rounded-lg mb-4"
              />
              
              <div className="text-center mb-4">
                <span className="text-3xl font-bold text-primary-600">
                  {course.priceCents === 0 ? 'Miễn phí' : `$${(course.priceCents / 100).toFixed(2)}`}
                </span>
              </div>

              {isEnrolled ? (
                <button
                  onClick={() => navigate('/dashboard')}
                  className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-green-700 mb-4"
                >
                  Tiếp tục học
                </button>
              ) : (
                <button
                  onClick={handleEnroll}
                  disabled={enrolling}
                  className="w-full bg-primary-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-primary-700 disabled:opacity-50 mb-4"
                >
                  {enrolling ? 'Đang đăng ký...' : 'Đăng ký ngay'}
                </button>
              )}

              <div className="text-sm text-gray-600 space-y-2">
                <div className="flex justify-between">
                  <span>Trình độ:</span>
                  <span className="font-semibold">{course.difficultyLevel}</span>
                </div>
                <div className="flex justify-between">
                  <span>Danh mục:</span>
                  <span className="font-semibold">{course.category}</span>
                </div>
                <div className="flex justify-between">
                  <span>Bài học:</span>
                  <span className="font-semibold">{lessons.length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Course Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <h2 className="text-2xl font-bold mb-4">Nội dung khóa học</h2>
              <div className="space-y-3">
                {lessons.map((lesson, index) => (
                  <div key={lesson._id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0 w-8 h-8 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center">
                        {index + 1}
                      </div>
                      <div>
                        <h3 className="font-semibold">{lesson.title}</h3>
                        <p className="text-sm text-gray-600">
                          {Math.floor(lesson.duration / 60)} phút
                        </p>
                      </div>
                    </div>
                    {isEnrolled && (
                      <button
                        onClick={() => navigate(`/lesson/${lesson._id}`)}
                        className="flex items-center space-x-2 text-primary-600 hover:text-primary-700"
                      >
                        <Play className="h-4 w-4" />
                        <span>Học</span>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Progress Sidebar */}
          {isEnrolled && progress && (
            <div className="bg-white rounded-lg shadow-sm p-6 h-fit">
              <h3 className="text-lg font-semibold mb-4">Tiến độ của bạn</h3>
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-2">
                  <span>Hoàn thành</span>
                  <span>{progress.completionPercentage}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-primary-600 h-2 rounded-full transition-all"
                    style={{ width: `${progress.completionPercentage}%` }}
                  ></div>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Bài học đã hoàn thành:</span>
                  <span className="font-semibold">{progress.completedLessons}/{progress.totalLessons}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CourseDetail;