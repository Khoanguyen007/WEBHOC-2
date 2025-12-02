import React, { useState } from 'react';
import { QrCode, Loader } from 'lucide-react';
import { paymentAPI } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import QRPaymentModal from './QRPaymentModal';

const QuickEnrollButton = ({ courseId, courseTitle, price, size = 'medium' }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [error, setError] = useState('');

  const handleQuickEnroll = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // First get course info to confirm price
      const response = await paymentAPI.getCoursePaymentInfo(courseId);
      const courseInfo = response.data.course;
      
      // Check if course is free
      if (courseInfo.price === 0) {
        // Handle free course enrollment
        navigate(`/checkout/${courseId}`);
        return;
      }

      // Show QR modal for paid course
      setShowQRModal(true);
      
    } catch (err) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi đăng ký');
      console.error('Quick enroll error:', err);
    } finally {
      setLoading(false);
    }
  };

  const buttonSizeClasses = {
    small: 'px-4 py-2 text-sm',
    medium: 'px-6 py-3 text-base',
    large: 'px-8 py-4 text-lg'
  };

  return (
    <>
      <button 
        onClick={handleQuickEnroll}
        disabled={loading}
        className={`${buttonSizeClasses[size]} bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 disabled:opacity-60 disabled:cursor-not-allowed transition-all flex items-center justify-center`}
      >
        {loading ? (
          <>
            <Loader className="w-4 h-4 mr-2 animate-spin" />
            Đang xử lý...
          </>
        ) : (
          <>
            <QrCode className="w-5 h-5 mr-2" />
            Đăng ký ngay - {price.toLocaleString('vi-VN')} VND
          </>
        )}
      </button>
      
      {error && (
        <p className="text-red-600 text-sm mt-2">{error}</p>
      )}

      {showQRModal && (
        <QRPaymentModal
          courseId={courseId}
          courseTitle={courseTitle}
          amount={price}
          onClose={() => setShowQRModal(false)}
          onPaymentSuccess={() => {
            navigate('/payment-result?status=success&type=qr');
          }}
        />
      )}
    </>
  );
};

export default QuickEnrollButton;