/* VOLUNTEER PAGE VERSION: 2.1 - ROBUST MAP LOADING */
import { useState, useRef } from 'react';
import exifr from 'exifr';
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  MapPin,
  ShieldCheck,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  X,
  Navigation,
} from 'lucide-react';
import MainLayout from '../layouts/MainLayout';
import { useVolunteerApp, haversineKm } from '../hooks/useVolunteerApp';
import { volunteerStatusClass, volunteerStatusLabel } from '../utils/volunteer';
import CameraWatermark from '../components/CameraWatermark';
import VolunteerTaskMap from '../components/VolunteerTaskMap';

const VolunteerPage = () => {
  const [activeCameraTask, setActiveCameraTask] = useState(null);
  const {
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
    volunteerCoords,
  } = useVolunteerApp();

  const [selectedFiles, setSelectedFiles] = useState({}); // { taskId: { file, preview } }
  const [verificationErrors, setVerificationErrors] = useState({}); // { taskId: message }

  const handleFileChange = async (taskId, file, hasGps) => {
    if (!file) return;
    
    // If hasGps was explicitly passed from Camera, use it. Otherwise check EXIF.
    let gpsStatus = hasGps;
    if (gpsStatus === undefined) {
      try {
        const gps = await exifr.gps(file);
        gpsStatus = !!(gps && gps.latitude && gps.longitude);
      } catch (e) {
        console.warn('EXIF read error:', e);
        gpsStatus = false;
      }
    }

    setSelectedFiles(prev => {
      if (prev[taskId]?.preview) {
        URL.revokeObjectURL(prev[taskId].preview);
      }
      const preview = URL.createObjectURL(file);
      return {
        ...prev,
        [taskId]: { file, preview, hasGps: gpsStatus }
      };
    });
    
    setVerificationErrors(prev => {
      const next = { ...prev };
      delete next[taskId];
      return next;
    });
  };

  const onCompleteMission = async (task, file) => {
    try {
      await completeTask(task, file);
      setSelectedFiles(prev => {
        if (prev[task.task_id]?.preview) URL.revokeObjectURL(prev[task.task_id].preview);
        const next = { ...prev };
        delete next[task.task_id];
        return next;
      });
      setVerificationErrors(prev => {
        const next = { ...prev };
        delete next[task.task_id];
        return next;
      });
    } catch (err) {
      const errorsArray = err.response?.data?.errors;
      const statusSummary = err.response?.data?.statusSummary;
      const fallbackMsg = err.response?.data?.details || err.response?.data?.message || 'Verification failed.';
      setVerificationErrors(prev => ({
        ...prev,
        [task.task_id]: {
          errors: errorsArray && errorsArray.length > 0 ? errorsArray : [fallbackMsg],
          summary: statusSummary || null
        }
      }));
    }
  };

  return (
    <MainLayout>
      <div className="container-lg volunteer-shell">
        <section className="volunteer-hero card">
          <p className="landing-eyebrow">Volunteer Workspace v2.1</p>
          <h1 className="volunteer-title">Mobile mission console for field execution.</h1>
          <p className="volunteer-subtitle">
            Stay available, check in at incident sites, and close tasks with live status sync.
          </p>
        </section>

        <section className="volunteer-stats-grid">
          <article className="volunteer-stat card">
            <p className="volunteer-stat-label">Tasks Completed</p>
            <p className="volunteer-stat-value">{stats?.tasksCompleted ?? 0}</p>
          </article>
          <article className="volunteer-stat card">
            <p className="volunteer-stat-label">Completion Rate</p>
            <p className="volunteer-stat-value">{Math.round((stats?.completionRate ?? 0) * 100)}%</p>
          </article>
          <article className="volunteer-stat card">
            <p className="volunteer-stat-label">Distance Covered</p>
            <p className="volunteer-stat-value">{distanceCoveredKm.toFixed(2)} km</p>
          </article>
        </section>

        <section className="card volunteer-availability">
          <div>
            <p className="volunteer-stat-label">Availability</p>
            <p className="text-sm text-text-secondary mt-1">
              {availability ? 'You are available for new assignments' : 'You are currently unavailable'}
            </p>
          </div>
          <button type="button" className="volunteer-toggle-btn" onClick={toggleAvailability}>
            {availability ? <ToggleRight className="w-5 h-5 text-accent-green" /> : <ToggleLeft className="w-5 h-5" />}
            {availability ? 'ON' : 'OFF'}
          </button>
        </section>

        {loading ? (
          <section className="card volunteer-loading">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading tasks...
          </section>
        ) : null}

        {error ? (
          <section className="card volunteer-error">
            <AlertCircle className="w-4 h-4" />
            {error}
          </section>
        ) : null}

        {!loading && !error ? (
          <section className="volunteer-task-list">
            {tasks.map((task) => (
              <article key={task.task_id} className="card volunteer-task-card">
                <div className="volunteer-task-header">
                  <p className="font-semibold text-text-primary">{task.title}</p>
                  <div className="flex items-center gap-2">
                    {task.is_completion_verified && (
                      <span className="badge-verified flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" />
                        AI VERIFIED
                      </span>
                    )}
                    <span className={`volunteer-pill ${volunteerStatusClass(task.task_status)}`}>
                      {volunteerStatusLabel(task.task_status)}
                    </span>
                  </div>
                </div>

                {/* Hide details for completed tasks */}
                {task.task_status !== 'completed' && (
                  <div className="volunteer-task-meta flex flex-wrap gap-2 text-xs text-slate-400 mt-2 mb-4">
                    <span className="capitalize px-2 py-1 bg-slate-800 rounded">{task.need_type}</span>
                    <span className="px-2 py-1 bg-slate-800 rounded">{task.ward || 'Zone'}, {task.district || 'City'}</span>
                    <span className="px-2 py-1 bg-slate-800 rounded">Urgency: {Number(task.urgency_score || 0).toFixed(2)}</span>
                    {volunteerCoords && typeof task.lat === 'number' && typeof task.lng === 'number' && (
                      <span className="px-2 py-1 bg-sky-500/20 text-sky-400 font-bold rounded flex items-center gap-1">
                        <Navigation className="w-3 h-3" />
                        {haversineKm(volunteerCoords, { lat: task.lat, lng: task.lng }).toFixed(2)} km away
                      </span>
                    )}
                  </div>
                )}

                {/* SHOW MAP AND CONTACT INFO for IN PROGRESS tasks */}
                {task.task_status === 'in_progress' && (
                  <div className="mt-3">
                    {(task.contact_number || task.contactNumber) ? (
                      <div className="bg-sky-500/10 border border-sky-500/20 p-3 rounded-xl flex items-center justify-between gap-3 mb-3">
                        <div className="flex flex-col">
                          <p className="text-[10px] text-sky-400 font-bold uppercase tracking-widest">Reporter Contact</p>
                          <p className="text-sm font-semibold text-white">{task.contact_number || task.contactNumber}</p>
                        </div>
                        <a 
                          href={`tel:${(task.contact_number || task.contactNumber).replace(/\D/g, '')}`} 
                          className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold rounded-lg transition-colors"
                        >
                          Call
                        </a>
                      </div>
                    ) : (
                      <div className="hidden">No contact info available</div>
                    )}
                    {volunteerCoords && typeof task.lat === 'number' && typeof task.lng === 'number' ? (
                      <VolunteerTaskMap 
                        volunteerCoords={volunteerCoords} 
                        taskCoords={{ lat: Number(task.lat), lng: Number(task.lng) }} 
                      />
                    ) : (
                      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col items-center justify-center text-center gap-3">
                        <Loader2 className="w-6 h-6 animate-spin text-sky-400" />
                        <p className="text-sm text-slate-400 font-medium">Initializing Route Navigation...</p>
                        <p className="text-[10px] text-slate-500 uppercase tracking-widest">Waiting for GPS Coordinates</p>
                      </div>
                    )}
                  </div>
                )}

                <div className="volunteer-task-actions mt-4">
                  {task.task_status === 'assigned' ? (
                    <button
                      type="button"
                      className="btn-primary"
                      onClick={() => checkInTask(task)}
                      disabled={busyTaskId === task.task_id}
                    >
                      {busyTaskId === task.task_id ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />}
                      Check In
                    </button>
                  ) : null}

                  {task.task_status === 'in_progress' ? (
                    <div className="flex flex-col gap-3 w-full">
                      {selectedFiles[task.task_id] && (
                        <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-surface-secondary border border-border-subtle group">
                          <img 
                            src={selectedFiles[task.task_id].preview} 
                            className="w-full h-full object-cover" 
                            alt="Completion proof" 
                          />

                          {/* GPS Tag — Top Left */}
                          <div style={{
                            position: 'absolute',
                            top: '10px',
                            left: '10px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px',
                            padding: '5px 10px',
                            borderRadius: '8px',
                            backdropFilter: 'blur(10px)',
                            background: selectedFiles[task.task_id].hasGps ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)',
                            border: selectedFiles[task.task_id].hasGps ? '1px solid rgba(16,185,129,0.6)' : '1px solid rgba(239,68,68,0.6)',
                            fontFamily: 'monospace',
                            fontSize: '10px',
                            fontWeight: 'bold',
                            letterSpacing: '0.06em',
                            textTransform: 'uppercase',
                            color: selectedFiles[task.task_id].hasGps ? '#34d399' : '#f87171',
                          }}>
                            {selectedFiles[task.task_id].hasGps ? '📍 GPS VERIFIED' : '⚠️ NO GPS'}
                          </div>

                          {/* X Close — Top Right */}
                          <button
                            onClick={() => {
                              setSelectedFiles(prev => {
                                if (prev[task.task_id]?.preview) URL.revokeObjectURL(prev[task.task_id].preview);
                                const next = { ...prev };
                                delete next[task.task_id];
                                return next;
                              });
                              setVerificationErrors(prev => {
                                const next = { ...prev };
                                delete next[task.task_id];
                                return next;
                              });
                            }}
                            style={{
                              position: 'absolute',
                              top: '10px',
                              right: '10px',
                              width: '32px',
                              height: '32px',
                              borderRadius: '50%',
                              background: 'rgba(0,0,0,0.6)',
                              backdropFilter: 'blur(8px)',
                              border: '1px solid rgba(255,255,255,0.15)',
                              color: '#fff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              padding: 0,
                            }}
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )}

                      {/* AI Analysis Results — shown after verification attempt */}
                      {verificationErrors[task.task_id] && (
                        <div style={{
                          background: 'rgba(239,68,68,0.08)',
                          border: '1px solid rgba(239,68,68,0.3)',
                          borderRadius: '12px',
                          padding: '16px',
                          marginTop: '8px',
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                            <AlertCircle style={{ width: 16, height: 16, color: '#f87171' }} />
                            <span style={{ fontWeight: 'bold', fontSize: '13px', color: '#f87171', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                              Verification Failed
                            </span>
                          </div>

                          {/* Status Summary Badges */}
                          {verificationErrors[task.task_id].summary && (
                            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
                              <span style={{
                                padding: '4px 10px',
                                borderRadius: '6px',
                                fontSize: '10px',
                                fontWeight: 'bold',
                                fontFamily: 'monospace',
                                textTransform: 'uppercase',
                                letterSpacing: '0.08em',
                                background: verificationErrors[task.task_id].summary.geoTag === 'PASSED' ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)',
                                color: verificationErrors[task.task_id].summary.geoTag === 'PASSED' ? '#34d399' : '#f87171',
                                border: verificationErrors[task.task_id].summary.geoTag === 'PASSED' ? '1px solid rgba(16,185,129,0.4)' : '1px solid rgba(239,68,68,0.4)',
                              }}>
                                GEO-TAG: {verificationErrors[task.task_id].summary.geoTag}
                              </span>
                              <span style={{
                                padding: '4px 10px',
                                borderRadius: '6px',
                                fontSize: '10px',
                                fontWeight: 'bold',
                                fontFamily: 'monospace',
                                textTransform: 'uppercase',
                                letterSpacing: '0.08em',
                                background: verificationErrors[task.task_id].summary.aiContent === 'PASSED' ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)',
                                color: verificationErrors[task.task_id].summary.aiContent === 'PASSED' ? '#34d399' : '#f87171',
                                border: verificationErrors[task.task_id].summary.aiContent === 'PASSED' ? '1px solid rgba(16,185,129,0.4)' : '1px solid rgba(239,68,68,0.4)',
                              }}>
                                AI CONTENT: {verificationErrors[task.task_id].summary.aiContent}
                              </span>
                            </div>
                          )}

                          {/* Error Details */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            {(verificationErrors[task.task_id].errors || []).map((err, i) => (
                              <div key={i} style={{
                                fontSize: '12px',
                                color: '#e2e8f0',
                                lineHeight: '1.5',
                                padding: '8px 12px',
                                background: 'rgba(0,0,0,0.2)',
                                borderRadius: '8px',
                                borderLeft: '3px solid #f87171',
                              }}>
                                {err}
                              </div>
                            ))}
                          </div>

                          <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: '12px', fontStyle: 'italic' }}>
                            Retake the photo using the Live Camera at the incident location.
                          </p>
                        </div>
                      )}

                      {!selectedFiles[task.task_id] ? (
                        <button
                          type="button"
                          className="btn-primary"
                          onClick={(e) => {
                            e.preventDefault();
                            setActiveCameraTask(task.task_id);
                          }}
                          disabled={busyTaskId === task.task_id}
                        >
                          <ShieldCheck className="w-4 h-4" />
                          Capture Proof
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="btn-success w-full"
                          onClick={(e) => {
                            e.preventDefault();
                            onCompleteMission(task, selectedFiles[task.task_id].file);
                          }}
                          disabled={busyTaskId === task.task_id}
                        >
                          {busyTaskId === task.task_id ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : (
                            <Sparkles className="w-5 h-5" />
                          )}
                          <span>Verify & Complete</span>
                        </button>
                      )}
                    </div>
                  ) : null}

                  {task.task_status === 'completed' ? (
                    <div className="volunteer-celebration">
                      <CheckCircle2 className="w-4 h-4" />
                      Completed mission
                    </div>
                  ) : null}
                </div>
              </article>
            ))}

            {tasks.length === 0 ? (
              <article className="card volunteer-empty">
                <Sparkles className="w-5 h-5 text-text-muted" />
                <p className="text-sm text-text-secondary">No assigned tasks yet.</p>
              </article>
            ) : null}
          </section>
        ) : null}

        {toast ? (
          <div className={`dashboard-toast ${toast.type === 'error' ? 'is-error' : ''}`}>{toast.message}</div>
        ) : null}
      </div>

      {activeCameraTask && (
        <CameraWatermark 
          onCapture={(file, hasGps) => {
            handleFileChange(activeCameraTask, file, hasGps);
            setActiveCameraTask(null);
          }} 
          onCancel={() => setActiveCameraTask(null)} 
        />
      )}
    </MainLayout>
  );
};

export default VolunteerPage;
