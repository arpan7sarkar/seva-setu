import MainLayout from '../layouts/MainLayout';

const VolunteerPage = () => (
  <MainLayout>
    <section className="container-lg py-12">
      <div className="card p-8">
        <p className="landing-eyebrow">Volunteer Console</p>
        <h1 className="text-2xl font-bold text-text-primary">Volunteer workspace is connected at /volunteer.</h1>
        <p className="mt-3 text-text-secondary">
          This route is now in place for the upcoming Phase 3.5 task implementation.
        </p>
      </div>
    </section>
  </MainLayout>
);

export default VolunteerPage;
