import { useState } from 'react';
import { useUser, UserButton } from '@clerk/clerk-react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import {
  MapPin,
  AlertTriangle,
  Users,
  CheckCircle2,
  Send,
  ChevronLeft,
  Loader2,
  Crosshair,
  Heart,
  Flame,
} from 'lucide-react';

const NEED_TYPES = [
  { value: 'medical', label: 'Medical', icon: Heart, color: 'text-accent-rose' },
  { value: 'food', label: 'Food', icon: Flame, color: 'text-accent-amber' },
  { value: 'shelter', label: 'Shelter', icon: MapPin, color: 'text-accent-indigo' },
  { value: 'education', label: 'Education', icon: Users, color: 'text-accent-sky' },
  { value: 'other', label: 'Other', icon: AlertTriangle, color: 'text-accent-emerald' },
];

const FieldForm = () => {
  const { user } = useUser();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    need_type: '',
    ward: '',
    district: '',
    people_affected: '',
    is_disaster_zone: false,
    lat: null,
    lng: null,
  });
  const [loading, setLoading] = useState(false);
  const [locLoading, setLocLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const set = (key, value) => setFormData((p) => ({ ...p, [key]: value }));

  const getLocation = () => {
    setLocLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        set('lat', pos.coords.latitude);
        set('lng', pos.coords.longitude);
        setLocLoading(false);
      },
      () => {
        setError('Could not get location. Please enable GPS.');
        setLocLoading(false);
      }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.need_type) return setError('Please select a need type.');

    setLoading(true);
    setError('');
    try {
      await axios.post(`${import.meta.env.VITE_API_BASE_URL}/needs`, {
        ...formData,
        people_affected: parseInt(formData.people_affected) || 0,
      });
      setSuccess(true);
    } catch (err) {
      setError('Submission failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /* ── Success State ─────────────────────────────────────────────── */
  if (success) {
    return (
      <div className="min-h-screen bg-surface-primary flex items-center justify-center p-6">
        <div className="card p-10 max-w-md w-full text-center animate-fade-in">
          <div className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center" style={{ background: 'rgba(52,211,153,0.12)' }}>
            <CheckCircle2 className="w-10 h-10 text-accent-emerald" />
          </div>
          <h2 className="text-2xl font-bold text-text-primary mb-2">Report Submitted</h2>
          <p className="text-text-secondary text-sm leading-relaxed mb-8">
            Your need has been sent to the command center. It will be scored and dispatched to the nearest qualified volunteer.
          </p>
          <button
            onClick={() => {
              setSuccess(false);
              setFormData({
                title: '', description: '', need_type: '', ward: '', district: '',
                people_affected: '', is_disaster_zone: false, lat: null, lng: null,
              });
            }}
            className="btn-primary w-full py-4"
          >
            Submit Another Report
          </button>
        </div>
      </div>
    );
  }

  /* ── Form ──────────────────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-surface-primary">
      {/* Header */}
      <header className="sticky top-0 z-20 backdrop-blur-xl bg-surface-primary/80 border-b border-white/[0.06]">
        <div className="max-w-2xl mx-auto flex items-center justify-between px-5 py-4">
          <div className="flex items-center space-x-3">
            <Link to="/" className="btn-ghost p-2">
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-lg font-bold text-text-primary">New Report</h1>
              <p className="text-xs text-text-muted">Field Worker Entry</p>
            </div>
          </div>
          <UserButton afterSignOutUrl="/" />
        </div>
      </header>

      {/* Form Body */}
      <main className="max-w-2xl mx-auto px-5 py-8">
        <form onSubmit={handleSubmit} className="space-y-8 animate-fade-in">
          {/* Error Banner */}
          {error && (
            <div className="flex items-center space-x-3 p-4 rounded-xl bg-accent-rose/10 border border-accent-rose/20 text-accent-rose text-sm">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* ── Need Type Picker ─────────────────────────────────────── */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-3">What kind of need?</label>
            <div className="grid grid-cols-5 gap-2">
              {NEED_TYPES.map((type) => {
                const active = formData.need_type === type.value;
                return (
                  <button
                    type="button"
                    key={type.value}
                    onClick={() => set('need_type', type.value)}
                    className={`flex flex-col items-center p-3 rounded-xl border transition-all duration-200 ${
                      active
                        ? 'border-accent-sky bg-accent-sky/10 shadow-lg shadow-accent-sky/10'
                        : 'border-white/[0.06] bg-surface-card hover:border-white/10 hover:bg-surface-hover'
                    }`}
                  >
                    <type.icon className={`w-5 h-5 mb-1.5 ${active ? 'text-accent-sky' : type.color}`} />
                    <span className={`text-[11px] font-medium ${active ? 'text-accent-sky' : 'text-text-muted'}`}>{type.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Title ─────────────────────────────────────────────────── */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Report Title</label>
            <input
              required
              className="input-field"
              placeholder="e.g. Flood victims need medical supplies in Ward 64"
              value={formData.title}
              onChange={(e) => set('title', e.target.value)}
            />
          </div>

          {/* ── Location Row ──────────────────────────────────────────── */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">Ward</label>
              <input
                className="input-field"
                placeholder="Ward 64"
                value={formData.ward}
                onChange={(e) => set('ward', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">District</label>
              <input
                className="input-field"
                placeholder="Kolkata"
                value={formData.district}
                onChange={(e) => set('district', e.target.value)}
              />
            </div>
          </div>

          {/* ── People Affected ───────────────────────────────────────── */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">People Affected</label>
            <div className="relative">
              <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <input
                type="number"
                className="input-field pl-11"
                placeholder="Estimated number of people"
                value={formData.people_affected}
                onChange={(e) => set('people_affected', e.target.value)}
              />
            </div>
          </div>

          {/* ── Description ───────────────────────────────────────────── */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Description</label>
            <textarea
              className="input-field h-28 resize-none"
              placeholder="Describe the situation, what resources are needed, and any access constraints..."
              value={formData.description}
              onChange={(e) => set('description', e.target.value)}
            />
          </div>

          {/* ── Disaster Zone Toggle ──────────────────────────────────── */}
          <button
            type="button"
            onClick={() => set('is_disaster_zone', !formData.is_disaster_zone)}
            className={`w-full flex items-center space-x-3 p-4 rounded-xl border transition-all duration-200 ${
              formData.is_disaster_zone
                ? 'bg-accent-rose/10 border-accent-rose/30 text-accent-rose'
                : 'bg-surface-card border-white/[0.06] text-text-muted hover:border-white/10'
            }`}
          >
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <div className="text-left">
              <span className="block text-sm font-semibold">Disaster Zone</span>
              <span className="block text-xs opacity-70">Enable to boost urgency scoring by 1.5×</span>
            </div>
            <div
              className={`ml-auto w-10 h-6 rounded-full relative transition-all duration-200 ${
                formData.is_disaster_zone ? 'bg-accent-rose' : 'bg-white/10'
              }`}
            >
              <div
                className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform duration-200 ${
                  formData.is_disaster_zone ? 'translate-x-5' : 'translate-x-1'
                }`}
              />
            </div>
          </button>

          {/* ── GPS Capture ───────────────────────────────────────────── */}
          <button
            type="button"
            onClick={getLocation}
            disabled={locLoading}
            className={`w-full flex items-center justify-center space-x-2 py-4 rounded-xl border-2 border-dashed transition-all duration-200 ${
              formData.lat
                ? 'bg-accent-emerald/10 border-accent-emerald/30 text-accent-emerald'
                : 'border-white/10 text-text-muted hover:border-accent-sky/30 hover:text-accent-sky'
            }`}
          >
            {locLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : formData.lat ? (
              <>
                <MapPin className="w-5 h-5" />
                <span className="text-sm font-medium">
                  {formData.lat.toFixed(4)}, {formData.lng.toFixed(4)}
                </span>
              </>
            ) : (
              <>
                <Crosshair className="w-5 h-5" />
                <span className="text-sm font-medium">Capture GPS Location</span>
              </>
            )}
          </button>

          {/* ── Submit ────────────────────────────────────────────────── */}
          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-4 text-base flex items-center justify-center space-x-2"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Send className="w-5 h-5" />
                <span>Submit Report</span>
              </>
            )}
          </button>
        </form>
      </main>
    </div>
  );
};

export default FieldForm;
