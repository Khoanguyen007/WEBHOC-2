import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, User, LogOut, Menu, X, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setIsMenuOpen(false);
  };

  return (
    <header className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 text-primary-600 hover:text-primary-700 transition-colors">
            <BookOpen className="h-8 w-8" />
            <span className="text-xl font-bold">WEBHOC</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link to="/" className="text-gray-600 hover:text-primary-600 font-medium transition-colors">
              Trang chủ
            </Link>
            <Link to="/courses" className="text-gray-600 hover:text-primary-600 font-medium transition-colors">
              Khóa học
            </Link>
            {user && (
              <Link to="/dashboard" className="text-gray-600 hover:text-primary-600 font-medium transition-colors flex items-center">
                <LayoutDashboard className="w-4 h-4 mr-1" />
                Dashboard
              </Link>
            )}
          </nav>

          {/* User Menu (Desktop) */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold">
                    {user.displayName ? user.displayName[0].toUpperCase() : 'U'}
                  </div>
                  <span className="text-gray-700 font-medium text-sm">
                    {user.displayName}
                  </span>
                </div>
                
                <div className="h-6 w-px bg-gray-300 mx-2"></div>

                <Link
                  to="/profile"
                  title="Hồ sơ cá nhân"
                  className="p-2 text-gray-500 hover:text-primary-600 hover:bg-gray-100 rounded-full transition-all"
                >
                  <User className="h-5 w-5" />
                </Link>
                <button
                  onClick={handleLogout}
                  title="Đăng xuất"
                  className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-all"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <div className="flex space-x-3">
                <Link
                  to="/login"
                  className="text-gray-700 hover:text-primary-600 font-medium px-4 py-2 transition-colors"
                >
                  Đăng nhập
                </Link>
                <Link
                  to="/register"
                  className="bg-primary-600 text-white px-5 py-2 rounded-lg font-medium hover:bg-primary-700 transition-all shadow-sm hover:shadow"
                >
                  Đăng ký
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-600 hover:text-primary-600 focus:outline-none p-2"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 py-4 px-4 shadow-lg absolute w-full left-0">
          <div className="flex flex-col space-y-4">
            <Link 
              to="/" 
              onClick={() => setIsMenuOpen(false)}
              className="text-gray-600 hover:text-primary-600 font-medium py-2 border-b border-gray-50"
            >
              Trang chủ
            </Link>
            <Link 
              to="/courses" 
              onClick={() => setIsMenuOpen(false)}
              className="text-gray-600 hover:text-primary-600 font-medium py-2 border-b border-gray-50"
            >
              Khóa học
            </Link>
            
            {user ? (
              <>
                <Link 
                  to="/dashboard" 
                  onClick={() => setIsMenuOpen(false)}
                  className="text-gray-600 hover:text-primary-600 font-medium py-2 border-b border-gray-50"
                >
                  Dashboard học tập
                </Link>
                <Link 
                  to="/profile" 
                  onClick={() => setIsMenuOpen(false)}
                  className="text-gray-600 hover:text-primary-600 font-medium py-2 border-b border-gray-50"
                >
                  Hồ sơ cá nhân ({user.displayName})
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-left text-red-600 hover:text-red-700 font-medium py-2"
                >
                  Đăng xuất
                </button>
              </>
            ) : (
              <div className="flex flex-col space-y-3 pt-2">
                <Link
                  to="/login"
                  onClick={() => setIsMenuOpen(false)}
                  className="text-center text-gray-700 border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50"
                >
                  Đăng nhập
                </Link>
                <Link
                  to="/register"
                  onClick={() => setIsMenuOpen(false)}
                  className="text-center bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
                >
                  Đăng ký ngay
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;