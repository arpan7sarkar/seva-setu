import { Heart, Globe } from 'lucide-react';
import { Link } from 'react-router-dom';

const FinalCtaSection = () => {
  return (
    <section className="landing-section final-cta-revamp">
      <div className="container-lg">
        <div className="cta-content centered">
          <div className="cta-icon-wrapper">
            <Heart className="heart-icon" size={48} />
          </div>
          <h2 className="landing-heading">Empower your mission. Coordinate for good.</h2>
          <p className="landing-subcopy">
            SevaSetu is a <strong>free, open-access platform</strong> dedicated to helping NGOs and volunteers 
            reach those in need faster. Join our network of relief teams today.
          </p>
          
          <div className="cta-actions">
            <Link to="/register" className="btn-primary-large">
              Join the Network
              <Globe size={20} />
            </Link>
          </div>

          <div className="cta-checkmarks">
            <div className="checkmark-item"><Heart size={18} fill="currentColor" /> 100% Free for NGOs</div>
            <div className="checkmark-item"><Heart size={18} fill="currentColor" /> Community Driven</div>
            <div className="checkmark-item"><Heart size={18} fill="currentColor" /> Instant Mission Setup</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FinalCtaSection;
