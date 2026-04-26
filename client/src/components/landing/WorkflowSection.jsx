import { ClipboardList, BrainCircuit, UserCheck, Activity, ShieldCheck } from 'lucide-react';

const WorkflowSection = () => {
  const steps = [
    {
      icon: <ClipboardList />,
      title: "Report is Captured",
      desc: "Field teams submit needs with location, category, and context.",
      step: 1
    },
    {
      icon: <BrainCircuit />,
      title: "AI Prioritizes Urgency",
      desc: "Requests are scored based on severity, impact & disaster type.",
      step: 2
    },
    {
      icon: <UserCheck />,
      title: "Best Volunteer Matched",
      desc: "Our engine matches the right person, based on skills & proximity.",
      step: 3
    },
    {
      icon: <Activity />,
      title: "Task Tracked Live",
      desc: "Real-time updates from assignment to progress in one place.",
      step: 4
    },
    {
      icon: <ShieldCheck />,
      title: "Proof & Closure",
      desc: "GPS check-in, photo verification & final completion.",
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
