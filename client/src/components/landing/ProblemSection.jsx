import { XCircle, CheckCircle2, ArrowRight } from 'lucide-react';

const ProblemSection = () => {
  return (
    <section className="landing-section problem-section-revamp" id="features">
      <div className="container-lg">
        <div className="section-header centered">
          <h2 className="landing-heading">Relief fails when information is messy.</h2>
        </div>

        <div className="problem-solution-grid">
          <div className="problem-card">
            <h3>The Fragmentation Chaos</h3>
            <ul>
              <li><XCircle size={18} className="text-rust" /> <strong>WhatsApp Lag:</strong> Critical needs buried in message threads.</li>
              <li><XCircle size={18} className="text-rust" /> <strong>Redundant Effort:</strong> Duplicate requests waste precious supplies.</li>
              <li><XCircle size={18} className="text-rust" /> <strong>Manual Matching:</strong> Calling 50+ people to find one volunteer.</li>
              <li><XCircle size={18} className="text-rust" /> <strong>Dark Zones:</strong> No visibility on status or resource location.</li>
              <li><XCircle size={18} className="text-rust" /> <strong>Trust Gaps:</strong> Hard to verify impact or coordinate proof.</li>
            </ul>
          </div>

          <div className="arrow-connector">
            <ArrowRight size={24} />
          </div>

          <div className="solution-card">
            <h3>The Intelligence Clarity</h3>
            <ul>
              <li><CheckCircle2 size={18} className="text-moss" /> <strong>Unified Command:</strong> Every need captured in one PostGIS system.</li>
              <li><CheckCircle2 size={18} className="text-moss" /> <strong>AI Scoring:</strong> Automatic prioritization based on impact data.</li>
              <li><CheckCircle2 size={18} className="text-moss" /> <strong>Smart Dispatch:</strong> Instantly find the nearest qualified person.</li>
              <li><CheckCircle2 size={18} className="text-moss" /> <strong>Live Heatmaps:</strong> Real-time situational awareness for NGOs.</li>
              <li><CheckCircle2 size={18} className="text-moss" /> <strong>Proof of Impact:</strong> GPS & Photo backed completion logs.</li>
            </ul>
          </div>

          <div className="problem-image">
             <img src="https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&q=80&w=800" alt="Field Relief Work" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProblemSection;
