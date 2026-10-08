export const toFileDto = (f) => ({
  id: f.id,
  user_id: f.userId,
  file_url: f.fileUrl,
  file_type: f.fileType,
  file_size: f.fileSize,
  bucket_path: f.bucketPath,
  created_at: f.createdAt,
});

export const toUploadDto = (f) => ({
  url: f.fileUrl,
  file_id: f.id,
  file_type: f.fileType,
  file_size: f.fileSize,
});
