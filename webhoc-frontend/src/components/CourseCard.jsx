import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, User, BookOpen, Star } from 'lucide-react';

const CourseCard = ({ course, viewMode = 'grid' }) => {
  const difficultyColors = {
    Beginner: 'bg-green-100 text-green-800 border-green-200',
    Intermediate: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    Advanced: 'bg-red-100 text-red-800 border-red-200'
  };

  const formatPrice = (priceCents) => {
    if (!priceCents || priceCents === 0) return 'Miễn phí';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(priceCents / 100);
  };

  if (viewMode === 'list') {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-all duration-300 group">
        <div className="flex flex-col md:flex-row md:items-center gap-6">
          <div className="relative md:w-64 h-40 flex-shrink-0 overflow-hidden rounded-lg">
             <img 
              src={course.coverImageUrl || 'https://via.placeholder.com/300x200'} 
              alt={course.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded text-xs font-bold text-primary-700 shadow-sm">
              {formatPrice(course.priceCents)}
            </div>
          </div>
          
          <div className="flex-1">
            <div className="flex justify-between items-start">
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${difficultyColors[course.difficultyLevel] || 'bg-gray-100 text-gray-800'}`}>
                {course.difficultyLevel}
              </span>
            </div>

            <Link to={`/courses/${course._id}`}>
              <h3 className="text-xl font-bold text-gray-900 mt-2 mb-2 group-hover:text-primary-600 transition-colors">
                {course.title}
              </h3>
            </Link>
            
            <p className="text-gray-600 mb-4 line-clamp-2 text-sm">
              {course.description}
            </p>
            
            <div className="flex items-center gap-6 text-sm text-gray-500">
              <div className="flex items-center gap-1.5">
                <User className="h-4 w-4" />
                <span>{course.instructorId?.displayName || 'Giảng viên'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                <span>{course.duration ? `${Math.round(course.duration / 60)} giờ` : 'Tiến độ tự do'}</span>
              </div>
              <div className="flex items-center gap-1.5 text-yellow-500">
                <Star className="h-4 w-4 fill-current" />
                <span className="text-gray-600">4.8 (120)</span>
              </div>
            </div>
          </div>

          <div className="md:self-center">
             <Link
              to={`/courses/${course._id}`}
              className="inline-flex items-center justify-center w-full md:w-auto bg-primary-50 text-primary-700 hover:bg-primary-600 hover:text-white px-6 py-2.5 rounded-lg font-medium transition-all duration-300"
            >
              Chi tiết
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Grid View (Default)
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group flex flex-col h-full">
      <div className="relative h-48 overflow-hidden">
        <img 
          src={course.coverImageUrl || 'https://via.placeholder.com/300x200'} 
          alt={course.title} 
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
        <div className="absolute top-3 right-3 bg-white/95 backdrop-blur px-3 py-1 rounded-md text-sm font-bold text-primary-700 shadow-sm">
          {formatPrice(course.priceCents)}
        </div>
        <div className="absolute top-3 left-3">
           <span className={`px-2.5 py-1 rounded-md text-xs font-semibold shadow-sm border ${difficultyColors[course.difficultyLevel] || 'bg-gray-100'}`}>
            {course.difficultyLevel}
          </span>
        </div>
      </div>

      <div className="p-5 flex-1 flex flex-col">
        <Link to={`/courses/${course._id}`}>
          <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-primary-600 transition-colors">
            {course.title}
          </h3>
        </Link>
        
        <p className="text-gray-600 mb-4 line-clamp-2 text-sm flex-1">
          {course.description}
        </p>

        <div className="border-t border-gray-100 pt-4 mt-auto space-y-3">
          <div className="flex items-center justify-between text-sm text-gray-500">
             <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs">
                  {course.instructorId?.displayName?.[0] || 'I'}
                </div>
                <span className="truncate max-w-[100px]">{course.instructorId?.displayName || 'Giảng viên'}</span>
             </div>
             <div className="flex items-center gap-1">
                <BookOpen className="h-3.5 w-3.5" />
                <span>12 bài</span>
             </div>
          </div>

          <Link
            to={`/courses/${course._id}`}
            className="block w-full text-center bg-white border border-primary-600 text-primary-600 hover:bg-primary-600 hover:text-white py-2 rounded-lg font-medium transition-all duration-300"
          >
            Xem chi tiết
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CourseCard;