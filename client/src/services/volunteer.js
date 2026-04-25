import api from './api';

export const fetchMyTasks = async () => {
  const { data } = await api.get('/tasks/my');
  return data;
};

export const fetchMyVolunteerStats = async () => {
  const { data } = await api.get('/volunteers/me/stats');
  return data;
};

export const updateAvailability = async (isAvailable) => {
  const { data } = await api.patch('/volunteers/me/availability', {
    is_available: isAvailable,
  });
  return data;
};

export const updateMyLocation = async ({ lat, lng }) => {
  const { data } = await api.patch('/volunteers/me/location', { lat, lng });
  return data;
};

export const checkInTaskById = async (taskId, coords) => {
  const { data } = await api.patch(`/tasks/${taskId}/checkin`, coords);
  return data;
};

export const completeTaskById = async (taskId, imageFile) => {
  if (imageFile) {
    const formData = new FormData();
    formData.append('image', imageFile);
    const { data } = await api.patch(`/tasks/${taskId}/complete`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  }
  const { data } = await api.patch(`/tasks/${taskId}/complete`);
  return data;
};
