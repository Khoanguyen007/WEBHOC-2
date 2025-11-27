import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Hiển thị loading khi đang kiểm tra trạng thái đăng nhập
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mb-4"></div>
          <p className="text-gray-500 font-medium">Đang tải...</p>
        </div>
      </div>
    );
  }

  // Nếu không có user -> chưa đăng nhập -> Redirect về Login
  if (!user) {
    // state={{ from: location }} giúp redirect lại trang cũ sau khi login thành công
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Nếu đã đăng nhập, hiển thị nội dung trang con
  return children;
};

export default ProtectedRoute;