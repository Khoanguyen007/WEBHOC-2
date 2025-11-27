const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const sendWelcomeEmail = async (user) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: user.email,
    subject: 'Welcome to WEBHOC!',
    html: `
      <h1>Welcome to WEBHOC, ${user.displayName}!</h1>
      <p>Thank you for joining our learning platform.</p>
    `
  };

  await transporter.sendMail(mailOptions);
};

const sendPaymentConfirmation = async (user, course) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: user.email,
    subject: 'Payment Confirmation - WEBHOC',
    html: `
      <h1>Payment Successful!</h1>
      <p>You have successfully enrolled in "${course.title}"</p>
    `
  };

  await transporter.sendMail(mailOptions);
};

const sendVerificationEmail = async (user, token) => {
  const verifyUrl = `${process.env.CLIENT_URL}/verify-email?token=${token}`;
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: user.email,
    subject: 'Xác thực email - WEBHOC',
    html: `
      <h2>Xin chào ${user.displayName},</h2>
      <p>Cảm ơn bạn đã đăng ký WEBHOC. Vui lòng xác nhận email của bạn bằng cách nhấn vào nút bên dưới:</p>
      <p><a href="${verifyUrl}" style="display:inline-block;padding:10px 16px;background:#2563EB;color:#fff;border-radius:6px;text-decoration:none">Xác thực email</a></p>
      <p>Nếu bạn không tạo tài khoản này, hãy bỏ qua email này.</p>
    `
  };

  await transporter.sendMail(mailOptions);
};

module.exports = { sendWelcomeEmail, sendPaymentConfirmation, sendVerificationEmail };