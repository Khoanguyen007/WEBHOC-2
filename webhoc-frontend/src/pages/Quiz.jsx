import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { quizAPI } from '../services/api';
import { CheckCircle, XCircle, ChevronLeft } from 'lucide-react';

const Quiz = () => {
  const { courseId, quizId } = useParams();
  const navigate = useNavigate();
  
  const [currentQuiz, setCurrentQuiz] = useState(null);
  const [userAnswers, setUserAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        setLoading(true);
        // Nếu có quizId trong URL thì fetch quiz đó
        if (quizId) {
          const response = await quizAPI.getQuiz(quizId);
          setCurrentQuiz(response.data.data || response.data);
        } else {
          // Nếu không có quizId thì fetch danh sách quiz
          const response = await quizAPI.getQuizzes(courseId);
          if (response.data.data && response.data.data.length > 0) {
            setCurrentQuiz(response.data.data[0]);
          }
        }
      } catch (error) {
        console.error("Error fetching quiz", error);
      } finally {
        setLoading(false);
      }
    };
    fetchQuiz();
  }, [courseId, quizId]);

  const handleOptionSelect = (questionId, optionIndex) => {
    setUserAnswers(prev => ({
      ...prev,
      [questionId]: optionIndex
    }));
  };

  const handleSubmit = async () => {
    if (!currentQuiz) return;
    
    setSubmitting(true);
    try {
      const answersPayload = {
        answers: currentQuiz.questions.map((q) => ({
          questionIndex: currentQuiz.questions.indexOf(q),
          selectedOption: userAnswers[q._id] !== undefined ? userAnswers[q._id] : -1,
          isCorrect: userAnswers[q._id] === q.correctAnswer
        }))
      };

      const response = await quizAPI.submitQuiz(currentQuiz._id, answersPayload);
      setResult(response.data.data || response.data);
    } catch (error) {
      alert("Nộp bài thất bại: " + error.response?.data?.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải bài kiểm tra...</p>
        </div>
      </div>
    );
  }

  if (!currentQuiz) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Không tìm thấy bài kiểm tra</p>
          <button
            onClick={() => navigate(-1)}
            className="text-primary-600 hover:text-primary-700"
          >
            Quay lại
          </button>
        </div>
      </div>
    );
  }

  // Màn hình kết quả
  if (result) {
    const passPercentage = currentQuiz.passingScore || 50;
    const isPassed = result.percentage >= passPercentage;

    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4 max-w-2xl">
          <button
            onClick={() => navigate(-1)}
            className="mb-6 text-gray-600 hover:text-primary-600 flex items-center"
          >
            <ChevronLeft className="w-4 h-4 mr-2" /> Quay lại
          </button>

          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="text-center mb-8">
              {isPassed ? (
                <>
                  <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-4" />
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">Chúc mừng!</h2>
                  <p className="text-gray-600">Bạn đã vượt qua bài kiểm tra này</p>
                </>
              ) : (
                <>
                  <XCircle className="w-20 h-20 text-red-500 mx-auto mb-4" />
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">Rất tiếc!</h2>
                  <p className="text-gray-600">Bạn cần đạt {passPercentage}% để vượt qua</p>
                </>
              )}
            </div>

            <div className="bg-gray-50 rounded-lg p-6 mb-8">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-gray-600 text-sm mb-1">Điểm số</p>
                  <p className="text-4xl font-bold text-primary-600">{result.percentage}%</p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm mb-1">Trả lời đúng</p>
                  <p className="text-4xl font-bold text-green-600">{result.correctAnswers}/{result.totalQuestions}</p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm mb-1">Thời gian</p>
                  <p className="text-4xl font-bold text-blue-600">{Math.floor(result.timeSpent / 60)}m</p>
                </div>
              </div>
            </div>

            {/* Chi tiết câu trả lời */}
            <div className="mb-8">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Chi tiết câu trả lời</h3>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {currentQuiz.questions?.map((q, idx) => {
                  const userAnswer = userAnswers[q._id];
                  const isCorrect = userAnswer === q.correctAnswer;

                  return (
                    <div key={q._id} className={`p-4 rounded-lg border-2 ${
                      isCorrect ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                    }`}>
                      <div className="flex items-start justify-between mb-2">
                        <p className="font-medium text-gray-900">Câu {idx + 1}: {q.question}</p>
                        {isCorrect ? (
                          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                        )}
                      </div>
                      <p className={`text-sm mb-2 ${isCorrect ? 'text-green-700' : 'text-red-700'}`}>
                        Bạn chọn: <strong>{q.options?.[userAnswer] || 'Không trả lời'}</strong>
                      </p>
                      {!isCorrect && (
                        <p className="text-sm text-green-700">
                          Đáp án đúng: <strong>{q.options?.[q.correctAnswer]}</strong>
                        </p>
                      )}
                      {q.explanation && (
                        <p className="text-sm text-gray-600 mt-2 italic">💡 {q.explanation}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex gap-4 justify-center">
              <button
                onClick={() => {
                  setResult(null);
                  setUserAnswers({});
                  setCurrentQuestionIndex(0);
                }}
                className="px-6 py-3 border-2 border-primary-600 text-primary-600 rounded-lg font-semibold hover:bg-primary-50 transition-colors"
              >
                Làm lại
              </button>
              <button
                onClick={() => navigate(`/courses/${courseId}`)}
                className="px-6 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors"
              >
                Về khóa học
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Màn hình làm bài
  const currentQuestion = currentQuiz.questions?.[currentQuestionIndex];
  const totalQuestions = currentQuiz.questions?.length || 0;
  const progressPercent = ((currentQuestionIndex + 1) / totalQuestions) * 100;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-3xl">
        <button
          onClick={() => navigate(-1)}
          className="mb-6 text-gray-600 hover:text-primary-600 flex items-center"
        >
          <ChevronLeft className="w-4 h-4 mr-2" /> Quay lại
        </button>

        <div className="bg-white rounded-lg shadow-lg p-6">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{currentQuiz.title}</h1>
            <p className="text-gray-600 mb-4">{currentQuiz.description}</p>
            
            {/* Progress bar */}
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-600">Câu {currentQuestionIndex + 1}/{totalQuestions}</span>
              <span className="text-sm font-medium text-gray-600">{Math.round(progressPercent)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
          </div>

          {/* Question */}
          {currentQuestion && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                {currentQuestion.question}
              </h2>

              {/* Options */}
              <div className="space-y-3">
                {currentQuestion.options?.map((option, optIndex) => (
                  <label
                    key={optIndex}
                    className={`flex items-start p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      userAnswers[currentQuestion._id] === optIndex
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name={currentQuestion._id}
                      className="h-4 w-4 text-primary-600 mt-1 flex-shrink-0"
                      onChange={() => handleOptionSelect(currentQuestion._id, optIndex)}
                      checked={userAnswers[currentQuestion._id] === optIndex}
                    />
                    <span className="ml-3 text-gray-700">{option}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between gap-4">
            <button
              onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
              disabled={currentQuestionIndex === 0}
              className="px-4 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ← Câu trước
            </button>

            {currentQuestionIndex < totalQuestions - 1 ? (
              <button
                onClick={() => setCurrentQuestionIndex(currentQuestionIndex + 1)}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700"
              >
                Câu tiếp →
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={submitting || Object.keys(userAnswers).length < totalQuestions}
                className="px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Đang nộp...' : 'Nộp bài'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Quiz;