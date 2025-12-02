const axios = require('axios');

class VietQRService {
  constructor() {
    this.merchantInfo = {
      accountNumber: process.env.VIETQR_ACCOUNT_NUMBER || '0819572109',
      accountName: process.env.VIETQR_ACCOUNT_NAME || 'WEBHOC LEARNING',
      bankCode: 'MB',
      template: 'compact'
    };
  }

  /**
   * Generate QR string cho MB Bank
   */
  generateQRString(amount, transactionRef, description) {
    const bank = this.merchantInfo;
    const amountFormatted = Math.floor(amount);
    const descriptionEncoded = encodeURIComponent(description || `WEBHOC${transactionRef}`);
    
    return `https://img.vietqr.io/image/${bank.bankCode}-${bank.accountNumber}-${bank.template}.jpg?amount=${amountFormatted}&addInfo=${descriptionEncoded}&accountName=${encodeURIComponent(bank.accountName)}`;
  }

  /**
   * Lấy tên ngân hàng
   */
  getBankName() {
    return 'Ngân hàng Quân đội (MB Bank)';
  }

  /**
   * Tạo hướng dẫn thanh toán
   */
  getPaymentInstructions(transactionRef, amount, courseTitle) {
    return {
      instructions: [
        'Mở ứng dụng MB Bank trên điện thoại',
        'Chọn "Quét mã QR" hoặc "Scan QR Code"',
        'Hướng camera về mã QR trên màn hình',
        `Kiểm tra số tiền: ${amount.toLocaleString('vi-VN')} VND`,
        `Kiểm tra nội dung: "${courseTitle}"`,
        'Xác nhận thanh toán'
      ],
      manualTransfer: [
        `STK: ${this.merchantInfo.accountNumber}`,
        `Chủ TK: ${this.merchantInfo.accountName}`,
        `Ngân hàng: ${this.getBankName()}`,
        `Số tiền: ${amount.toLocaleString('vi-VN')} VND`,
        `Nội dung: "${courseTitle}"`
      ],
      importantNotes: [
        'Chỉ sử dụng ứng dụng MB Bank để quét mã',
        'Không thay đổi nội dung chuyển khoản',
        'Lưu mã giao dịch để tra cứu',
        'Liên hệ hỗ trợ nếu có vấn đề'
      ]
    };
  }
}

module.exports = new VietQRService();