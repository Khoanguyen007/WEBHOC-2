import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CreditCard, Lock, CheckCircle, AlertCircle, BookOpen, ArrowLeft } from 'lucide-react';
import { courseAPI, paymentAPI } from '../services/api';
import { useAuth } from '../hooks/useAuth';

const Checkout = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [discountCode, setDiscountCode] = useState('');
  const [discountApplied, setDiscountApplied] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('stripe'); // 'stripe' or 'paypal'

  // Fetch course details
  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const response = await courseAPI.getCourse(courseId);
        setCourse(response.data);
      } catch (err) {
        setError('Không thể tải thông tin khóa học.');
        setTimeout(() => navigate('/courses'), 3000);
      } finally {
        setLoading(false);
      }
    };
    fetchCourse();
  }, [courseId, navigate]);

  // Handle payment processing
  const handlePayment = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    setProcessing(true);
    setError('');
    try {
      if (paymentMethod === 'stripe') {
        const response = await paymentAPI.createCheckoutSession(courseId);
        const { checkoutUrl } = response.data;
        
        if (checkoutUrl) {
          window.location.href = checkoutUrl;
        } else {
          navigate('/payment-result?status=success');
        }
      } else if (paymentMethod === 'paypal') {
        const response = await paymentAPI.createPayPalCheckout(courseId);
        const { approvalUrl } = response.data;
        
        if (approvalUrl) {
          window.location.href = approvalUrl;
        } else {
          navigate('/payment-result?status=success');
        }
      }
    } catch (err) {
      console.error('Payment error:', err);
      const message = err.response?.data?.message || 'Lỗi khởi tạo thanh toán. Vui lòng thử lại.';
      setError(message);
    } finally {
      setProcessing(false);
    }
  };

  // Calculate price with discount
  const calculatePrice = () => {
    if (!course) return 0;
    const basePrice = course.priceCents / 100;
    const discount = discountApplied ? basePrice * 0.2 : 0;
    return (basePrice - discount).toFixed(2);
  };

  const handleApplyDiscount = () => {
    if (discountCode.toUpperCase() === 'WELCOME20') {
      setDiscountApplied(true);
      setError('');
    } else {
      setError('Mã giảm giá không hợp lệ.');
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Đang tải thông tin khóa học...</p>
      </div>
    </div>
  );

  if (!course) return null;

  const finalPrice = calculatePrice();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4">
      <div className="container mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-primary-600 hover:text-primary-700 transition-colors font-medium"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Quay lại
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Xác nhận thanh toán</h1>
          <div></div>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Left Column: Course Details */}
          <div className="md:col-span-2 space-y-6">
            {/* Course Info Card */}
            <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow">
              <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <BookOpen className="w-5 h-5 mr-2 text-primary-600" />
                Chi tiết khóa học
              </h2>
              <div className="flex gap-4">
                <img 
                  src={course.coverImageUrl || 'https://via.placeholder.com/150'} 
                  alt={course.title} 
                  className="w-32 h-32 object-cover rounded-lg flex-shrink-0 shadow-sm"
                />
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 text-lg">{course.title}</h3>
                  <p className="text-gray-600 text-sm mt-2 line-clamp-3">{course.description}</p>
                  <div className="mt-4 flex items-center gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Giảng viên</p>
                      <p className="font-medium text-gray-900">{course.instructorId?.displayName || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Thời lượng</p>
                      <p className="font-medium text-gray-900">{course.totalLessons || '?'} bài</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Security Card */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
              <div className="flex gap-3">
                <Lock className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-blue-900 mb-1">Thanh toán an toàn</h3>
                  <p className="text-sm text-blue-800">
                    Giao dịch được bảo vệ bằng mã hóa SSL 256-bit. Chúng tôi sử dụng Stripe để xử lý thanh toán an toàn. 
                    Thông tin thẻ không được lưu trữ trên máy chủ của chúng tôi.
                  </p>
                </div>
              </div>
            </div>

            {/* Discount Code Card */}
            <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Mã giảm giá</h2>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Nhập mã giảm giá (VD: WELCOME20)"
                  value={discountCode}
                  onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
                  disabled={discountApplied}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
                <button
                  onClick={handleApplyDiscount}
                  disabled={discountApplied || !discountCode}
                  className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  {discountApplied ? '✓ Áp dụng' : 'Áp dụng'}
                </button>
              </div>
              {discountApplied && (
                <p className="text-sm text-green-600 mt-2 flex items-center">
                  <CheckCircle className="w-4 h-4 mr-1" /> Mã giảm giá hợp lệ - Được giảm 20%
                </p>
              )}
            </div>

            {/* Payment Method Selection Card */}
            <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Chọn phương thức thanh toán</h2>
              <div className="space-y-3">
                <label className="flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all" style={{borderColor: paymentMethod === 'stripe' ? '#3b82f6' : '#e5e7eb', backgroundColor: paymentMethod === 'stripe' ? '#eff6ff' : 'white'}}>
                  <input
                    type="radio"
                    name="payment"
                    value="stripe"
                    checked={paymentMethod === 'stripe'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-4 h-4 text-primary-600"
                  />
                  <span className="ml-3 flex-1">
                    <span className="block font-medium text-gray-900">Thẻ tín dụng / Debit (Stripe)</span>
                    <span className="block text-sm text-gray-500">Visa, Mastercard, American Express</span>
                  </span>
                  <CreditCard className="w-5 h-5 text-gray-400" />
                </label>
                
                <label className="flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all" style={{borderColor: paymentMethod === 'paypal' ? '#3b82f6' : '#e5e7eb', backgroundColor: paymentMethod === 'paypal' ? '#eff6ff' : 'white'}}>
                  <input
                    type="radio"
                    name="payment"
                    value="paypal"
                    checked={paymentMethod === 'paypal'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-4 h-4 text-primary-600"
                  />
                  <span className="ml-3 flex-1">
                    <span className="block font-medium text-gray-900">PayPal</span>
                    <span className="block text-sm text-gray-500">Thanh toán an toàn với tài khoản PayPal của bạn</span>
                  </span>
                  <div className="text-xs font-bold text-blue-600">PayPal</div>
                </label>
              </div>
            </div>
          </div>

          {/* Right Column: Order Summary & Payment Button */}
          <div className="md:col-span-1">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 sticky top-24">
              <h2 className="text-lg font-bold text-gray-900 mb-6 border-b pb-3">Tóm tắt đơn hàng</h2>
              
              <div className="space-y-4 mb-6">
                <div className="flex justify-between text-gray-600">
                  <span>Giá gốc</span>
                  <span className={discountApplied ? 'line-through' : ''}>${(course.priceCents / 100).toFixed(2)}</span>
                </div>
                {discountApplied && (
                  <div className="flex justify-between text-green-600 font-medium">
                    <span>Giảm giá (20%)</span>
                    <span>-${((course.priceCents / 100) * 0.2).toFixed(2)}</span>
                  </div>
                )}
                <div className="border-t pt-4 flex justify-between items-center">
                  <span className="font-bold text-gray-900">Tổng thanh toán</span>
                  <span className="text-3xl font-bold text-primary-600">${finalPrice}</span>
                </div>
              </div>

              {error && (
                <div className="mb-4 p-4 bg-red-50 text-red-700 text-sm rounded-lg flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <button
                onClick={handlePayment}
                disabled={processing}
                className="w-full bg-primary-600 text-white py-3.5 rounded-lg font-bold hover:bg-primary-700 focus:outline-none focus:ring-4 focus:ring-primary-200 disabled:opacity-60 disabled:cursor-not-allowed transition-all flex justify-center items-center"
              >
                {processing ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-5 h-5 mr-2" />
                    {paymentMethod === 'stripe' ? 'Thanh toán qua Stripe' : 'Thanh toán qua PayPal'}
                  </>
                )}
              </button>

              <div className="mt-6 pt-6 border-t space-y-3 text-xs text-gray-600">
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>Đảm bảo hoàn tiền trong 7 ngày</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>Truy cập ngay sau khi thanh toán</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>Hỗ trợ trọn đời</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;