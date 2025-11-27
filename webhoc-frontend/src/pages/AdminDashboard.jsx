import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, BookOpen, TrendingUp, DollarSign, BarChart3 } from 'lucide-react';
import { adminAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Check if user is admin
    if (user?.role !== 'admin') {
      navigate('/');
      return;
    }

    const fetchStats = async () => {
      try {
        const response = await adminAPI.getStats();
        setStats(response.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load stats');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto px-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto px-4">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        </div>
      </div>
    );
  }

  const revenue = stats?.totalRevenue ? (stats.totalRevenue / 100).toFixed(2) : '0.00';
  const revenueChartHeight = stats?.totalRevenue ? Math.min((stats.totalRevenue / 10000) * 100, 100) : 0;

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">Quản lý thống kê nền tảng WEBHOC</p>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Users */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Tổng Người Dùng</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats?.totalUsers || 0}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          {/* Total Courses */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Tổng Khóa Học</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats?.totalCourses || 0}</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-lg">
                <BookOpen className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          {/* Total Enrollments */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Tổng Đăng Ký</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats?.totalEnrollments || 0}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          {/* Total Revenue */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Tổng Doanh Thu</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">${revenue}</p>
              </div>
              <div className="bg-yellow-100 p-3 rounded-lg">
                <DollarSign className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Revenue Chart */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center mb-6">
            <BarChart3 className="w-5 h-5 text-gray-600 mr-2" />
            <h2 className="text-xl font-bold text-gray-900">Biểu Đồ Doanh Thu</h2>
          </div>

          <div className="flex items-end justify-center h-64 space-x-2 bg-gray-50 rounded-lg p-6">
            {/* Simplified bar chart */}
            <div className="flex flex-col items-center">
              <div className="flex-1 bg-gradient-to-t from-primary-600 to-primary-400 rounded-t w-12" style={{ height: `${revenueChartHeight}%`, minHeight: revenueChartHeight > 0 ? '20px' : '0' }}></div>
              <p className="text-xs text-gray-600 mt-2">Doanh Thu</p>
            </div>
          </div>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Tổng doanh thu: <span className="text-2xl font-bold text-primary-600">${revenue}</span>
            </p>
          </div>
        </div>

        {/* Summary Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mt-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Tóm Tắt Thống Kê</h2>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Chỉ Số</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Giá Trị</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <tr className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-gray-900 font-medium">Tổng Người Dùng</td>
                  <td className="px-6 py-4 text-gray-600">{stats?.totalUsers || 0}</td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-gray-900 font-medium">Tổng Khóa Học</td>
                  <td className="px-6 py-4 text-gray-600">{stats?.totalCourses || 0}</td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-gray-900 font-medium">Tổng Đăng Ký</td>
                  <td className="px-6 py-4 text-gray-600">{stats?.totalEnrollments || 0}</td>
                </tr>
                <tr className="bg-primary-50 hover:bg-primary-100">
                  <td className="px-6 py-4 text-primary-900 font-bold">Tổng Doanh Thu (USD)</td>
                  <td className="px-6 py-4 text-primary-700 font-bold">${revenue}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-8">
          <h3 className="text-sm font-bold text-blue-900 mb-2">ℹ️ Thông Tin</h3>
          <p className="text-sm text-blue-800">
            Bảng điều khiển này cập nhật dữ liệu thống kê theo thời gian thực. Bạn có thể sử dụng những số liệu này để theo dõi hiệu suất nền tảng học tập WEBHOC.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
