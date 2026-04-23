import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2, LogIn } from 'lucide-react';
import MainLayout from '../layouts/MainLayout';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';

const routeByRole = (role) => {
  if (role === 'coordinator') return '/dashboard';
  if (role === 'volunteer') return '/volunteer';
  if (role === 'field_worker') return '/field';
  return '/';
};

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const updateField = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data } = await api.post('/auth/login', formData);
      login(data);
      navigate(routeByRole(data?.user?.role), { replace: true });
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to sign in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <section className="container-lg py-12">
        <div className="max-w-md mx-auto card p-8">
          <p className="landing-eyebrow">Account Access</p>
          <h1 className="text-2xl font-bold text-text-primary">Sign in to SevaSetu</h1>
          <p className="mt-2 text-sm text-text-secondary">
            Login with your registered email to continue to your workspace.
          </p>

          {error ? (
            <div className="mt-5 rounded-xl border border-accent-rose/30 bg-accent-rose/10 px-4 py-3 text-sm text-accent-rose">
              {error}
            </div>
          ) : null}

          <form className="mt-6 space-y-4" onSubmit={onSubmit}>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-[0.08em] text-text-muted mb-1.5">
                Email
              </label>
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
              <label className="block text-xs font-semibold uppercase tracking-[0.08em] text-text-muted mb-1.5">
                Password
              </label>
              <input
                type="password"
                required
                className="input-field"
                value={formData.password}
                onChange={(e) => updateField('password', e.target.value)}
                placeholder="Enter your password"
              />
            </div>

            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <p className="mt-5 text-sm text-text-secondary">
            Need an account?{' '}
            <Link to="/register" className="text-text-primary font-semibold hover:underline">
              Register here
            </Link>
          </p>
        </div>
      </section>
    </MainLayout>
  );
};

export default LoginPage;
