import React, { useState, useEffect } from 'react';
import { Search, Filter, Grid, List, AlertCircle } from 'lucide-react';
import { courseAPI } from '../services/api';
import CourseCard from '../components/CourseCard';

const Courses = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [totalCourses, setTotalCourses] = useState(0);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const params = {};
        if (searchTerm) params.search = searchTerm;
        if (category) params.category = category;
        if (difficulty) params.difficulty = difficulty;

        const response = await courseAPI.getCourses(params);
        setCourses(response.data.data || []);
        setTotalCourses(response.data.meta?.total || response.data.data?.length || 0);
      } catch (error) {
        console.error('Error fetching courses:', error);
        setError('Không thể tải khóa học. Vui lòng thử lại.');
        setCourses([]);
      } finally {
        setLoading(false);
      }
    };

    // Debounce search to avoid too many requests
    const timer = setTimeout(fetchCourses, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, category, difficulty]);

  const categories = ['Programming', 'Web Development', 'Mobile', 'Data Science', 'Design'];
  const difficulties = ['Beginner', 'Intermediate', 'Advanced'];

  const LoadingSkeleton = () => (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="bg-gray-200 rounded-lg h-80 animate-pulse">
          <div className="h-48 bg-gray-300"></div>
          <div className="p-4 space-y-3">
            <div className="h-4 bg-gray-300 rounded w-3/4"></div>
            <div className="h-4 bg-gray-300 rounded w-1/2"></div>
          </div>
        </div>
      ))}
    </div>
  );

  const ErrorAlert = () => (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
      <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
      <div>
        <p className="text-red-800 font-medium">Lỗi tải dữ liệu</p>
        <p className="text-red-700 text-sm">{error}</p>
      </div>
      <button
        onClick={() => window.location.reload()}
        className="ml-auto px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
      >
        Thử lại
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Khám phá khóa học
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Chọn từ hàng trăm khóa học lập trình từ các chuyên gia hàng đầu
          </p>
        </div>

        {/* Error Alert */}
        {error && <ErrorAlert />}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            {/* Search */}
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Tìm kiếm khóa học..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                disabled={loading}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>

            {/* Category Filter */}
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              disabled={loading}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="">Tất cả danh mục</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            {/* Difficulty Filter */}
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              disabled={loading}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="">Tất cả cấp độ</option>
              {difficulties.map(diff => (
                <option key={diff} value={diff}>{diff}</option>
              ))}
            </select>

            {/* View Toggle */}
            <div className="flex border border-gray-300 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                disabled={loading}
                className={`p-2 transition-colors ${viewMode === 'grid' ? 'bg-primary-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'} disabled:opacity-50`}
              >
                <Grid className="h-5 w-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                disabled={loading}
                className={`p-2 transition-colors ${viewMode === 'list' ? 'bg-primary-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'} disabled:opacity-50`}
              >
                <List className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && <LoadingSkeleton />}

        {/* Courses Grid */}
        {!loading && (
          <>
            <div className="flex justify-between items-center mb-6">
              <p className="text-gray-600">
                Tìm thấy {totalCourses} khóa học
              </p>
            </div>

            {courses.length > 0 ? (
              <div className={`gap-6 ${viewMode === 'grid' ? 'grid md:grid-cols-2 lg:grid-cols-3' : 'space-y-6'}`}>
                {courses.map(course => (
                  <CourseCard key={course._id} course={course} viewMode={viewMode} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-white rounded-lg">
                <p className="text-gray-500 text-lg mb-2">Không tìm thấy khóa học nào.</p>
                <p className="text-gray-400">Thử thay đổi các bộ lọc hoặc từ khóa tìm kiếm</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Courses;