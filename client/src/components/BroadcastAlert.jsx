import { useState, useEffect } from 'react';
import { Clock, MapPin, AlertTriangle, Check, X, Loader2 } from 'lucide-react';

const BroadcastAlert = ({ broadcast, onAccept, onReject, isBusy }) => {
  const [timeLeft, setTimeLeft] = useState('');
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const expiresAt = new Date(broadcast.expires_at).getTime();

    const updateTimer = () => {
      const now = new Date().getTime();
      const distance = expiresAt - now;

      if (distance <= 0) {
        setIsExpired(true);
        setTimeLeft('Expired');
        return;
      }

      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);
      setTimeLeft(`${minutes}m ${seconds}s`);
    };

    updateTimer();
    const intervalId = setInterval(updateTimer, 1000);

    return () => clearInterval(intervalId);
  }, [broadcast.expires_at]);

  const [loadingAction, setLoadingAction] = useState(null);

  if (isExpired) return null;

  const handleAccept = async () => {
    setLoadingAction('accept');
    try {
      await onAccept(broadcast.need_id);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleReject = async () => {
    setLoadingAction('reject');
    try {
      await onReject(broadcast.need_id);
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <article className="card bg-white border-2 border-accent-rose shadow-[0_20px_50px_rgba(244,63,94,0.1)] mb-6 overflow-hidden">
      <div className="bg-accent-rose-light/50 px-6 py-4 flex items-center justify-between border-b border-accent-rose/10">
        <div className="flex items-center gap-3">
          <div className="bg-accent-rose p-1.5 rounded-lg shadow-lg shadow-accent-rose/20">
            <AlertTriangle className="w-5 h-5 text-white animate-pulse" />
          </div>
          <h3 className="font-extrabold text-accent-rose uppercase tracking-tight text-sm">Emergency Dispatch</h3>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-accent-rose/20 text-accent-rose text-xs font-black font-mono shadow-sm">
          <Clock className="w-3.5 h-3.5" />
          {timeLeft}
        </div>
      </div>

      <div className="px-6 py-5">
        <p className="text-xl font-bold text-text-primary leading-tight mb-4">{broadcast.title}</p>
        
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-surface-secondary rounded-2xl p-4 flex items-center gap-3 border border-border">
            <div className="bg-white p-2 rounded-xl shadow-sm">
              <MapPin className="w-4 h-4 text-accent-moss" />
            </div>
            <div>
              <span className="block text-text-muted text-[10px] uppercase font-black tracking-widest mb-0.5">Distance</span>
              <span className="text-text-primary font-extrabold text-lg">{broadcast.distance_km?.toFixed(2) || '?'} km</span>
            </div>
          </div>
          <div className="bg-surface-secondary rounded-2xl p-4 border border-border">
            <span className="block text-text-muted text-[10px] uppercase font-black tracking-widest mb-1.5">Type & Urgency</span>
            <div className="flex items-center gap-2">
              <span className="capitalize text-text-primary font-bold">{broadcast.need_type}</span>
              <span className="px-2 py-0.5 rounded-lg text-[10px] font-black bg-accent-rose text-white shadow-sm shadow-accent-rose/20">
                {Number(broadcast.urgency_score || 0).toFixed(1)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleAccept}
            disabled={isBusy === broadcast.need_id}
            className="flex-[2] shadow-xl shadow-accent-moss/20 flex justify-center items-center gap-2 py-4 rounded-2xl text-base font-black transition-all transform hover:-translate-y-1 active:scale-95"
            style={{ backgroundColor: '#2d6148', color: '#ffffff', border: 'none' }}
          >
            {loadingAction === 'accept' ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-6 h-6" />}
            Accept Mission
          </button>
          <button
            onClick={handleReject}
            disabled={isBusy === broadcast.need_id}
            className="flex-1 py-4 px-6 rounded-2xl font-bold text-sm bg-surface-secondary hover:bg-surface-hover text-text-secondary border border-border transition-all flex justify-center items-center gap-2"
          >
            {loadingAction === 'reject' ? <Loader2 className="w-4 h-4 animate-spin text-text-muted" /> : <X className="w-4 h-4" />}
            Decline
          </button>
        </div>
      </div>
    </article>
  );
};

export default BroadcastAlert;
