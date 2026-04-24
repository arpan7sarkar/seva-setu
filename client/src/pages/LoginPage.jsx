import { SignIn, useAuth } from '@clerk/react';
import { Navigate } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';

const LoginPage = () => {
  const { isSignedIn, isLoaded } = useAuth();

  // Already signed in → let PostLoginRedirect handle role detection & routing
  if (isLoaded && isSignedIn) {
    return <Navigate to="/post-login" replace />;
  }

  return (
    <MainLayout>
      <section className="container-lg auth-shell">
        <div className="auth-card-wrap">
          <div className="auth-card">
            <p className="landing-eyebrow">Account Access</p>
            <h1 className="auth-title">Sign in to SevaSetu</h1>
            <p className="auth-subtitle">
              Continue coordinating response operations in your command workspace.
            </p>
            <SignIn
              routing="path"
              path="/login"
              fallbackRedirectUrl="/post-login"
              signUpUrl="/register"
            />
          </div>
        </div>
      </section>
    </MainLayout>
  );
};

export default LoginPage;
