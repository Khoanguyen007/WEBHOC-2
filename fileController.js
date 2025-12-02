const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');

// Configure AWS
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_S3_REGION,
});

// @desc    Generate presigned URL for file upload
// @route   POST /v2/files/upload-request
// @access  Private
const generatePresignedUrl = async (req, res, next) => {
  try {
    const { filename, contentType, fileSize } = req.body;

    // Basic validation
    if (!filename || !contentType) {
      return res.status(400).json({
        statusCode: 400,
        message: 'Filename and content type are required'
      });
    }

    // File size validation (5MB max)
    const MAX_FILE_SIZE = 5 * 1024 * 1024;
    if (fileSize > MAX_FILE_SIZE) {
      return res.status(400).json({
        statusCode: 400,
        message: 'File size must be less than 5MB'
      });
    }

    // Allowed file types
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
    if (!allowedTypes.includes(contentType)) {
      return res.status(400).json({
        statusCode: 400,
        message: 'File type not allowed'
      });
    }

    const fileExtension = filename.split('.').pop();
    const uniqueFileName = `${uuidv4()}.${fileExtension}`;
    const s3Key = `uploads/${req.user.id}/${uniqueFileName}`;

    const params = {
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: s3Key,
      Expires: 60, // 60 seconds
      ContentType: contentType,
      ACL: 'public-read'
    };

    const uploadUrl = await s3.getSignedUrlPromise('putObject', params);
    const fileUrl = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_S3_REGION}.amazonaws.com/${s3Key}`;

    res.json({
      uploadUrl,
      fileUrl,
      key: s3Key
    });

  } catch (error) {
    next(error);
  }
};

module.exports = {
  generatePresignedUrl
};