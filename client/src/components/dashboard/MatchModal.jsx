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
