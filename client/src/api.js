const API_URL = '/api';

let token = localStorage.getItem('token');
let user = JSON.parse(localStorage.getItem('user') || 'null');

export function getAuth() {
  return { token, user };
}

export function setAuth(newToken, newUser) {
  token = newToken;
  user = newUser;
  localStorage.setItem('token', newToken);
  localStorage.setItem('user', JSON.stringify(newUser));
}

export function clearAuth() {
  token = null;
  user = null;
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}

async function apiFetch(endpoint, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${API_URL}${endpoint}`, { ...options, headers });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || 'Request failed');
  }
  return response.json();
}

export const signup = (email, password) => apiFetch('/auth/signup', { method: 'POST', body: JSON.stringify({ email, password }) });
export const login = (email, password) => apiFetch('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
export const requestGallery = () => apiFetch('/client/request-gallery', { method: 'POST' });
export const getClientGalleries = () => apiFetch('/client/galleries');
export const getGalleryImages = (galleryId) => apiFetch(`/client/galleries/${galleryId}/images`);
export const toggleFavorite = (imageId) => apiFetch(`/client/favorites/${imageId}`, { method: 'POST' });
export const toggleSelection = (imageId) => apiFetch(`/client/selections/${imageId}`, { method: 'POST' });
export const requestHighRes = (imageIds) => apiFetch('/client/request-highres', { method: 'POST', body: JSON.stringify({ imageIds }) });
export const getClientRequests = () => apiFetch('/client/requests');
export const getAdminGalleries = () => apiFetch('/admin/galleries');
export const createGallery = (name, description) => apiFetch('/admin/galleries', { method: 'POST', body: JSON.stringify({ name, description }) });
export const getClients = () => apiFetch('/admin/clients');
export const assignGallery = (clientId, galleryId) => apiFetch('/admin/assign-gallery', { method: 'POST', body: JSON.stringify({ clientId, galleryId }) });
export const getGalleryRequests = () => apiFetch('/admin/gallery-requests');
export const updateGalleryRequestStatus = (id, status) => apiFetch(`/admin/gallery-requests/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) });
export const getHighResRequests = () => apiFetch('/admin/highres-requests');
export const updateHighResRequestStatus = (id, status) => apiFetch(`/admin/highres-requests/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) });
export const getAdmins = () => apiFetch('/admin/admins');
export const createAdmin = (email, password) => apiFetch('/admin/admins', { method: 'POST', body: JSON.stringify({ email, password }) });
export const deleteAdmin = (id) => apiFetch(`/admin/admins/${id}`, { method: 'DELETE' });

export async function uploadImages(galleryId, files) {
  const formData = new FormData();
  for (const file of files) formData.append('images', file);
  const response = await fetch(`${API_URL}/media/upload/${galleryId}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData
  });
  if (!response.ok) throw new Error('Upload failed');
  return response.json();
}

export async function downloadImage(imageId) {
  try {
    const response = await fetch(`${API_URL}/client/download/${imageId}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!response.ok) {
      throw new Error('Download failed');
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `daperfect-highres-${imageId}.jpg`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  } catch (err) {
    console.error('Download error:', err);
    throw err;
  }
}