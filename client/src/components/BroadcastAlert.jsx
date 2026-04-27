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

  if (isExpired) return null;

  return (
    <article className="card bg-white border-2 border-accent-rose shadow-xl mb-6">
      <div className="flex gap-3 mb-4">
        <div className="bg-accent-rose/10 p-2 rounded-lg h-fit">
          <AlertTriangle className="w-6 h-6 text-accent-rose animate-pulse" />
        </div>
        <div className="flex-1">
          <div className="flex justify-between items-start">
            <h3 className="font-bold text-lg text-text-primary">Emergency Dispatch</h3>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-accent-rose/10 border border-accent-rose/20 text-accent-rose text-xs font-bold font-mono">
              <Clock className="w-3.5 h-3.5" />
              {timeLeft}
            </div>
          </div>
          <p className="text-text-secondary font-medium mt-1">{broadcast.title}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-5">
        <div className="bg-surface-secondary rounded-lg p-2.5 flex items-center gap-2">
          <MapPin className="w-4 h-4 text-text-muted" />
          <div className="text-sm">
            <span className="block text-text-muted text-[10px] uppercase font-bold tracking-wider">Distance</span>
            <span className="text-text-primary font-bold">{broadcast.distance_km?.toFixed(2) || '?'} km away</span>
          </div>
        </div>
        <div className="bg-surface-secondary rounded-lg p-2.5 flex flex-col justify-center">
          <span className="block text-text-muted text-[10px] uppercase font-bold tracking-wider">Type / Urgency</span>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="capitalize text-text-primary text-sm font-medium">{broadcast.need_type}</span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-surface-tertiary text-text-primary">
              {Number(broadcast.urgency_score || 0).toFixed(1)}
            </span>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => onAccept(broadcast.need_id)}
          disabled={isBusy === broadcast.need_id}
          className="flex-1 btn-success flex justify-center items-center gap-2"
        >
          {isBusy === broadcast.need_id ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
          Accept Mission
        </button>
        <button
          onClick={() => onReject(broadcast.need_id)}
          disabled={isBusy === broadcast.need_id}
          className="flex-1 py-2.5 px-4 rounded-lg font-bold text-sm bg-surface-tertiary hover:bg-surface-secondary text-text-primary transition-colors flex justify-center items-center gap-2"
        >
          {isBusy === broadcast.need_id ? <Loader2 className="w-4 h-4 animate-spin text-text-muted" /> : <X className="w-4 h-4 text-text-muted" />}
          Decline
        </button>
      </div>
    </article>
  );
};

export default BroadcastAlert;
