import { ClipboardList, BrainCircuit, UserCheck, Activity, ShieldCheck } from 'lucide-react';

const WorkflowSection = () => {
  const steps = [
    {
      icon: <ClipboardList />,
      title: "Field Intelligence",
      desc: "Capture needs with GPS coordinates, photos, and severity data—even when offline.",
      step: 1
    },
    {
      icon: <BrainCircuit />,
      title: "AI Urgency Scoring",
      desc: "Our engine prioritizes every request in real-time using a normalized 1-10 severity scale.",
      step: 2
    },
    {
      icon: <UserCheck />,
      title: "Smart Dispatching",
      desc: "PostGIS-powered matching connects the most qualified volunteers based on proximity and skills.",
      step: 3
    },
    {
      icon: <Activity />,
      title: "Live Coordination",
      desc: "Track missions from assignment to check-in on a real-time command heatmap.",
      step: 4
    },
    {
      icon: <ShieldCheck />,
      title: "Verified Completion",
      desc: "Close the loop with GPS-backed check-ins and multi-factor proof of impact.",
      step: 5
    }
  ];

  return (
    <section className="landing-section workflow-revamp" id="workflow">
      <div className="container-lg">
        <div className="section-header centered">
          <h2 className="landing-heading">How SevaSetu Works in the Field</h2>
        </div>

        <div className="workflow-steps">
          {steps.map((s, idx) => (
            <div key={idx} className="workflow-step-card">
              <div className="step-number-pill">
                <span className="step-icon">{s.icon}</span>
                <span className="step-count">{s.step}</span>
              </div>
              <h3>{s.title}</h3>
              <p>{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WorkflowSection;
