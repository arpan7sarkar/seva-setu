import SectionIntro from './SectionIntro';
import { FEATURE_GROUPS } from './content';

const CapabilitiesSection = () => (
  <section className="landing-section">
    <div className="container-lg space-y-10">
      <SectionIntro
        eyebrow="What The Platform Does"
        title="One operating rhythm from first report to verified closure."
        description="The landing page now explains SevaSetu as a human workflow, not just a technical system."
      />

      <div className="landing-feature-grid">
        {FEATURE_GROUPS.map((feature) => (
          <article key={feature.title} className="landing-feature-card">
            <h3>{feature.title}</h3>
            <p>{feature.description}</p>
            <ul>
              {feature.points.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </div>
  </section>
);

export default CapabilitiesSection;

