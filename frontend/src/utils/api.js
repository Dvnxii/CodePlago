import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

export const createCheck = (formData, onProgress) =>
  api.post('/checks', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: onProgress
  });

export const getChecks = () => api.get('/checks');
export const getCheck = (id) => api.get(`/checks/${id}`);
export const deleteCheck = (id) => api.delete(`/checks/${id}`);
export const getComparison = (checkId, fileAId, fileBId) =>
  api.get(`/checks/${checkId}/compare/${fileAId}/${fileBId}`);

export default api;
