import { SignUp } from '@clerk/react';
import MainLayout from '../layouts/MainLayout';

const RegisterPage = () => (
  <MainLayout>
    <section className="container-lg py-12">
      <div className="max-w-md mx-auto card p-6">
        <p className="landing-eyebrow">Create Account</p>
        <h1 className="text-2xl font-bold text-text-primary mb-4">Join SevaSetu</h1>
        <SignUp routing="path" path="/register" fallbackRedirectUrl="/dashboard" signInUrl="/login" />
      </div>
    </section>
  </MainLayout>
);

export default RegisterPage;
