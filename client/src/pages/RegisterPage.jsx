import { SignUp, useAuth } from '@clerk/react';
import { Navigate } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';

const RegisterPage = () => {
  const { isSignedIn, isLoaded } = useAuth();

  // Already signed in → PostLoginRedirect decides what to show
  if (isLoaded && isSignedIn) {
    return <Navigate to="/post-login" replace />;
  }

  return (
    <MainLayout>
      <section className="container-lg auth-shell">
        <div className="auth-card-wrap">
          <div className="auth-card">
            <p className="landing-eyebrow">Create Account</p>
            <h1 className="auth-title">Join SevaSetu</h1>
            <p className="auth-subtitle">
              Sign up and select your role to start making an impact.
            </p>
            <SignUp
              routing="path"
              path="/register"
              fallbackRedirectUrl="/post-login"
              signInUrl="/login"
            />
          </div>
        </div>
      </section>
    </MainLayout>
  );
};

export default RegisterPage;
