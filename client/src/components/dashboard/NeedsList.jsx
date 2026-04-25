import { formatElapsed } from '../../utils/dashboard';

const StatusPill = ({ status }) => (
  <span className={`dashboard-pill dashboard-pill-${status}`}>{status.replace('_', ' ')}</span>
);

const NeedsList = ({
  needs,
  selectedNeedId,
  setSelectedNeedId,
  sorting,
  setSort,
  onDispatch,
}) => {
  const sortable = [
    { key: 'district', label: 'District' },
    { key: 'ward', label: 'Ward' },
    { key: 'need_type', label: 'Need Type' },
    { key: 'urgency_score', label: 'Urgency' },
    { key: 'people_affected', label: 'People' },
    { key: 'status', label: 'Status' },
    { key: 'created_at', label: 'Reported' },
  ];

  return (
    <section className="dashboard-card">
      <div className="dashboard-card-header">
        <h2 className="dashboard-card-title">Needs List</h2>
      </div>

      <div className="dashboard-needs-table-wrap">
        <table className="dashboard-needs-table">
          <thead>
            <tr>
              <th>Evidence</th>
              {sortable.map((col) => (
                <th key={col.key}>
                  <button
                    type="button"
                    className="dashboard-th-btn"
                    onClick={() => setSort(col.key)}
                  >
                    {col.label}
                    {sorting.key === col.key ? (sorting.direction === 'asc' ? ' ?' : ' ?') : ''}
                  </button>
                </th>
              ))}
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {needs.map((need) => (
              <tr
                key={need.id}
                className={selectedNeedId === need.id ? 'is-selected' : ''}
                onClick={() => setSelectedNeedId(need.id)}
              >
                <td>
                  <div className="w-10 h-10 rounded-lg bg-slate-800 border border-slate-700 overflow-hidden flex items-center justify-center">
                    {need.image_url ? (
                      <img 
                        src={`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${need.image_url}`} 
                        alt="Evidence"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">No Pix</div>
                    )}
                  </div>
                </td>
                <td>{need.district || '-'}</td>
                <td>{need.ward || '-'}</td>
                <td className="capitalize">
                  <div className="flex items-center gap-1.5">
                    {need.need_type}
                    {need.is_verified && (
                      <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-accent-green/20 text-accent-green" title="AI Verified Ground Report">
                        ?
                      </span>
                    )}
                  </div>
                </td>
                <td>
                  <div className="flex flex-col">
                    <span className="font-bold">{Number(need.urgency_score || 0).toFixed(1)}</span>
                    {need.is_verified && (
                      <span className="text-[10px] text-accent-green font-medium">Verified x2</span>
                    )}
                  </div>
                </td>
                <td>{need.people_affected || 0}</td>
                <td>
                  <StatusPill status={need.status} />
                </td>
                <td>{formatElapsed(need.created_at)}</td>
                <td>
                  <button
                    type="button"
                    className="dashboard-dispatch-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDispatch(need);
                    }}
                    disabled={need.status !== 'open'}
                  >
                    Dispatch
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default NeedsList;
