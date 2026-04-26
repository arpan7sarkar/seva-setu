import React from 'react';
import MainLayout from '../layouts/MainLayout';
import ReporterStatusList from '../components/ReporterStatusList';
import { FileText } from 'lucide-react';

const MyReportsPage = () => {
  return (
    <MainLayout>
      <div className="py-12 min-h-[70vh] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="container-narrow px-4">
          <div className="mb-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center mx-auto mb-6">
              <FileText className="w-8 h-8 text-sky-400" />
            </div>
            <h1 className="text-4xl font-black text-white tracking-tight mb-4 bg-clip-text text-transparent bg-gradient-to-r from-sky-400 to-indigo-400">
              My Reports
            </h1>
            <p className="text-lg text-slate-400 max-w-lg mx-auto">
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
