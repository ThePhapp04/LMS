const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

/**
 * Upload a buffer/stream to Supabase Storage
 * @param {Buffer} buffer - File data
 * @param {string} bucket - Bucket name (e.g. 'lesson-files', 'avatars')
 * @param {string} filePath - Path inside bucket (e.g. 'lesson-1234.pptx')
 * @param {string} mimeType - MIME type
 * @returns {string} Public URL
 */
async function uploadToStorage(buffer, bucket, filePath, mimeType) {
  const { error } = await supabase.storage
    .from(bucket)
    .upload(filePath, buffer, {
      contentType: mimeType,
      upsert: true,
    });

  if (error) throw new Error(`Storage upload failed: ${error.message}`);

  const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
  return data.publicUrl;
}

/**
 * Delete a file from Supabase Storage
 * @param {string} bucket
 * @param {string} filePath - Path inside bucket
 */
async function deleteFromStorage(bucket, filePath) {
  await supabase.storage.from(bucket).remove([filePath]);
}

module.exports = { uploadToStorage, deleteFromStorage };
