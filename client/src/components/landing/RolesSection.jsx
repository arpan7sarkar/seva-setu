import { useState } from 'react';
import { Smartphone, LayoutDashboard, UserCheck, CheckCircle2 } from 'lucide-react';

const RolesSection = () => {
  const [activeRole, setActiveRole] = useState('field');

  const roles = [
    { id: 'field', label: 'Field Worker', icon: <Smartphone size={18} /> },
    { id: 'coordinator', label: 'Coordinator', icon: <LayoutDashboard size={18} /> },
    { id: 'volunteer', label: 'Volunteer', icon: <UserCheck size={18} /> },
  ];

  return (
    <section className="landing-section roles-revamp" id="roles">
      <div className="container-lg">
        <div className="section-header centered">
          <h2 className="landing-heading">Built for every role in the mission</h2>
          <div className="role-tabs">
            {roles.map(role => (
              <button 
                key={role.id}
                className={`role-tab-btn ${activeRole === role.id ? 'active' : ''}`}
                onClick={() => setActiveRole(role.id)}
              >
                {role.icon} {role.label}
              </button>
            ))}
          </div>
        </div>

        <div className="role-content-wrap">
          {activeRole === 'field' && (
            <div className="role-content grid-2">
              <div className="role-text">
                <h3>Capture what matters, even offline.</h3>
                <ul>
                  <li><CheckCircle2 size={18} className="text-moss" /> Mobile-first reporting</li>
                  <li><CheckCircle2 size={18} className="text-moss" /> Works offline, syncs later</li>
                  <li><CheckCircle2 size={18} className="text-moss" /> Add location, photos, people affected</li>
                  <li><CheckCircle2 size={18} className="text-moss" /> See your recent submissions</li>
                </ul>
              </div>
              <div className="role-visual">
                <div className="phone-mockup-wrap">
                  <img src="https://images.unsplash.com/photo-1512428559087-560fa5ceab42?auto=format&fit=crop&q=80&w=600" className="role-img-main" alt="Mobile App" />
                  <div className="floating-imgs">
                    <img src="https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&q=80&w=300" alt="Field" />
                    <img src="https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?auto=format&fit=crop&q=80&w=300" alt="Relief" />
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {activeRole === 'coordinator' && (
            <div className="role-content grid-2 reverse">
               <div className="role-text">
                <h3>One command view. Zero confusion.</h3>
                <p>A real-time dashboard that shows what matters most — so you can make the right calls, faster.</p>
                <button className="btn-primary mt-4">Explore Dashboard <LayoutDashboard size={18} /></button>
              </div>
              <div className="role-visual">
                <div className="dashboard-preview-card">
                   <div className="dash-sidebar">
                      <div className="dash-logo" />
                      <div className="dash-nav-item active" />
                      <div className="dash-nav-item" />
                      <div className="dash-nav-item" />
                   </div>
                   <div className="dash-body">
                      <div className="dash-top">
                         <div className="dash-stat-box" />
                         <div className="dash-stat-box" />
                         <div className="dash-stat-box" />
                      </div>
                      <div className="dash-map-placeholder" />
                   </div>
                </div>
              </div>
            </div>
          )}

          {activeRole === 'volunteer' && (
             <div className="role-content grid-2">
                <div className="role-text">
                  <h3>Accept tasks, prove impact.</h3>
                  <p>Get matched with needs that fit your skills and location. Provide GPS-backed completion proof instantly.</p>
                </div>
                <div className="role-visual">
                   <div className="volunteer-card-mockup">
                      <div className="volunteer-header">Available Missions</div>
                      <div className="mission-item">
                         <strong>Water Supply</strong>
                         <span>0.8km away</span>
                         <button className="btn-mini">Accept</button>
                      </div>
                   </div>
                </div>
             </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default RolesSection;
