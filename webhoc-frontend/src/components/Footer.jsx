import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Github, Twitter, Mail, Facebook, Linkedin } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white py-12 mt-auto">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* Brand Info */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center space-x-2 text-white hover:text-primary-400 transition-colors">
              <BookOpen className="h-8 w-8" />
              <span className="text-2xl font-bold">WEBHOC</span>
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed">
              Nền tảng học lập trình trực tuyến hàng đầu, giúp bạn làm chủ công nghệ và phát triển sự nghiệp.
            </p>
            <div className="flex space-x-4 pt-2">
              <a href="#" className="text-gray-400 hover:text-white transition-colors"><Github className="h-5 w-5" /></a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors"><Facebook className="h-5 w-5" /></a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors"><Twitter className="h-5 w-5" /></a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors"><Linkedin className="h-5 w-5" /></a>
            </div>
          </div>

          {/* Courses Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-primary-400">Khóa học</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/courses?category=web" className="text-gray-400 hover:text-white transition-colors">Lập trình Web</Link></li>
              <li><Link to="/courses?category=mobile" className="text-gray-400 hover:text-white transition-colors">Lập trình Mobile</Link></li>
              <li><Link to="/courses?category=data" className="text-gray-400 hover:text-white transition-colors">Khoa học dữ liệu</Link></li>
              <li><Link to="/courses?category=devops" className="text-gray-400 hover:text-white transition-colors">DevOps</Link></li>
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-primary-400">Hỗ trợ</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Trung tâm trợ giúp</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Câu hỏi thường gặp</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Liên hệ góp ý</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Báo lỗi</a></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-primary-400">Liên hệ</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center text-gray-400">
                <Mail className="h-4 w-4 mr-2" /> contact@webhoc.com
              </li>
              <li className="text-gray-400">
                123 Đường ABC, Quận 1, TP.HCM
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-gray-500">
          <p>&copy; {new Date().getFullYear()} WEBHOC. All rights reserved.</p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <a href="#" className="hover:text-white transition-colors">Điều khoản</a>
            <a href="#" className="hover:text-white transition-colors">Bảo mật</a>
            <a href="#" className="hover:text-white transition-colors">Cookies</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;