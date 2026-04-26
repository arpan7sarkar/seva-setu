import { Quote } from 'lucide-react';

const ImpactSection = () => {
  return (
    <section className="landing-section impact-revamp" id="impact">
      <div className="container-lg">
        <div className="impact-grid">
          <div className="impact-text">
            <p className="impact-eyebrow">Real Impact. Real People.</p>
            <h2 className="impact-heading">
              During the Assam floods, we coordinated 120+ volunteers and delivered aid within hours.
            </h2>
            
            <div className="impact-stats">
              <div className="impact-stat">
                <strong>120+</strong>
                <span>Volunteers Mobilized</span>
              </div>
              <div className="impact-stat">
                <strong>350+</strong>
                <span>Requests Resolved</span>
              </div>
              <div className="impact-stat">
                <strong>18</strong>
                <span>Villages Reached</span>
              </div>
            </div>
          </div>

          <div className="impact-visual">
            <div className="impact-img-container">
              <img src="/images/flood-relief.png" alt="Assam Floods Relief Efforts" />
              <div className="impact-quote-card">
                <Quote size={24} className="quote-icon" />
                <p>
                  "SevaSetu helped us move from chaos to clarity. We finally had one source of truth we could trust."
                </p>
                <div className="quote-author">
                  <strong>Anjali Sharma</strong>
                  <span>Coordinator, Hope Foundation</span>
                </div>
              </div>
              <div className="impact-carousel-dots">
                <span className="dot active" />
                <span className="dot" />
                <span className="dot" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ImpactSection;
