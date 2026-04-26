import { MapPin, Camera, LockKeyhole } from 'lucide-react';

const TrustSection = () => {
  const trustItems = [
    {
      icon: <MapPin size={24} />,
      title: "Geospatial Accuracy",
      desc: "Integrated PostGIS ensures every report and volunteer movement is anchored to verified coordinates.",
      img: "https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&q=80&w=400"
    },
    {
      icon: <Camera size={24} />,
      title: "Photo Proofing",
      desc: "EXIF and OCR validation of completion photos ensures proof-backed impact for NGO reporting.",
      img: "https://images.unsplash.com/photo-1542810634-71277d95dcbb?auto=format&fit=crop&q=80&w=400"
    },
    {
      icon: <LockKeyhole size={24} />,
      title: "Secure Coordination",
      desc: "Granular RBAC ensures field workers, coordinators, and volunteers see only what is mission-critical.",
      img: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=400"
    }
  ];

  return (
    <section className="landing-section trust-revamp">
      <div className="container-lg">
        <div className="section-header centered">
          <h2 className="landing-heading">Trust is built into every step</h2>
        </div>

        <div className="trust-grid">
          {trustItems.map((item, idx) => (
            <div key={idx} className="trust-card">
              <div className="trust-card-content">
                <div className="trust-icon-box">{item.icon}</div>
                <h3>{item.title}</h3>
                <p>{item.desc}</p>
              </div>
              <div className="trust-card-image">
                <img src={item.img} alt={item.title} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrustSection;
