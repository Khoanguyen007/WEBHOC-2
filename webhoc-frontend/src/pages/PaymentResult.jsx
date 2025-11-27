import React, { useEffect, useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, ArrowRight, RefreshCw, Home, Loader, Download } from 'lucide-react';
import { paymentAPI } from '../services/api';

const PaymentResult = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [invoiceUrl, setInvoiceUrl] = useState(null);
  const [enrollmentId, setEnrollmentId] = useState(null);
  const [paymentIdForInvoice, setPaymentIdForInvoice] = useState(null);
  
  const status = searchParams.get('status');
  const sessionId = searchParams.get('session_id');
  const paymentId = searchParams.get('paypalPaymentId');
  const payerId = searchParams.get('PayerID');

  // Handle PayPal payment execution
  useEffect(() => {
    const executePayPal = async () => {
      if (status === 'success' && paymentId && payerId) {
        setLoading(true);
        try {
          const response = await paymentAPI.executePayPalPayment(paymentId, payerId);
          setEnrollmentId(response.data?.enrollmentId);
          setPaymentIdForInvoice(paymentId);
          
          // Wait a bit for invoice to be generated, then fetch it
          setTimeout(async () => {
            try {
              const invoiceResponse = await paymentAPI.getInvoiceUrl(paymentId);
              setInvoiceUrl(invoiceResponse.data?.downloadUrl);
            } catch (err) {
              console.log('Invoice not yet available (will retry on page)');
            }
          }, 1000);
        } catch (err) {
          console.error('PayPal execution error:', err);
          setError('Lỗi xác nhận thanh toán. Vui lòng liên hệ hỗ trợ.');
        } finally {
          setLoading(false);
        }
      }
    };
    
    executePayPal();
  }, [paymentId, payerId, status]);

  useEffect(() => {
    if (!status) {
      navigate('/');
    }
  }, [status, navigate]);

  // Fetch invoice URL for completed payments
  useEffect(() => {
    const fetchInvoice = async () => {
      if (status === 'success' && sessionId && !invoiceUrl) {
        try {
          // For Stripe payments, sessionId is used as paymentId in some cases
          // Try to get invoice using session ID
          const response = await paymentAPI.getInvoiceUrl(sessionId);
          setInvoiceUrl(response.data?.downloadUrl);
        } catch (err) {
          console.log('Invoice not yet available (will be emailed to you)');
        }
      }
    };
    
    // Small delay to allow invoice generation
    const timer = setTimeout(() => {
      fetchInvoice();
    }, 2000);
    
    return () => clearTimeout(timer);
  }, [status, sessionId, invoiceUrl]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-12 px-4 shadow-xl rounded-2xl sm:px-10 text-center border border-gray-200">
          {loading ? (
            <>
              <div className="mx-auto flex items-center justify-center h-24 w-24 rounded-full bg-blue-100 mb-6 shadow-lg">
                <Loader className="h-12 w-12 text-blue-600 animate-spin" />
              </div>
              <h2 className="text-3xl font-extrabold text-gray-900 mb-2">Đang xác nhận thanh toán...</h2>
              <p className="text-gray-500">Vui lòng đợi trong khi chúng tôi xác nhận giao dịch của bạn</p>
            </>
          ) : status === 'success' && !error ? (
            <>
              <div className="mx-auto flex items-center justify-center h-24 w-24 rounded-full bg-green-100 mb-6 shadow-lg">
                <CheckCircle className="h-12 w-12 text-green-600" />
              </div>
              
              <h2 className="text-3xl font-extrabold text-gray-900 mb-2">Thanh toán thành công!</h2>
              <p className="text-gray-600 mb-2 font-medium text-lg">Chúc mừng bạn!</p>
              <p className="text-gray-500 mb-8">
                Bạn đã đăng ký khóa học thành công. Bây giờ hãy bắt đầu hành trình học tập của bạn!
              </p>
              
              {(sessionId || paymentId) && (
                <div className="mb-6 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-xs text-gray-600">ID Giao dịch:</p>
                  <p className="text-sm font-mono text-gray-700 break-all">{sessionId || paymentId}</p>
                </div>
              )}

              <div className="space-y-3">
                <Link 
                  to="/dashboard" 
                  className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-md text-sm font-bold text-white bg-primary-600 hover:bg-primary-700 transition-all hover:shadow-lg"
                >
                  <ArrowRight className="w-4 h-4 mr-2" />
                  Vào Dashboard học tập
                </Link>
                
                {invoiceUrl && (
                  <a 
                    href={invoiceUrl} 
                    download
                    className="w-full flex justify-center items-center py-3 px-4 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Tải Hoá đơn
                  </a>
                )}
                
                <Link 
                  to="/courses"
                  className="w-full flex justify-center items-center py-3 px-4 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Xem thêm khóa học khác
                </Link>
                <Link 
                  to="/"
                  className="w-full flex justify-center items-center py-3 px-4 text-sm font-medium text-gray-600 hover:text-primary-600 transition-colors"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Về trang chủ
                </Link>
              </div>

              <div className="mt-6 pt-6 border-t text-xs text-gray-500 space-y-1">
                <p>✓ Truy cập khóa học ngay lập tức</p>
                <p>✓ Hoá đơn đã được gửi tới email của bạn</p>
                <p>✓ Hỗ trợ trọn đời</p>
              </div>
            </>
          ) : (
            <>
              <div className="mx-auto flex items-center justify-center h-24 w-24 rounded-full bg-red-100 mb-6 shadow-lg">
                <XCircle className="h-12 w-12 text-red-600" />
              </div>
              
              <h2 className="text-3xl font-extrabold text-gray-900 mb-2">{error ? 'Lỗi xác nhận thanh toán' : 'Thanh toán thất bại'}</h2>
              <p className="text-gray-500 mb-8">
                {error || 'Giao dịch đã bị hủy hoặc xảy ra lỗi trong quá trình xử lý. Không có khoản tiền nào được trừ từ tài khoản của bạn.'}
              </p>

              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-red-800">
                  {error ? 'Vui lòng liên hệ với bộ phận hỗ trợ để giải quyết vấn đề này.' : 'Vui lòng kiểm tra thông tin thẻ tín dụng của bạn và thử lại. Nếu vấn đề tiếp tục, vui lòng liên hệ với bộ phận hỗ trợ.'}
                </p>
              </div>

              <div className="flex flex-col gap-3">
                <button 
                  onClick={() => navigate(-1)}
                  className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-md text-sm font-bold text-white bg-primary-600 hover:bg-primary-700 transition-all hover:shadow-lg"
                >
                  <RefreshCw className="w-4 h-4 mr-2" /> 
                  Thử lại
                </button>
                <Link 
                  to="/courses" 
                  className="w-full flex justify-center items-center py-3 px-4 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                >
                  Về danh sách khóa học
                </Link>
                <Link 
                  to="/"
                  className="w-full flex justify-center items-center py-3 px-4 text-sm font-medium text-gray-600 hover:text-primary-600 transition-colors"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Về trang chủ
                </Link>
              </div>

              <div className="mt-6 pt-6 border-t text-xs text-gray-600">
                <p className="font-medium mb-2">Cần trợ giúp?</p>
                <p>Liên hệ: <a href="mailto:support@webhoc.com" className="text-primary-600 hover:underline">support@webhoc.com</a></p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentResult;