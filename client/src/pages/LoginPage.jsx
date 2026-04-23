import { SignIn } from '@clerk/react';
import MainLayout from '../layouts/MainLayout';

const LoginPage = () => (
  <MainLayout>
    <section className="container-lg py-12">
      <div className="max-w-md mx-auto card p-6">
        <p className="landing-eyebrow">Account Access</p>
        <h1 className="text-2xl font-bold text-text-primary mb-4">Sign in to SevaSetu</h1>
        <SignIn routing="path" path="/login" fallbackRedirectUrl="/dashboard" signUpUrl="/register" />
      </div>
    </section>
  </MainLayout>
);

export default LoginPage;
