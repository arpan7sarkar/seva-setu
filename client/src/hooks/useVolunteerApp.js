/* useVolunteerApp.js - FINAL STABILIZED VERSION */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  checkInTaskById,
  completeTaskById,
  fetchMyTasks,
  fetchMyVolunteerStats,
  updateAvailability,
  updateMyLocation,
} from '../services/volunteer';
import { useAuth } from './useAuth';

const toRadians = (deg) => (deg * Math.PI) / 180;

export const haversineKm = (a, b) => {
  if (!a || !b || a.lat === undefined || b.lat === undefined) return 0;
  const R = 6371;
  const dLat = toRadians(Number(b.lat) - Number(a.lat));
  const dLon = toRadians(Number(b.lng) - Number(a.lng));
  const lat1 = toRadians(Number(a.lat));
  const lat2 = toRadians(Number(b.lat));
  const h = Math.sin(dLat / 2) ** 2 +
            Math.sin(dLon / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
};

export const useVolunteerApp = () => {
  const { currentUser } = useAuth();
  const userId = currentUser?.id;

  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState(null);
  const [availability, setAvailability] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyTaskId, setBusyTaskId] = useState('');
  const [toast, setToast] = useState(null);
  const [volunteerCoords, setVolunteerCoords] = useState(null);

  const gpsLocked = useRef(false);
  const initialLoadDone = useRef(false);
  const syncingAvailabilityRef = useRef(false);
  const lastUpdatePos = useRef(null);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type, id: Date.now() });
  }, []);

  const loadData = useCallback(async () => {
    if (!initialLoadDone.current) setLoading(true);
    try {
      const [tasksData, statsData] = await Promise.all([fetchMyTasks(), fetchMyVolunteerStats()]);
      setTasks(Array.isArray(tasksData) ? tasksData : []);
      setStats(statsData || null);
      
      // LOGIC: Only use server coords if GPS hasn't locked AND we have absolutely no state yet
      if (!gpsLocked.current && !initialLoadDone.current && tasksData?.[0]) {
        const task = tasksData[0];
        if (task.volunteer_lat !== null && task.volunteer_lng !== null) {
          console.log('[GPS] Using server coordinates for initial placement');
          setVolunteerCoords({
            lat: Number(task.volunteer_lat),
            lng: Number(task.volunteer_lng),
            heading: null,
            accuracy: 0,
          });
        }
      }
      
      if (!syncingAvailabilityRef.current) setAvailability(Boolean(statsData?.isAvailable ?? true));
      initialLoadDone.current = true;
    } catch (err) {
      setError('Unable to load volunteer workspace.');
    } finally {
      setLoading(false);
    }
  }, []); // REMOVED [volunteerCoords] to stop state battles

  const pushCurrentLocation = useCallback(async () => {
    if (!navigator.geolocation) return null;

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const { latitude, longitude, heading, accuracy } = pos.coords;
          console.log(`[GPS-LOG] Raw coords: lat=${latitude}, lng=${longitude}, accuracy=${accuracy}m`);

          // Filter out low-accuracy (often IP-based) coordinates
          if (accuracy && accuracy > 1000) {
            console.warn(`[GPS] Accuracy extremely low: ${accuracy}m. Skipping.`);
            return resolve(null);
          }

          const newCoords = { lat: latitude, lng: longitude, heading, accuracy };

          // JITTER FILTER: Ignore shifts smaller than 10 meters (reduced from 15)
          if (lastUpdatePos.current) {
            const drift = haversineKm(newCoords, lastUpdatePos.current);
            if (drift < 0.010) return resolve(lastUpdatePos.current);
          }

          lastUpdatePos.current = newCoords;
          gpsLocked.current = true; // LOCK GPS: stop server poll from overwriting location
          setVolunteerCoords(newCoords);
          await updateMyLocation(newCoords).catch((e) => console.error('[GPS] Update failed:', e));
          resolve(newCoords);
        },
        (err) => {
          console.warn('[GPS] Geolocation error:', err.message);
          resolve(null);
        },
        { enableHighAccuracy: true, timeout: 15000 }
      );
    });
  }, []);

  const toggleAvailability = useCallback(async () => {
    const next = !availability;
    setAvailability(next);
    syncingAvailabilityRef.current = true;
    try {
      await updateAvailability(next);
      showToast(next ? 'Availability ON' : 'Availability OFF');
    } catch (err) {
      setAvailability(!next);
      showToast('Update failed.', 'error');
    } finally {
      setTimeout(() => { syncingAvailabilityRef.current = false; }, 2000);
    }
  }, [availability, showToast]);

  const checkInTask = useCallback(async (task) => {
    try {
      setBusyTaskId(task.task_id);
      const coords = await pushCurrentLocation();
      await checkInTaskById(task.task_id, coords);
      showToast('Checked in.');
      await loadData();
    } catch (err) {
      showToast('Check-in failed.', 'error');
    } finally {
      setBusyTaskId('');
    }
  }, [loadData, pushCurrentLocation, showToast]);

  const completeTask = useCallback(async (task, imageFile) => {
    try {
      setBusyTaskId(task.task_id);
      await completeTaskById(task.task_id, imageFile, volunteerCoords);
      showToast('Task completed!');
      await loadData();
    } catch (err) {
      showToast('Verification failed.', 'error');
      throw err; // RE-THROW so VolunteerPage can show detailed errors
    } finally {
      setBusyTaskId('');
    }
  }, [loadData, showToast, volunteerCoords]);

  const distanceCoveredKm = useMemo(() => {
    // Priority: Real-time sum from backend stats
    if (stats?.totalDistanceCovered !== undefined && stats?.totalDistanceCovered !== null) {
      return Number(stats.totalDistanceCovered);
    }
    
    // Fallback: Calculate from currently loaded tasks
    const completed = tasks.filter((t) => t.task_status === 'completed' && t.lat && t.lng);
    let total = 0;
    completed.forEach(t => {
      if (t.check_in_lat && t.check_in_lng) {
        const d = haversineKm({ lat: t.check_in_lat, lng: t.check_in_lng }, { lat: t.lat, lng: t.lng });
        if (d < 300) total += d;
      }
    });
    return total;
  }, [stats, tasks]);

  const activeTasks = useMemo(() => 
    tasks.filter(t => t.task_status !== 'completed'),
    [tasks]
  );

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, [loadData]);

  useEffect(() => {
    if (!availability && activeTasks.length === 0) return;
    pushCurrentLocation();
    const interval = setInterval(pushCurrentLocation, 5000);
    return () => clearInterval(interval);
  }, [availability, activeTasks.length, pushCurrentLocation]);

  return { 
    loading, 
    error, 
    tasks, 
    stats, 
    availability, 
    busyTaskId, 
    distanceCoveredKm, 
    activeTasks, 
    toggleAvailability, 
    checkInTask, 
    completeTask, 
    toast, 
    volunteerCoords 
  };
};