import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../services/api';

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('Đang xác thực...');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Token không tồn tại');
      return;
    }

    const verify = async () => {
      try {
        const res = await api.post('/v2/auth/verify', { token });
        setStatus('success');
        setMessage(res.data.message || 'Xác thực email thành công!');
      } catch (err) {
        setStatus('error');
        setMessage(err.response?.data?.message || 'Xác thực thất bại hoặc token đã hết hạn');
      }
    };

    verify();
  }, [token]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full text-center">
        {status === 'loading' && <p className="text-gray-600">{message}</p>}
        {status === 'success' && (
          <>
            <h2 className="text-2xl font-bold text-green-700 mb-4">Xác thực thành công</h2>
            <p className="text-gray-700 mb-6">{message}</p>
            <Link to="/login" className="inline-block px-6 py-2 bg-primary-600 text-white rounded-lg">Đăng nhập</Link>
          </>
        )}
        {status === 'error' && (
          <>
            <h2 className="text-2xl font-bold text-red-600 mb-4">Xác thực thất bại</h2>
            <p className="text-gray-700 mb-6">{message}</p>
            <Link to="/" className="inline-block px-6 py-2 border border-gray-300 rounded-lg">Về trang chủ</Link>
          </>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;
