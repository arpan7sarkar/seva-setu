const MatchModal = ({
  need,
  matches,
  loading,
  assigningVolunteerId,
  onClose,
  onAssign,
}) => {
  if (!need) return null;

  return (
    <div className="dashboard-modal-backdrop" role="dialog" aria-modal="true">
      <div className="dashboard-modal card">
        <div className="dashboard-modal-header">
          <h3 className="dashboard-card-title">Dispatch Matches</h3>
          <button type="button" className="dashboard-text-btn" onClick={onClose}>
            Close
          </button>
        </div>

        <div className="mb-4">
          <p className="text-sm font-bold text-text-primary">Need: {need.title}</p>
          <p className="text-[10px] text-accent-sky font-black uppercase tracking-widest mt-1">
            Location: {need.ward || 'Unknown'} • {need.district || 'Unspecified'}
          </p>
        </div>

        {Number(need.pending_broadcasts) > 0 && (
          <div className="mb-4 p-3 rounded-lg bg-accent-rose/10 border border-accent-rose/30 flex gap-3 items-start">
            <svg className="w-5 h-5 text-accent-rose shrink-0 mt-0.5" xmlns="http://www.w3.org/0000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            <div>
              <p className="text-sm font-bold text-accent-rose uppercase tracking-wider">Automated Broadcast Active</p>
              <p className="text-xs text-text-secondary mt-1">
                {Number(need.pending_broadcasts)} volunteers have been notified. Manually assigning a volunteer will override this broadcast and cancel it for everyone else.
              </p>
            </div>
          </div>
        )}

        {loading ? (
          <p className="text-sm text-text-secondary">Loading ranked volunteers...</p>
        ) : (
          <div className="dashboard-match-list">
            {matches.map((vol) => (
              <article key={vol.id} className="dashboard-match-card">
                <div>
                  <p className="font-semibold text-text-primary">{vol.name}</p>
                  <p className="text-xs text-text-secondary">
                    Distance: {Number(vol.distance_km || 0).toFixed(2)} km � Completion rate: {Math.round((vol.completion_rate || 0) * 100)}%
                  </p>
                  <div className="dashboard-tag-row mt-2">
                    {(vol.skills || []).map((skill) => (
                      <span key={skill} className="dashboard-tag">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
                <button
                  type="button"
                  className="dashboard-dispatch-btn"
                  onClick={() => onAssign(vol.id)}
                  disabled={assigningVolunteerId === vol.id}
                >
                  {assigningVolunteerId === vol.id ? 'Assigning...' : 'Assign'}
                </button>
              </article>
            ))}

            {!loading && matches.length === 0 ? (
              <p className="text-sm text-text-secondary">No available volunteers matched this need.</p>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
};

export default MatchModal;
