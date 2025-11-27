import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { quizAPI } from '../services/api';

const Quiz = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  
  const [quizzes, setQuizzes] = useState([]);
  const [currentQuiz, setCurrentQuiz] = useState(null); // Quiz đang chọn để làm
  const [userAnswers, setUserAnswers] = useState({}); // { questionId: optionIndex }
  const [result, setResult] = useState(null); // Kết quả trả về từ backend
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        // Lấy danh sách quiz của khóa học
        const response = await quizAPI.getQuizzes(courseId);
        if (response.data.data && response.data.data.length > 0) {
            setQuizzes(response.data.data);
            // Mặc định chọn bài quiz đầu tiên để hiển thị (hoặc làm danh sách chọn)
            setCurrentQuiz(response.data.data[0]);
        }
      } catch (error) {
        console.error("Error fetching quizzes", error);
      } finally {
        setLoading(false);
      }
    };
    fetchQuizzes();
  }, [courseId]);

  const handleOptionSelect = (questionId, optionIndex) => {
    setUserAnswers(prev => ({
        ...prev,
        [questionId]: optionIndex
    }));
  };

  const handleSubmit = async () => {
    if (!currentQuiz) return;
    
    // Format dữ liệu để gửi về backend (tùy thuộc vào quizController yêu cầu body thế nào)
    // Giả sử backend cần mảng answers: [{ questionId, selectedOption }]
    const answersPayload = {
        answers: Object.entries(userAnswers).map(([questionId, selectedOption]) => ({
            questionId,
            selectedOption
        }))
    };

    try {
        const response = await quizAPI.submitQuiz(currentQuiz._id, answersPayload);
        setResult(response.data); // Backend trả về score, pass/fail
    } catch (error) {
        alert("Nộp bài thất bại: " + error.response?.data?.message);
    }
  };

  if (loading) return <div className="p-8 text-center">Đang tải bài tập...</div>;
  if (!currentQuiz) return <div className="p-8 text-center">Khóa học này chưa có bài tập trắc nghiệm.</div>;

  // Màn hình kết quả
  if (result) {
      return (
          <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
              <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
                  <h2 className="text-3xl font-bold mb-4">{result.passed ? '🎉 Chúc mừng!' : '😔 Rất tiếc'}</h2>
                  <div className="text-6xl font-bold text-primary-600 mb-4">{result.score}%</div>
                  <p className="text-gray-600 mb-6">
                      Bạn đã trả lời đúng {result.correctCount}/{result.totalQuestions} câu hỏi.
                  </p>
                  <div className="flex gap-4 justify-center">
                    <button 
                        onClick={() => { setResult(null); setUserAnswers({}); }}
                        className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
                    >
                        Làm lại
                    </button>
                    <button 
                        onClick={() => navigate(`/courses/${courseId}`)}
                        className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700"
                    >
                        Về khóa học
                    </button>
                  </div>
              </div>
          </div>
      );
  }

  // Màn hình làm bài
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="bg-white rounded-lg shadow-sm p-8">
            <div className="border-b pb-4 mb-6">
                <h1 className="text-2xl font-bold text-gray-900">{currentQuiz.title}</h1>
                <p className="text-gray-500">Hãy chọn đáp án đúng nhất cho mỗi câu hỏi</p>
            </div>

            <div className="space-y-8">
                {currentQuiz.questions?.map((q, qIndex) => (
                    <div key={q._id} className="p-4 bg-gray-50 rounded-lg">
                        <h3 className="font-semibold text-lg mb-4">Câu {qIndex + 1}: {q.questionText}</h3>
                        <div className="space-y-3">
                            {q.options.map((opt, optIndex) => (
                                <label 
                                    key={optIndex} 
                                    className={`flex items-center p-3 rounded border cursor-pointer transition-colors ${
                                        userAnswers[q._id] === optIndex 
                                        ? 'border-primary-500 bg-primary-50' 
                                        : 'border-gray-200 hover:bg-gray-100'
                                    }`}
                                >
                                    <input
                                        type="radio"
                                        name={q._id}
                                        className="h-4 w-4 text-primary-600 focus:ring-primary-500"
                                        onChange={() => handleOptionSelect(q._id, optIndex)}
                                        checked={userAnswers[q._id] === optIndex}
                                    />
                                    <span className="ml-3 text-gray-700">{opt}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-8 flex justify-end">
                <button
                    onClick={handleSubmit}
                    disabled={Object.keys(userAnswers).length < currentQuiz.questions.length}
                    className="bg-primary-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Nộp bài
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Quiz;