import React from 'react';
import MainLayout from '../layouts/MainLayout';
import ReporterStatusList from '../components/ReporterStatusList';
import { FileText } from 'lucide-react';

const MyReportsPage = () => {
  return (
    <MainLayout>
      <div style={{ background: '#f8fafc', minHeight: '70vh', paddingBlock: 'clamp(2rem, 3vw, 3.5rem)' }}>
        <div className="container-narrow">

          {/* Header */}
          <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
            <div style={{
              width: 64, height: 64, borderRadius: 16,
              background: 'rgba(45, 97, 72, 0.06)',
              border: '1px solid rgba(45, 97, 72, 0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 1.25rem',
            }}>
              <FileText style={{ width: 30, height: 30, color: '#2d6148' }} />
            </div>
            <h1 style={{
              fontSize: 'clamp(1.6rem, 3vw, 2.25rem)', fontWeight: 900,
              color: '#0f171d', letterSpacing: '-0.02em', marginBottom: '0.6rem',
            }}>
              My Reports
            </h1>
            <p style={{ fontSize: '1rem', color: '#475569', maxWidth: '34rem', margin: '0 auto', lineHeight: 1.6 }}>
              Track the live status of the community needs you have reported.
            </p>
          </div>

          <ReporterStatusList />
        </div>
      </div>
    </MainLayout>
  );
};

export default MyReportsPage;
