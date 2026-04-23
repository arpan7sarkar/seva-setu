import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import {
  SignedIn,
  SignedOut,
  RedirectToSignIn,
  SignIn,
  SignUp,
} from '@clerk/clerk-react';
import FieldForm from './pages/FieldForm';
import LandingPage from './pages/LandingPage';

function App() {
  return (
    <Router>
      <Routes>
        {/* Public */}
        <Route path="/" element={<LandingPage />} />
        <Route
          path="/sign-in/*"
          element={
            <div className="min-h-screen flex items-center justify-center bg-surface-primary">
              <SignIn routing="path" path="/sign-in" afterSignInUrl="/field" />
            </div>
          }
        />
        <Route
          path="/sign-up/*"
          element={
            <div className="min-h-screen flex items-center justify-center bg-surface-primary">
              <SignUp routing="path" path="/sign-up" afterSignUpUrl="/field" />
            </div>
          }
        />

        {/* Protected */}
        <Route
          path="/field"
          element={
            <>
              <SignedIn>
                <FieldForm />
              </SignedIn>
              <SignedOut>
                <RedirectToSignIn />
              </SignedOut>
            </>
          }
        />
        <Route
          path="/dashboard"
          element={
            <>
              <SignedIn>
                <div className="p-10 text-text-primary">Dashboard — Coming Phase 3.4</div>
              </SignedIn>
              <SignedOut>
                <RedirectToSignIn />
              </SignedOut>
            </>
          }
        />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
