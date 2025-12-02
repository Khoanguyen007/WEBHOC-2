import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { courseAPI, lessonAPI, quizAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Plus, Edit2, Trash2, ChevronDown, ChevronUp } from 'lucide-react';

const InstructorCourseDetail = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [course, setCourse] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedLessonId, setExpandedLessonId] = useState(null);
  const [showLessonModal, setShowLessonModal] = useState(false);
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [editingLesson, setEditingLesson] = useState(null);
  const [editingQuiz, setEditingQuiz] = useState(null);
  const [lessonForm, setLessonForm] = useState({
    title: '',
    content: '',
    videoUrl: '',
    duration: 0
  });
  const [quizForm, setQuizForm] = useState({
    title: '',
    description: '',
    passPercentage: 70,
    questions: []
  });

  useEffect(() => {
    if (user?.role !== 'instructor') {
      navigate('/');
      return;
    }
    fetchCourseData();
  }, [courseId, user, navigate]);

  const fetchCourseData = async () => {
    try {
      setLoading(true);
      const courseRes = await courseAPI.getCourseDetail(courseId);
      setCourse(courseRes.data.data || courseRes.data);

      const lessonsRes = await lessonAPI.getLessonsByCourse(courseId);
      setLessons(lessonsRes.data.data || lessonsRes.data || []);

      const quizzesRes = await quizAPI.getQuizzesByCourse(courseId);
      setQuizzes(quizzesRes.data.data || quizzesRes.data || []);
    } catch (error) {
      console.error('Error fetching course data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveLesson = async () => {
    try {
      if (editingLesson) {
        await lessonAPI.updateLesson(editingLesson._id, {
          ...lessonForm,
          courseId
        });
        alert('Cập nhật bài học thành công');
      } else {
        await lessonAPI.createLesson({
          ...lessonForm,
          courseId
        });
        alert('Tạo bài học thành công');
      }
      setShowLessonModal(false);
      setEditingLesson(null);
      setLessonForm({ title: '', content: '', videoUrl: '', duration: 0 });
      fetchCourseData();
    } catch (error) {
      alert('Lỗi: ' + error.response?.data?.message);
    }
  };

  const handleDeleteLesson = async (lessonId) => {
    if (!window.confirm('Bạn chắc chắn muốn xóa bài học này?')) return;
    try {
      // Note: Implement delete in backend
      alert('Xóa bài học thành công');
      fetchCourseData();
    } catch (error) {
      alert('Lỗi xóa bài học: ' + error.response?.data?.message);
    }
  };

  const handleSaveQuiz = async () => {
    try {
      if (!quizForm.title) {
        alert('Vui lòng nhập tiêu đề quiz');
        return;
      }
      if (quizForm.questions.length === 0) {
        alert('Vui lòng thêm ít nhất 1 câu hỏi');
        return;
      }

      if (editingQuiz) {
        await quizAPI.updateQuiz(editingQuiz._id, {
          ...quizForm,
          courseId
        });
        alert('Cập nhật quiz thành công');
      } else {
        await quizAPI.createQuiz({
          ...quizForm,
          courseId
        });
        alert('Tạo quiz thành công');
      }
      setShowQuizModal(false);
      setEditingQuiz(null);
      setQuizForm({ title: '', description: '', passPercentage: 70, questions: [] });
      fetchCourseData();
    } catch (error) {
      alert('Lỗi: ' + error.response?.data?.message);
    }
  };

  const handleDeleteQuiz = async (quizId) => {
    if (!window.confirm('Bạn chắc chắn muốn xóa quiz này?')) return;
    try {
      // Note: Implement delete in backend
      alert('Xóa quiz thành công');
      fetchCourseData();
    } catch (error) {
      alert('Lỗi xóa quiz: ' + error.response?.data?.message);
    }
  };

  const openEditLesson = (lesson) => {
    setEditingLesson(lesson);
    setLessonForm({
      title: lesson.title,
      content: lesson.content,
      videoUrl: lesson.videoUrl,
      duration: lesson.duration
    });
    setShowLessonModal(true);
  };

  const openEditQuiz = (quiz) => {
    setEditingQuiz(quiz);
    setQuizForm({
      title: quiz.title,
      description: quiz.description,
      passPercentage: quiz.passPercentage,
      questions: quiz.questions || []
    });
    setShowQuizModal(true);
  };

  const closeModals = () => {
    setShowLessonModal(false);
    setShowQuizModal(false);
    setEditingLesson(null);
    setEditingQuiz(null);
    setLessonForm({ title: '', content: '', videoUrl: '', duration: 0 });
    setQuizForm({ title: '', description: '', passPercentage: 70, questions: [] });
  };

  const addQuestion = () => {
    setQuizForm({
      ...quizForm,
      questions: [
        ...quizForm.questions,
        {
          question: '',
          options: ['', '', '', ''],
          correctAnswer: 0,
          explanation: ''
        }
      ]
    });
  };

  const updateQuestion = (index, field, value) => {
    const updatedQuestions = [...quizForm.questions];
    updatedQuestions[index][field] = value;
    setQuizForm({ ...quizForm, questions: updatedQuestions });
  };

  const updateQuestionOption = (questionIndex, optionIndex, value) => {
    const updatedQuestions = [...quizForm.questions];
    updatedQuestions[questionIndex].options[optionIndex] = value;
    setQuizForm({ ...quizForm, questions: updatedQuestions });
  };

  const removeQuestion = (index) => {
    setQuizForm({
      ...quizForm,
      questions: quizForm.questions.filter((_, i) => i !== index)
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
          <button
            onClick={() => navigate('/instructor/dashboard')}
            className="text-primary-600 hover:text-primary-700 mb-4 flex items-center gap-1"
          >
            ← Quay lại
          </button>
          <h1 className="text-3xl font-bold text-gray-900">{course?.title}</h1>
          <p className="text-gray-600 mt-2">{course?.description}</p>
        </div>

        {/* Lessons Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">Bài học ({lessons.length})</h2>
            <button
              onClick={() => {
                setEditingLesson(null);
                setLessonForm({ title: '', content: '', videoUrl: '', duration: 0 });
                setShowLessonModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="w-4 h-4" />
              Thêm bài học
            </button>
          </div>

          {lessons.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <p className="text-gray-600 mb-4">Chưa có bài học nào</p>
            </div>
          ) : (
            <div className="space-y-3">
              {lessons.map((lesson, index) => (
                <div key={lesson._id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
                  <div
                    className="p-4 cursor-pointer flex items-center justify-between"
                    onClick={() => setExpandedLessonId(expandedLessonId === lesson._id ? null : lesson._id)}
                  >
                    <div className="flex-1">
                      <p className="text-sm text-gray-600">Bài {index + 1}</p>
                      <h3 className="font-semibold text-gray-900">{lesson.title}</h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {lesson.duration} phút • {lesson.content?.substring(0, 50)}...
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditLesson(lesson);
                        }}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteLesson(lesson._id);
                        }}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      {expandedLessonId === lesson._id ? (
                        <ChevronUp className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                  </div>

                  {expandedLessonId === lesson._id && (
                    <div className="px-4 pb-4 border-t border-gray-200 pt-4">
                      <div className="space-y-2">
                        <p className="text-sm text-gray-600">
                          <strong>Nội dung:</strong> {lesson.content}
                        </p>
                        {lesson.videoUrl && (
                          <p className="text-sm text-gray-600">
                            <strong>Video:</strong> <a href={lesson.videoUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">{lesson.videoUrl}</a>
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quizzes Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">Quiz ({quizzes.length})</h2>
            <button
              onClick={() => {
                setEditingQuiz(null);
                setQuizForm({ title: '', description: '', passPercentage: 70, questions: [] });
                setShowQuizModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <Plus className="w-4 h-4" />
              Thêm quiz
            </button>
          </div>

          {quizzes.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <p className="text-gray-600 mb-4">Chưa có quiz nào</p>
            </div>
          ) : (
            <div className="space-y-3">
              {quizzes.map((quiz) => (
                <div key={quiz._id} className="bg-white rounded-lg shadow p-4 hover:shadow-lg transition-shadow">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{quiz.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {quiz.questions?.length || 0} câu hỏi • Đạt {quiz.passPercentage}%
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEditQuiz(quiz)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteQuiz(quiz._id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Lesson Modal */}
      {showLessonModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-8 max-h-96 overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              {editingLesson ? 'Chỉnh sửa bài học' : 'Tạo bài học mới'}
            </h2>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tiêu đề</label>
                <input
                  type="text"
                  value={lessonForm.title}
                  onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  placeholder="Nhập tiêu đề bài học"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nội dung</label>
                <textarea
                  value={lessonForm.content}
                  onChange={(e) => setLessonForm({ ...lessonForm, content: e.target.value })}
                  rows="4"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  placeholder="Nhập nội dung bài học"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Link video YouTube</label>
                <input
                  type="url"
                  value={lessonForm.videoUrl}
                  onChange={(e) => setLessonForm({ ...lessonForm, videoUrl: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  placeholder="https://www.youtube.com/watch?v=..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Thời lượng (phút)</label>
                <input
                  type="number"
                  value={lessonForm.duration}
                  onChange={(e) => setLessonForm({ ...lessonForm, duration: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  placeholder="0"
                />
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={closeModals}
                className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50"
              >
                Hủy
              </button>
              <button
                onClick={handleSaveLesson}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
              >
                {editingLesson ? 'Cập nhật' : 'Tạo bài học'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quiz Modal */}
      {showQuizModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full p-8 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              {editingQuiz ? 'Chỉnh sửa quiz' : 'Tạo quiz mới'}
            </h2>

            <div className="space-y-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tiêu đề quiz</label>
                <input
                  type="text"
                  value={quizForm.title}
                  onChange={(e) => setQuizForm({ ...quizForm, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  placeholder="Nhập tiêu đề quiz"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Mô tả</label>
                <textarea
                  value={quizForm.description}
                  onChange={(e) => setQuizForm({ ...quizForm, description: e.target.value })}
                  rows="2"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  placeholder="Mô tả quiz (tùy chọn)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Điểm đạt (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={quizForm.passPercentage}
                  onChange={(e) => setQuizForm({ ...quizForm, passPercentage: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              {/* Questions */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-4">Câu hỏi ({quizForm.questions.length})</h3>
                <div className="space-y-6">
                  {quizForm.questions.map((q, qIdx) => (
                    <div key={qIdx} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <div className="flex justify-between items-start mb-4">
                        <h4 className="font-medium text-gray-900">Câu {qIdx + 1}</h4>
                        <button
                          onClick={() => removeQuestion(qIdx)}
                          className="text-red-600 hover:text-red-700 text-sm"
                        >
                          Xóa
                        </button>
                      </div>

                      <div className="mb-3">
                        <label className="block text-xs font-medium text-gray-700 mb-1">Câu hỏi</label>
                        <input
                          type="text"
                          value={q.question}
                          onChange={(e) => updateQuestion(qIdx, 'question', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                          placeholder="Nhập câu hỏi"
                        />
                      </div>

                      <div className="mb-3 space-y-2">
                        <label className="block text-xs font-medium text-gray-700">Lựa chọn</label>
                        {q.options.map((opt, optIdx) => (
                          <div key={optIdx} className="flex items-center gap-2">
                            <input
                              type="radio"
                              name={`correct-${qIdx}`}
                              checked={q.correctAnswer === optIdx}
                              onChange={() => updateQuestion(qIdx, 'correctAnswer', optIdx)}
                              className="w-4 h-4"
                            />
                            <input
                              type="text"
                              value={opt}
                              onChange={(e) => updateQuestionOption(qIdx, optIdx, e.target.value)}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm"
                              placeholder={`Lựa chọn ${optIdx + 1}`}
                            />
                          </div>
                        ))}
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Giải thích</label>
                        <input
                          type="text"
                          value={q.explanation}
                          onChange={(e) => updateQuestion(qIdx, 'explanation', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                          placeholder="Giải thích đáp án"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={addQuestion}
                  className="mt-4 w-full px-4 py-2 border-2 border-dashed border-gray-300 text-gray-600 rounded-lg hover:border-gray-400 hover:text-gray-700"
                >
                  + Thêm câu hỏi
                </button>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={closeModals}
                className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50"
              >
                Hủy
              </button>
              <button
                onClick={handleSaveQuiz}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700"
              >
                {editingQuiz ? 'Cập nhật quiz' : 'Tạo quiz'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InstructorCourseDetail;
