import { Users, Building2, Zap, ShieldCheck } from 'lucide-react';

const StatsStrip = () => {
  const stats = [
    {
      icon: <Users size={24} />,
      value: "10,000+",
      label: "Lives Impacted",
    },
    {
      icon: <Building2 size={24} />,
      value: "50+",
      label: "NGOs & Teams",
    },
    {
      icon: <Zap size={24} />,
      value: "2.3x",
      label: "Faster Response",
    },
    {
      icon: <ShieldCheck size={24} />,
      value: "90%",
      label: "Requests Verified",
    },
  ];

  return (
    <section className="landing-stats stats-revamp">
      <div className="container-lg">
        <p className="stats-intro">Trusted by NGOs in real crises</p>
        <ul className="landing-stats-grid">
          {stats.map((stat, idx) => (
            <li key={idx}>
              <div className="stat-icon-box">{stat.icon}</div>
              <div className="stat-content">
                <span className="landing-stat-value">{stat.value}</span>
                <span className="landing-stat-label">{stat.label}</span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};

export default StatsStrip;
