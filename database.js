const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    
    // Create indexes for better performance
    await mongoose.connection.collection('enrollments').createIndex({ userId: 1, courseId: 1 }, { unique: true });
    await mongoose.connection.collection('courses').createIndex({ instructorId: 1 });
    await mongoose.connection.collection('payments').createIndex({ enrollmentId: 1 });
    
  } catch (error) {
    console.error('❌ Database connection error:', error);
    process.exit(1);
  }
};

module.exports = connectDB;