import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2, UserPlus } from 'lucide-react';
import MainLayout from '../layouts/MainLayout';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';

const ROLE_OPTIONS = [
  { value: 'field_worker', label: 'Field Worker' },
  { value: 'volunteer', label: 'Volunteer' },
  { value: 'coordinator', label: 'Coordinator' },
];

const SKILL_OPTIONS = ['medical', 'food', 'shelter', 'education', 'logistics', 'counseling'];

const routeByRole = (role) => {
  if (role === 'coordinator') return '/dashboard';
  if (role === 'volunteer') return '/volunteer';
  if (role === 'field_worker') return '/field';
  return '/';
};

const RegisterPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'field_worker',
    skills: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isVolunteer = useMemo(() => formData.role === 'volunteer', [formData.role]);

  const updateField = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const toggleSkill = (skill) => {
    setFormData((prev) => {
      const exists = prev.skills.includes(skill);
      return {
        ...prev,
        skills: exists ? prev.skills.filter((s) => s !== skill) : [...prev.skills, skill],
      };
    });
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const payload = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        skills: isVolunteer ? formData.skills : [],
      };

      const { data } = await api.post('/auth/register', payload);
      login(data);
      navigate(routeByRole(data?.user?.role), { replace: true });
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to register right now.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <section className="container-lg py-12">
        <div className="max-w-2xl mx-auto card p-8">
          <p className="landing-eyebrow">Create Account</p>
          <h1 className="text-2xl font-bold text-text-primary">Join SevaSetu</h1>
          <p className="mt-2 text-sm text-text-secondary">Register as coordinator, volunteer, or field worker.</p>

          {error ? (
            <div className="mt-5 rounded-xl border border-accent-rose/30 bg-accent-rose/10 px-4 py-3 text-sm text-accent-rose">
              {error}
            </div>
          ) : null}

          <form className="mt-6 space-y-4" onSubmit={onSubmit}>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-[0.08em] text-text-muted mb-1.5">Name</label>
              <input
                type="text"
                required
                className="input-field"
                value={formData.name}
                onChange={(e) => updateField('name', e.target.value)}
                placeholder="Your full name"
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-[0.08em] text-text-muted mb-1.5">Email</label>
                <input
                  type="email"
                  required
                  className="input-field"
                  value={formData.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  placeholder="you@example.org"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-[0.08em] text-text-muted mb-1.5">Password</label>
                <input
                  type="password"
                  required
                  className="input-field"
                  value={formData.password}
                  onChange={(e) => updateField('password', e.target.value)}
                  placeholder="Create password"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-[0.08em] text-text-muted mb-1.5">Role</label>
              <select
                className="input-field"
                value={formData.role}
                onChange={(e) => updateField('role', e.target.value)}
              >
                {ROLE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {isVolunteer ? (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-[0.08em] text-text-muted mb-2">Skills</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {SKILL_OPTIONS.map((skill) => {
                    const active = formData.skills.includes(skill);
                    return (
                      <button
                        key={skill}
                        type="button"
                        className={`rounded-lg border px-3 py-2 text-xs font-semibold capitalize transition ${
                          active
                            ? 'border-accent-sky bg-accent-sky/10 text-accent-sky'
                            : 'border-border text-text-secondary hover:border-border-hover'
                        }`}
                        onClick={() => toggleSkill(skill)}
                      >
                        {skill}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}

            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>

          <p className="mt-5 text-sm text-text-secondary">
            Already registered?{' '}
            <Link to="/login" className="text-text-primary font-semibold hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </section>
    </MainLayout>
  );
};

export default RegisterPage;
