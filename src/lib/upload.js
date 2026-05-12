import axios from 'axios';

/**
 * Uploads a file to the backend and returns the public URL.
 * @param {File} file The file from the input[type=file]
 * @returns {Promise<string>} The public URL of the uploaded file
 */
export const uploadFile = async (file) => {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await axios.post('/api/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });

    return response.data.publicUrl;
  } catch (error) {
    console.error('Upload Error:', error);
    throw new Error(error.response?.data?.error || 'Failed to uplink media to storage.');
  }
};
