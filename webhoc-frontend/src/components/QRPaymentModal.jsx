import React, { useState, useEffect } from 'react';
import { X, QrCode, Copy, CheckCircle, AlertCircle, Clock, Banknote, Smartphone, RefreshCw } from 'lucide-react';
import { paymentAPI } from '../services/api';

const QRPaymentModal = ({ courseId, courseTitle, amount, onClose, onPaymentSuccess }) => {
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [qrData, setQrData] = useState(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30 * 60); // 30 minutes in seconds
  const [autoVerifyInterval, setAutoVerifyInterval] = useState(null);

  // Fetch QR code
  useEffect(() => {
    generateQR();
  }, []);

  // Countdown timer
  useEffect(() => {
    if (!qrData || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [qrData, timeLeft]);

  // Auto-verify payment every 30 seconds
  useEffect(() => {
    if (qrData?.paymentId && qrData.status === 'pending') {
      const interval = setInterval(() => {
        verifyPayment();
      }, 30000); // 30 seconds
      setAutoVerifyInterval(interval);

      return () => clearInterval(interval);
    }
  }, [qrData?.paymentId, qrData?.status]);

  const generateQR = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await paymentAPI.generateQRCode(courseId);
      setQrData(response.data.data);
      setTimeLeft(response.data.data.expiresIn * 60); // Convert minutes to seconds
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể tạo mã QR. Vui lòng thử lại.');
      console.error('QR generation error:', err);
    } finally {
      setLoading(false);
    }
  };

  const verifyPayment = async () => {
    if (!qrData?.paymentId) return;
    
    setVerifying(true);
    try {
      const response = await paymentAPI.verifyQRPayment(qrData.paymentId);
      const newStatus = response.data.data.status;
      
      // Update status
      setQrData(prev => ({
        ...prev,
        status: newStatus
      }));

      // If payment completed, stop auto-verify and notify success
      if (newStatus === 'completed') {
        if (autoVerifyInterval) {
          clearInterval(autoVerifyInterval);
        }
        setTimeout(() => {
          onPaymentSuccess();
        }, 2000);
      }
    } catch (err) {
      console.error('Verification error:', err);
    } finally {
      setVerifying(false);
    }
  };

  const copyToClipboard = (text, fieldName) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatCurrency = (amount) => {
    return amount.toLocaleString('vi-VN') + ' VND';
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Đang tạo mã QR...</h3>
          <p className="text-gray-600">Vui lòng đợi trong giây lát</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Thanh toán qua QR Code</h2>
            <p className="text-gray-600">Quét mã để hoàn tất đăng ký khóa học</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {/* Course Info */}
          <div className="mb-6 p-4 bg-gray-50 rounded-xl">
            <h3 className="font-semibold text-gray-900 mb-2">{courseTitle}</h3>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Số tiền thanh toán:</span>
              <span className="text-2xl font-bold text-primary-600">{formatCurrency(amount)}</span>
            </div>
          </div>

          {/* QR Code */}
          <div className="text-center mb-6">
            {qrData?.qrCodeUrl ? (
              <div className="inline-block p-4 bg-white border-2 border-gray-200 rounded-xl">
                <img 
                  src={qrData.qrCodeUrl} 
                  alt="QR Code" 
                  className="w-64 h-64 mx-auto"
                />
                <p className="text-sm text-gray-500 mt-2">Quét mã bằng app ngân hàng</p>
              </div>
            ) : (
              <div className="py-12 text-center text-gray-500">
                <QrCode className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>Không thể tạo mã QR</p>
              </div>
            )}
          </div>

          {/* Status & Timer */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="font-medium">Trạng thái:</span>
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                qrData?.status === 'completed' ? 'bg-green-100 text-green-800' :
                qrData?.status === 'pending' ? 'bg-blue-100 text-blue-800' :
                'bg-red-100 text-red-800'
              }`}>
                {qrData?.status === 'completed' ? 'Đã thanh toán' :
                 qrData?.status === 'pending' ? 'Đang chờ' : 'Lỗi'}
              </div>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="font-medium">Thời gian còn lại:</span>
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4" />
                <span className={`font-mono ${timeLeft < 300 ? 'text-red-600 font-bold' : 'text-gray-700'}`}>
                  {formatTime(timeLeft)}
                </span>
              </div>
            </div>
          </div>

          {/* Bank Information */}
          <div className="mb-6">
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
              <Banknote className="w-5 h-5 mr-2" />
              Thông tin chuyển khoản
            </h4>
            <div className="space-y-2">
              {[
                { label: 'Ngân hàng', value: qrData?.bankDetails?.name },
                { label: 'Số tài khoản', value: qrData?.bankDetails?.accountNumber },
                { label: 'Chủ tài khoản', value: qrData?.bankDetails?.accountName },
                { label: 'Nội dung chuyển khoản', value: qrData?.note?.split('"')[1] || courseTitle },
                { label: 'Mã giao dịch', value: qrData?.transactionRef }
              ].map((item, index) => (
                item.value && (
                  <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-600">{item.label}:</span>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{item.value}</span>
                      <button
                        onClick={() => copyToClipboard(item.value, item.label)}
                        className="p-1 hover:bg-gray-200 rounded transition-colors"
                        title="Sao chép"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )
              ))}
            </div>
            {copied && (
              <p className="text-green-600 text-sm mt-2 flex items-center">
                <CheckCircle className="w-4 h-4 mr-1" /> Đã sao chép vào clipboard
              </p>
            )}
          </div>

          {/* Instructions */}
          <div className="mb-6">
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
              <Smartphone className="w-5 h-5 mr-2" />
              Hướng dẫn thanh toán
            </h4>
            <div className="space-y-2">
              {qrData?.instructions?.map((step, index) => (
                <div key={index} className="flex items-start p-3 bg-blue-50 rounded-lg">
                  <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3 flex-shrink-0">
                    {index + 1}
                  </span>
                  <span className="text-gray-700">{step}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl">
              <div className="flex items-start">
                <AlertCircle className="w-5 h-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
                <span className="text-red-800">{error}</span>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex space-x-3">
            <button
              onClick={verifyPayment}
              disabled={verifying || qrData?.status === 'completed'}
              className="flex-1 flex items-center justify-center py-3 px-4 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {verifying ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Đang kiểm tra...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Kiểm tra thanh toán
                </>
              )}
            </button>
            
            <button
              onClick={generateQR}
              className="flex-1 py-3 px-4 border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              Tạo mã mới
            </button>
          </div>

          {/* Manual Transfer Info */}
          <div className="mt-6 pt-6 border-t">
            <h5 className="font-medium text-gray-900 mb-2">Chuyển khoản thủ công</h5>
            {qrData?.manualTransfer?.map((line, index) => (
              <p key={index} className="text-sm text-gray-600">{line}</p>
            ))}
          </div>

          {/* Payment Success Message */}
          {qrData?.status === 'completed' && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-xl">
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                <span className="text-green-800 font-medium">
                  Thanh toán thành công! Khóa học sẽ được kích hoạt tự động.
                </span>
              </div>
              <p className="text-green-700 text-sm mt-1">
                Bạn sẽ được chuyển hướng đến khóa học trong 3 giây...
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QRPaymentModal;