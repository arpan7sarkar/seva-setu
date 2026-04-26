import { ArrowRight, CheckCircle2 } from 'lucide-react';

const FinalCtaSection = () => {
  return (
    <section className="landing-section final-cta-revamp">
      <div className="container-lg">
        <div className="cta-content centered">
          <h2 className="landing-heading">Don’t let help get lost in chaos.</h2>
          <p className="landing-subcopy">Join SevaSetu and coordinate real impact today.</p>
          
          <div className="cta-actions">
            <button className="btn-primary-large">
              Get Started for Free <ArrowRight size={20} />
            </button>
            <button className="btn-ghost-large">
              Book a Demo
            </button>
          </div>

          <div className="cta-checkmarks">
            <div className="checkmark-item"><CheckCircle2 size={18} /> No credit card required</div>
            <div className="checkmark-item"><CheckCircle2 size={18} /> Free for NGOs</div>
            <div className="checkmark-item"><CheckCircle2 size={18} /> Setup in minutes</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FinalCtaSection;
