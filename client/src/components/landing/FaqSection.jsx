import SectionIntro from './SectionIntro';
import { FAQ_ITEMS } from './content';

const FaqSection = () => (
  <section className="landing-section landing-faq-section">
    <div className="container-lg landing-faq-grid">
      <SectionIntro
        eyebrow="Questions"
        title="The essentials a coordinator should understand before trying it."
      />

      <div className="faq-list">
        {FAQ_ITEMS.map((item) => (
          <article key={item.question} className="faq-item">
            <h3>{item.question}</h3>
            <p>{item.answer}</p>
          </article>
        ))}
      </div>
    </div>
  </section>
);

export default FaqSection;
