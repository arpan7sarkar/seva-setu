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
            <h3>Without SevaSetu (The Chaos)</h3>
            <ul>
              <li><XCircle size={18} className="text-rust" /> WhatsApp threads bury urgent needs</li>
              <li><XCircle size={18} className="text-rust" /> Duplicate requests & conflicting updates</li>
              <li><XCircle size={18} className="text-rust" /> No visibility on who is doing what</li>
              <li><XCircle size={18} className="text-rust" /> Hard to verify, easy to misuse</li>
              <li><XCircle size={18} className="text-rust" /> Volunteers waste time & effort</li>
            </ul>
          </div>

          <div className="arrow-connector">
            <ArrowRight size={24} />
          </div>

          <div className="solution-card">
            <h3>With SevaSetu (The Clarity)</h3>
            <ul>
              <li><CheckCircle2 size={18} className="text-moss" /> All requests in one verified system</li>
              <li><CheckCircle2 size={18} className="text-moss" /> AI prioritization & smart matching</li>
              <li><CheckCircle2 size={18} className="text-moss" /> Real-time visibility for everyone</li>
              <li><CheckCircle2 size={18} className="text-moss" /> Proof-based verification & trust layer</li>
              <li><CheckCircle2 size={18} className="text-moss" /> Volunteers act with confidence</li>
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
