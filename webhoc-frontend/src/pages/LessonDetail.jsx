import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle, ChevronRight, ChevronLeft, FileText, BookMarked } from 'lucide-react';
import { lessonAPI, progressAPI, quizAPI } from '../services/api';
import VideoPlayer from '../components/VideoPlayer';

const LessonDetail = () => {
  const { courseId, lessonId } = useParams();
  const navigate = useNavigate();
  
  const [currentLesson, setCurrentLesson] = useState(null);
  const [lessonsList, setLessonsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [progress, setProgress] = useState(null);
  const [savingProgress, setSavingProgress] = useState(false);
  const [quizzes, setQuizzes] = useState([]);
  const [showQuiz, setShowQuiz] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const listResponse = await lessonAPI.getLessons(courseId);
        setLessonsList(listResponse.data.data);

        if (lessonId) {
          const foundLesson = listResponse.data.data.find(l => l._id === lessonId);
          setCurrentLesson(foundLesson);
          
          // Fetch progress for resume
          try {
            const progressResponse = await progressAPI.getCourseProgress(courseId);
            const lessonProgress = progressResponse.data.lessons?.find(
              l => l.lessonId === lessonId
            );
            setProgress(lessonProgress);
          } catch (err) {
            console.log('Progress not available yet');
          }

          // Fetch quizzes for this course
          try {
            const quizzesResponse = await quizAPI.getQuizzes(courseId);
            setQuizzes(quizzesResponse.data.data || []);
          } catch (err) {
            console.log('No quizzes available');
          }
        } else if (listResponse.data.data.length > 0) {
          navigate(`/courses/${courseId}/lessons/${listResponse.data.data[0]._id}`, { replace: true });
        }
      } catch (error) {
        console.error("Failed to load lesson", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [courseId, lessonId, navigate]);

  const handleVideoTimeUpdate = async (currentTime) => {
    // Save progress periodically (every 10 seconds)
    if (Math.floor(currentTime) % 10 === 0 && Math.floor(currentTime) !== Math.floor(progress?.lastPosition || 0)) {
      setSavingProgress(true);
      try {
        await progressAPI.updateLessonProgress(lessonId, {
          completed: false,
          lastPosition: currentTime,
          timeSpent: currentTime
        });
        setProgress(prev => prev ? { ...prev, lastPosition: currentTime } : { lastPosition: currentTime });
      } catch (error) {
        console.error('Failed to save progress:', error);
      } finally {
        setSavingProgress(false);
      }
    }
  };

  const handleComplete = async () => {
    setCompleting(true);
    try {
      // Gọi API cập nhật tiến độ - mark as completed
      await progressAPI.updateLessonProgress(lessonId, { 
        completed: true,
        timeSpent: currentLesson.duration || 0
      });
      
      // Logic chuyển bài tiếp theo
      const currentIndex = lessonsList.findIndex(l => l._id === lessonId);
      if (currentIndex < lessonsList.length - 1) {
        const nextLesson = lessonsList[currentIndex + 1];
        navigate(`/courses/${courseId}/lessons/${nextLesson._id}`);
      } else {
        alert("Chúc mừng bạn đã hoàn thành tất cả bài học!");
        navigate(`/courses/${courseId}`);
      }
    } catch (error) {
      alert("Có lỗi khi lưu tiến độ");
    } finally {
      setCompleting(false);
    }
  };

  if (loading || !currentLesson) return <div className="p-8 text-center">Đang tải bài học...</div>;

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-gray-100">
      {/* Main Content Area (Video/Text) */}
      <div className="flex-1 flex flex-col overflow-y-auto">
        <div className="bg-black p-4">
          <VideoPlayer 
            videoUrl={currentLesson.videoUrl} 
            onTimeUpdate={handleVideoTimeUpdate}
            lastPosition={progress?.lastPosition || 0}
            title={currentLesson.title}
          />
        </div>

        <div className="p-6 bg-white flex-grow">
          <h1 className="text-2xl font-bold mb-2">{currentLesson.title}</h1>
          {savingProgress && (
            <p className="text-sm text-blue-600 mb-4">💾 Đang lưu tiến độ...</p>
          )}
          <div className="prose max-w-none text-gray-600 mb-8">
            {currentLesson.content}
          </div>
          
          {/* Quiz Section - Show after lesson completion */}
          {progress?.completed && quizzes.length > 0 && (
            <div className="mb-8 p-6 bg-blue-50 border-2 border-blue-200 rounded-lg">
              <h2 className="text-lg font-bold text-blue-900 mb-3 flex items-center">
                <BookMarked className="w-5 h-5 mr-2" />
                Bài kiểm tra
              </h2>
              <p className="text-blue-700 mb-4">Hoàn thành bài học rồi! Hãy làm bài kiểm tra để kiểm tra kiến thức của bạn.</p>
              <div className="space-y-2">
                {quizzes.map((quiz) => (
                  <button
                    key={quiz._id}
                    onClick={() => navigate(`/courses/${courseId}/quiz/${quiz._id}`)}
                    className="w-full bg-white text-left p-4 rounded-lg border border-blue-200 hover:bg-blue-100 transition-colors flex items-center justify-between"
                  >
                    <div>
                      <h3 className="font-semibold text-gray-900">{quiz.title}</h3>
                      <p className="text-sm text-gray-600">{quiz.description}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-blue-600" />
                  </button>
                ))}
              </div>
            </div>
          )}
          
          <div className="flex justify-between items-center border-t pt-6">
            <button 
              onClick={() => navigate(`/courses/${courseId}`)}
              className="text-gray-600 hover:text-primary-600 flex items-center"
            >
              <ChevronLeft size={20} /> Về trang khóa học
            </button>
            
            {!progress?.completed ? (
              <button
                onClick={handleComplete}
                disabled={completing}
                className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center space-x-2 transition-all disabled:opacity-50"
              >
                {completing ? <span>Đang lưu...</span> : (
                  <>
                    <span>Hoàn thành & Tiếp tục</span>
                    <ChevronRight size={20} />
                  </>
                )}
              </button>
            ) : (
              <div className="flex items-center text-green-600 font-semibold">
                <CheckCircle className="w-5 h-5 mr-2" />
                Đã hoàn thành
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sidebar List Bài học */}
      <div className="w-full lg:w-96 bg-white border-l border-gray-200 overflow-y-auto h-full">
        <div className="p-4 border-b border-gray-200">
          <h3 className="font-bold text-gray-800">Nội dung khóa học</h3>
        </div>
        <div className="divide-y divide-gray-100">
          {lessonsList.map((item, index) => (
            <button
              key={item._id}
              onClick={() => navigate(`/courses/${courseId}/lessons/${item._id}`)}
              className={`w-full text-left p-4 flex items-start hover:bg-gray-50 transition-colors ${
                item._id === lessonId ? 'bg-primary-50 border-l-4 border-primary-600' : ''
              }`}
            >
              <div className="mr-3 mt-1">
                <div className="w-6 h-6 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center text-xs font-bold">
                  {progress?.completed ? (
                    <CheckCircle size={20} className="text-green-600" />
                  ) : (
                    index + 1
                  )}
                </div>
              </div>
              <div>
                <p className={`font-medium ${item._id === lessonId ? 'text-primary-700' : 'text-gray-700'}`}>
                  {item.title}
                </p>
                <p className="text-xs text-gray-500 mt-1">{Math.floor(item.duration / 60)} phút</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
export default LessonDetail;