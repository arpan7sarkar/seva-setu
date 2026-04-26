import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, AlertCircle, Clock, CheckCircle, XCircle, FileText, WifiOff } from 'lucide-react';
import api from '../services/api';
import { getQueuedNeedSubmissions } from '../services/offlineQueue';

const ReporterStatusList = () => {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    fetchIssues();
  }, []);

  const fetchIssues = async () => {
    try {
      setLoading(true);
      let onlineIssues = [];
      
      // Fetch online issues if possible
      if (navigator.onLine) {
        try {
          const res = await api.get('/needs'); 
          onlineIssues = res.data;
        } catch (e) {
          console.error("Failed to fetch online issues:", e);
        }
      }

      // Fetch offline queue
      const queued = await getQueuedNeedSubmissions();
      const offlineIssues = queued.map(q => ({
        id: `queued-${q.id}`,
        title: q.payload.title || 'Offline Draft',
        district: q.payload.district || 'Unknown',
        created_at: q.timestamp || new Date().toISOString(),
        status: 'queued'
      }));

      // Combine queues and sort by newest first (descending)
      const combinedIssues = [...offlineIssues, ...onlineIssues];
      combinedIssues.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      
      setIssues(combinedIssues);
    } catch (err) {
      console.error('Failed to compile issues', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const getStatusConfig = (status) => {
    switch (status) {
      case 'queued':
        return { icon: <WifiOff className="w-4 h-4" />, color: 'text-purple-400', bg: 'bg-purple-400/10', border: 'border-purple-400/20' };
      case 'pending':
        return { icon: <Clock className="w-4 h-4" />, color: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-400/20' };
      case 'accepted':
      case 'assigned':
      case 'in_progress':
        return { icon: <CheckCircle className="w-4 h-4" />, color: 'text-sky-400', bg: 'bg-sky-400/10', border: 'border-sky-400/20' };
      case 'completed':
        return { icon: <CheckCircle className="w-4 h-4" />, color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/20' };
      case 'rejected':
        return { icon: <XCircle className="w-4 h-4" />, color: 'text-rose-400', bg: 'bg-rose-400/10', border: 'border-rose-400/20' };
      default:
        return { icon: <FileText className="w-4 h-4" />, color: 'text-slate-400', bg: 'bg-slate-400/10', border: 'border-slate-400/20' };
    }
  };

  if (loading) {
    return <div className="text-center py-8 text-slate-400 font-jakarta">Loading submission history...</div>;
  }

  if (issues.length === 0) {
    return null;
  }

  return (
    <div className="mt-16 font-jakarta">
      <h2 className="text-2xl font-black text-white mb-6">Submission History</h2>
      <div className="space-y-4">
        {issues.map(issue => {
          const config = getStatusConfig(issue.status);
          const isRejected = issue.status === 'rejected';
          const isExpanded = expandedId === issue.id;

          return (
            <div 
              key={issue.id} 
              className="relative overflow-hidden rounded-2xl backdrop-blur-md bg-white/5 border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] transition-all duration-300"
            >
              {/* Liquid glass highlight */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 hover:opacity-100 transition-opacity pointer-events-none" />
              
              <div 
                className="p-5 flex items-center justify-between cursor-pointer relative z-10"
                onClick={() => isRejected && toggleExpand(issue.id)}
              >
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-bold text-white/90">{issue.title}</span>
                  <span className="text-xs text-white/50">{new Date(issue.created_at).toLocaleDateString()} • {issue.district}</span>
                </div>
                
                <div className="flex items-center gap-3">
                  <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border ${config.bg} ${config.color} ${config.border}`}>
                    {config.icon}
                    {issue.status}
                  </span>
                  
                  {isRejected && (
                    <motion.div
                      animate={{ rotate: isExpanded ? 180 : 0 }}
                      transition={{ duration: 0.3 }}
                      className="text-slate-400 p-1 bg-white/5 rounded-full"
                    >
                      <ChevronDown className="w-5 h-5" />
                    </motion.div>
                  )}
                </div>
              </div>

              <AnimatePresence>
                {isExpanded && isRejected && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                    className="overflow-hidden"
                  >
                    <div className="p-5 pt-0 border-t border-white/5 bg-rose-500/5">
                      <div className="flex gap-3 items-start mt-4">
                        <div className="p-2 bg-rose-500/20 rounded-lg">
                          <AlertCircle className="w-5 h-5 text-rose-400" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-rose-400 uppercase tracking-widest mb-1">Rejection Reason</p>
                          <p className="text-sm text-rose-200/80 leading-relaxed">
                            {issue.rejection_reason || 'Image clarity insufficient or duplicate entry.'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ReporterStatusList;
