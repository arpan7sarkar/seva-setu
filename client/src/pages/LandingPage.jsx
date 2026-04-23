import { Link } from 'react-router-dom';
import { SignedIn, SignedOut, UserButton } from '@clerk/clerk-react';
import { ArrowRight, MapPin, Zap, Users, Shield, Activity, Globe } from 'lucide-react';
import Logo from '../components/Logo';

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-surface-primary overflow-hidden">
      {/* ── Ambient Background Glow ─────────────────────────────────── */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-accent-sky/[0.04] blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-accent-indigo/[0.04] blur-[120px]" />
      </div>

      {/* ── Navigation ──────────────────────────────────────────────── */}
      <nav className="relative z-10 flex items-center justify-between px-6 lg:px-16 py-5">
        <div className="flex items-center space-x-3">
          <Logo size={36} />
          <span className="text-text-primary font-bold text-lg tracking-tight">SevaSetu</span>
        </div>

        <div className="flex items-center space-x-4">
          <SignedOut>
            <Link to="/sign-in" className="btn-ghost">Sign In</Link>
            <Link to="/sign-up" className="btn-primary flex items-center space-x-2">
              <span>Get Started</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </SignedOut>
          <SignedIn>
            <Link to="/field" className="btn-primary flex items-center space-x-2">
              <span>Open App</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
        </div>
      </nav>

      {/* ── Hero Section ────────────────────────────────────────────── */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 pt-24 pb-32 text-center">
        <div className="flex justify-center mb-8 animate-fade-in">
          <Logo size={80} />
        </div>
        <div className="inline-flex items-center space-x-2 badge-gradient mb-8 animate-fade-in">
          <Zap className="w-3.5 h-3.5" />
          <span>Real-time Volunteer Intelligence</span>
        </div>

        <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tight leading-[1.1] animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <span className="text-text-primary">Bridge the gap</span>
          <br />
          <span className="bg-gradient-to-r from-accent-sky to-accent-indigo bg-clip-text text-transparent">
            between needs and action.
          </span>
        </h1>

        <p className="mt-8 text-lg text-text-secondary max-w-2xl mx-auto leading-relaxed animate-fade-in" style={{ animationDelay: '0.2s' }}>
          SevaSetu is an intelligent coordination platform that uses urgency scoring and
          geo-spatial matching to connect community needs with the right volunteers — instantly.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in" style={{ animationDelay: '0.3s' }}>
          <SignedOut>
            <Link to="/sign-up" className="btn-primary px-8 py-4 text-base flex items-center space-x-2">
              <span>Start Coordinating</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          </SignedOut>
          <SignedIn>
            <Link to="/field" className="btn-primary px-8 py-4 text-base flex items-center space-x-2">
              <span>Open Dashboard</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          </SignedIn>
          <a href="#features" className="btn-ghost px-8 py-4 text-base">
            Learn More
          </a>
        </div>
      </section>

      {/* ── Stats Bar ───────────────────────────────────────────────── */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 pb-24">
        <div className="card p-1 animate-pulse-glow">
          <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-white/[0.06]">
            {[
              { value: '3.3M+', label: 'NGOs in India', icon: Globe },
              { value: '<5min', label: 'Avg. Dispatch Time', icon: Zap },
              { value: '98%', label: 'Match Accuracy', icon: Activity },
              { value: '10x', label: 'Faster Coordination', icon: Users },
            ].map((stat, i) => (
              <div key={i} className="flex flex-col items-center py-6 px-4">
                <stat.icon className="w-5 h-5 text-accent-sky mb-2" />
                <span className="text-2xl lg:text-3xl font-bold text-text-primary">{stat.value}</span>
                <span className="text-xs text-text-muted mt-1">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features Grid ───────────────────────────────────────────── */}
      <section id="features" className="relative z-10 max-w-5xl mx-auto px-6 pb-32">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-text-primary">Built for the field.</h2>
          <p className="mt-4 text-text-secondary max-w-xl mx-auto">Every feature designed around the real-world chaos of disaster response and community support.</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 stagger-children">
          {[
            {
              icon: MapPin,
              title: 'Geo-Spatial Matching',
              description: 'PostGIS-powered proximity queries match volunteers to needs within seconds.',
              color: 'text-accent-sky',
            },
            {
              icon: Zap,
              title: 'Urgency Scoring',
              description: 'Dynamic formula weighing need type, affected count, time elapsed, and disaster zones.',
              color: 'text-accent-indigo',
            },
            {
              icon: Users,
              title: 'Smart Dispatch',
              description: 'Composite scoring ranks volunteers by skills, proximity, and reliability.',
              color: 'text-accent-emerald',
            },
            {
              icon: Activity,
              title: 'Real-Time Pipeline',
              description: 'Track tasks from Open → Assigned → In Progress → Completed in real time.',
              color: 'text-accent-amber',
            },
            {
              icon: Globe,
              title: 'Offline-First',
              description: 'Submit needs without internet. IndexedDB queue syncs when connection restores.',
              color: 'text-accent-rose',
            },
            {
              icon: Shield,
              title: 'Role-Based Access',
              description: 'Coordinators dispatch, field workers report, volunteers execute — each with their own view.',
              color: 'text-accent-sky',
            },
          ].map((feature, i) => (
            <div key={i} className="card-hover p-6">
              <feature.icon className={`w-10 h-10 ${feature.color} mb-4`} />
              <h3 className="text-lg font-semibold text-text-primary mb-2">{feature.title}</h3>
              <p className="text-sm text-text-secondary leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────── */}
      <footer className="relative z-10 border-t border-white/[0.06] py-8 px-6 text-center">
        <p className="text-sm text-text-muted">
          © 2026 SevaSetu — Built with ❤️ for India's communities.
        </p>
      </footer>
    </div>
  );
};

export default LandingPage;
