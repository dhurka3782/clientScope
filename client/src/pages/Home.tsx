import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Copy, Download, Loader2, Check, Zap, Target, Layers, Clock, DollarSign, Save, Send, Mail, Building2, Target as TargetIcon, Wallet, Timer, Monitor, Sparkles, ArrowRight, Briefcase } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth, apiPost, apiGet } from '@/contexts/AuthContext';
import SendProposalModal from '@/components/SendProposalModal';

/**
Design Philosophy: Premium Minimalist with Depth
Deep Indigo (#1e3a8a) primary + Teal (#0891b2) accents
Asymmetric split layout (form left, preview right)
Poppins display + Inter body fonts
Smooth 200-300ms transitions, staggered card reveals
*/

interface FormData {
  businessType: string;
  goal: string;
  budget: string;
  timeline: string;
  platform: string;
}

interface ProposalData {
  title: string;
  problemSummary: string;
  stack: string[];
  deliverables: string[];
  timeline: { phase: string; duration: string; tasks: string[] }[];
  budgetSplit: { category: string; percentage: number; amount: string }[];
  nextSteps: string;
}

const templateGenerateProposal = (data: FormData): ProposalData => {
  const budgetRanges: Record<string, { min: number; max: number }> = {
    'under-5k': { min: 1000, max: 5000 },
    '5k-15k': { min: 5000, max: 15000 },
    '15k-50k': { min: 15000, max: 50000 },
    'over-50k': { min: 50000, max: 150000 },
  };
  const range = budgetRanges[data.budget] || { min: 10000, max: 30000 };
  const avgBudget = (range.min + range.max) / 2;

  const stackMap: Record<string, string[]> = {
    web: ['Next.js', 'TypeScript', 'Tailwind CSS', 'PostgreSQL', 'Vercel'],
    mobile: ['React Native', 'Expo', 'Firebase', 'Redux', 'App Store'],
    ecommerce: ['Shopify', 'Next.js', 'Stripe', 'PostgreSQL', 'Vercel'],
    saas: ['Next.js', 'TypeScript', 'Prisma', 'PostgreSQL', 'AWS'],
    other: ['React', 'Node.js', 'MongoDB', 'Docker', 'Cloud Platform'],
  };
  const stack = stackMap[data.platform] || stackMap.other;

  const timelineMap: Record<string, number> = {
    '2-4-weeks': 2,
    '1-3-months': 6,
    '3-6-months': 12,
    '6-plus-months': 20,
  };
  const weeks = timelineMap[data.timeline] || 8;

  return {
    title: `${data.businessType} - ${data.goal.split(' ').slice(0, 3).join(' ')} Platform`,
    problemSummary: `Transform your ${data.businessType} business with a custom ${data.platform === 'web' ? 'web' : data.platform === 'mobile' ? 'mobile' : data.platform} solution. Our team will deliver a scalable, modern platform that addresses your core business needs: ${data.goal}. This proposal outlines our strategic approach, technical stack, and timeline to bring your vision to life.`,
    stack,
    deliverables: [
      'Fully responsive design and user interface',
      'Backend API with authentication and security',
      'Database design and optimization',
      'Third-party integrations',
      'Testing and quality assurance',
      'Deployment and hosting setup',
      'Documentation and knowledge transfer',
      'Post-launch support (30 days)',
    ],
    timeline: [
      {
        phase: 'Discovery & Planning',
        duration: `${Math.ceil(weeks * 0.15)} weeks`,
        tasks: [
          'Requirements gathering and analysis',
          'Wireframing and user flow design',
          'Technical architecture planning',
          'Project kickoff and team alignment',
        ],
      },
      {
        phase: 'Design & Prototyping',
        duration: `${Math.ceil(weeks * 0.2)} weeks`,
        tasks: [
          'High-fidelity UI/UX design',
          'Interactive prototypes',
          'Design system documentation',
          'Client feedback and iterations',
        ],
      },
      {
        phase: 'Development',
        duration: `${Math.ceil(weeks * 0.45)} weeks`,
        tasks: [
          'Frontend development',
          'Backend API development',
          'Database implementation',
          'Feature integration and testing',
        ],
      },
      {
        phase: 'Testing & Deployment',
        duration: `${Math.ceil(weeks * 0.2)} weeks`,
        tasks: [
          'Quality assurance and bug fixes',
          'Performance optimization',
          'Security audit',
          'Production deployment',
        ],
      },
    ],
    budgetSplit: [
      { category: 'Design & UX', percentage: 20, amount: `$${Math.round(avgBudget * 0.2).toLocaleString()}` },
      { category: 'Frontend Development', percentage: 30, amount: `$${Math.round(avgBudget * 0.3).toLocaleString()}` },
      { category: 'Backend Development', percentage: 35, amount: `$${Math.round(avgBudget * 0.35).toLocaleString()}` },
      { category: 'Testing & Deployment', percentage: 15, amount: `$${Math.round(avgBudget * 0.15).toLocaleString()}` },
    ],
    nextSteps: 'Schedule a 30-minute discovery call to discuss your specific requirements, timeline, and budget. We\'ll provide a detailed project plan and answer any questions you may have.',
  };
};

// Form field configuration with icons
const formFields = [
  {
    key: 'businessType' as keyof FormData,
    label: 'What type of business are you building for?',
    placeholder: 'Select business type',
    icon: Building2,
    type: 'select' as const,
    options: [
      { value: 'SaaS', label: 'SaaS Platform' },
      { value: 'E-commerce', label: 'E-commerce Store' },
      { value: 'Marketplace', label: 'Marketplace' },
      { value: 'Content', label: 'Content Platform' },
      { value: 'Other', label: 'Other' },
    ],
  },
  {
    key: 'goal' as keyof FormData,
    label: "What's your main goal?",
    placeholder: 'e.g., Help teams collaborate on projects in real-time',
    icon: TargetIcon,
    type: 'textarea' as const,
  },
  {
    key: 'budget' as keyof FormData,
    label: 'Budget Range',
    placeholder: 'Select budget range',
    icon: Wallet,
    type: 'select' as const,
    options: [
      { value: 'under-5k', label: 'Under $5,000' },
      { value: '5k-15k', label: '$5,000 - $15,000' },
      { value: '15k-50k', label: '$15,000 - $50,000' },
      { value: 'over-50k', label: '$50,000+' },
    ],
  },
  {
    key: 'timeline' as keyof FormData,
    label: 'Desired Timeline',
    placeholder: 'Select timeline',
    icon: Timer,
    type: 'select' as const,
    options: [
      { value: '2-4-weeks', label: '2-4 weeks' },
      { value: '1-3-months', label: '1-3 months' },
      { value: '3-6-months', label: '3-6 months' },
      { value: '6-plus-months', label: '6+ months' },
    ],
  },
  {
    key: 'platform' as keyof FormData,
    label: 'Preferred Platform',
    placeholder: 'Select platform',
    icon: Monitor,
    type: 'select' as const,
    options: [
      { value: 'web', label: 'Web Application' },
      { value: 'mobile', label: 'Mobile App' },
      { value: 'ecommerce', label: 'E-commerce' },
      { value: 'saas', label: 'SaaS' },
      { value: 'other', label: 'Other' },
    ],
  },
];

export default function Home() {
  const { user, token } = useAuth();
  const [location, setLocation] = useLocation();
  const [formData, setFormData] = useState<FormData>({
    businessType: '',
    goal: '',
    budget: '',
    timeline: '',
    platform: '',
  });
  const [proposal, setProposal] = useState<ProposalData | null>(null);
  const [loading, setLoading] = useState(false);
  const [showProposal, setShowProposal] = useState(false);
  const [savedProposalId, setSavedProposalId] = useState<number | null>(null);
  const [showSendModal, setShowSendModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [viewLoading, setViewLoading] = useState(false);

  // Load proposal from URL query param ?proposalId=...
  useEffect(() => {
    const params = new URLSearchParams(location.split('?')[1] || '');
    const proposalId = params.get('proposalId');
    if (!proposalId || !token) return;

    const fetchProposal = async () => {
      setViewLoading(true);
      try {
        const data = await apiGet(`/api/proposals/${proposalId}`, token);
        // The API returns proposal_data as the parsed JSON with the proposal structure
        if (data.proposal_data) {
          setProposal(data.proposal_data);
          setSavedProposalId(data.id);
          setShowProposal(true);
          toast.success('Proposal loaded');
        }
      } catch (err: any) {
        toast.error(err.message || 'Failed to load proposal');
      } finally {
        setViewLoading(false);
      }
    };

    fetchProposal();
  }, [location, token]);

  const completedFields = Object.values(formData).filter((v) => v).length;
  const progressPercentage = (completedFields / 5) * 100;
  const isFormComplete = Object.values(formData).every((v) => v);

  const handleGenerateProposal = async () => {
    if (!isFormComplete) return;
    setLoading(true);
    setSavedProposalId(null);

    try {
      if (user && token) {
        try {
          const data = await apiPost('/api/proposals/generate', formData, token);
          if (data.source === 'ai' && data.proposal) {
            setProposal(data.proposal);
            setShowProposal(true);
            setLoading(false);
            toast.success('AI-powered proposal generated!');
            return;
          }
        } catch (err: any) {
          console.warn('AI generation failed, falling back to template:', err.message);
        }
      }

      await new Promise((resolve) => setTimeout(resolve, 800));
      const generated = templateGenerateProposal(formData);
      setProposal(generated);
      setShowProposal(true);
      setLoading(false);
      toast.success('Proposal generated successfully!');

      if (user && token) {
        try {
          await apiPost('/api/proposals', {
            title: generated.title,
            businessType: formData.businessType,
            goal: formData.goal,
            budget: formData.budget,
            timeline: formData.timeline,
            platform: formData.platform,
            proposalData: generated,
          }, token);
          toast.success('Proposal saved to your account!');
        } catch {
          // Silent fail for auto-save
        }
      }
    } catch (err) {
      console.error('Generation error:', err);
      toast.error('Failed to generate proposal');
      setLoading(false);
    }
  };

  const handleSaveProposal = async () => {
    if (!proposal || !user || !token) {
      toast.error('Please sign in to save proposals');
      return;
    }
    setSaving(true);
    try {
      const data = await apiPost('/api/proposals', {
        title: proposal.title,
        businessType: formData.businessType,
        goal: formData.goal,
        budget: formData.budget,
        timeline: formData.timeline,
        platform: formData.platform,
        proposalData: proposal,
      }, token);

      setSavedProposalId(data.id);
      toast.success('Proposal saved!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to save proposal');
    } finally {
      setSaving(false);
    }
  };

  const handleCopyProposal = () => {
    if (!proposal) return;
    const text = `
${proposal.title}

PROBLEM SUMMARY
${proposal.problemSummary}

RECOMMENDED STACK
${proposal.stack.join(' • ')}

DELIVERABLES
${proposal.deliverables.map((d) => `• ${d}`).join('\n')}

PROJECT TIMELINE
${proposal.timeline.map((p) => `${p.phase} (${p.duration})\n${p.tasks.map((t) => `  - ${t}`).join('\n')}`).join('\n\n')}

BUDGET BREAKDOWN
${proposal.budgetSplit.map((b) => `${b.category}: ${b.percentage}% (${b.amount})`).join('\n')}

NEXT STEPS
${proposal.nextSteps}
`.trim();
    navigator.clipboard.writeText(text);
    toast.success('Proposal copied to clipboard!');
  };

  const handleDownloadPDF = () => {
    if (!proposal) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Please allow popups to download PDF');
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${proposal.title}</title>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Poppins:wght@600;700&display=swap" rel="stylesheet">
        <style>
          @page { margin: 20mm; }
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: 'Inter', sans-serif; color: #1e293b; line-height: 1.6; padding: 40px; }
          h1 { font-family: 'Poppins', sans-serif; font-size: 28px; color: #1e3a8a; margin-bottom: 8px; }
          h2 { font-family: 'Poppins', sans-serif; font-size: 20px; color: #1e3a8a; margin-top: 32px; border-bottom: 2px solid #0891b2; padding-bottom: 8px; }
          .meta { color: #64748b; font-size: 14px; margin-bottom: 32px; }
          .stack { display: flex; flex-wrap: wrap; gap: 8px; margin: 12px 0; }
          .stack-item { background: #f1f5f9; padding: 6px 14px; border-radius: 6px; font-size: 13px; color: #1e3a8a; font-weight: 500; }
          .deliverable { margin: 8px 0; padding-left: 16px; border-left: 3px solid #0891b2; }
          .phase { margin: 16px 0; padding: 16px; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; }
          .phase h3 { color: #0891b2; margin: 0 0 4px; }
          .phase .duration { color: #64748b; font-size: 13px; }
          .budget-item { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e2e8f0; }
          .budget-item:last-child { border-bottom: none; }
          .next-steps { margin-top: 32px; padding: 24px; background: linear-gradient(135deg, #eef2ff, #ecfeff); border-radius: 8px; border: 1px solid #1e3a8a20; }
          hr { border: none; border-top: 1px solid #e2e8f0; margin: 24px 0; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>
        <h1>${proposal.title}</h1>
        <p class="meta">Professional Project Proposal</p>
        <hr />
        <h2>Problem Summary</h2>
        <p>${proposal.problemSummary}</p>
        <h2>Recommended Stack</h2>
        <div class="stack">
          ${proposal.stack.map((tech: string) => `<span class="stack-item">${tech}</span>`).join('')}
        </div>
        <h2>Deliverables</h2>
        ${proposal.deliverables.map((d: string) => `<div class="deliverable">${d}</div>`).join('')}
        <h2>Project Timeline</h2>
        ${proposal.timeline.map((phase: any) => `
          <div class="phase">
            <h3>${phase.phase}</h3>
            <div class="duration">${phase.duration}</div>
            <ul style="margin-top: 8px; padding-left: 20px;">
              ${phase.tasks.map((task: string) => `<li>${task}</li>`).join('')}
            </ul>
          </div>
        `).join('')}
        <h2>Budget Breakdown</h2>
        ${proposal.budgetSplit.map((b: any) => `
          <div class="budget-item">
            <span>${b.category} (${b.percentage}%)</span>
            <span style="font-weight: 600; color: #0891b2;">${b.amount}</span>
          </div>
        `).join('')}
        <h2>Next Steps</h2>
        <div class="next-steps">
          <p>${proposal.nextSteps}</p>
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();

    setTimeout(() => {
      printWindow.print();
    }, 500);

    toast.success('PDF dialog opened');
  };

  // Show loading screen when fetching a proposal from URL param
  if (viewLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
          <p className="mt-4 text-muted-foreground">Loading proposal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      {!showProposal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="relative h-[500px] overflow-hidden bg-gradient-to-br from-primary via-primary/80 to-accent/60"
        >
          <div
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage: `url('https://d2xsxph8kpxj0f.cloudfront.net/310419663031206766/DEUtTJbrRtvttNsWTanYwv/hero-background-gdA7NByfivFprPiE6qgeWA.webp')`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
          <div className="relative z-10 mx-auto flex h-full max-w-3xl flex-col items-center justify-center px-4 text-center -translate-y-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <h1 className="text-4xl font-bold text-white md:text-5xl lg:text-6xl" style={{ fontFamily: 'Poppins' }}>
                Turn a Brief Into a Proposal in Seconds
              </h1>
            </motion.div>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mt-6 text-lg text-white/90 md:text-xl"
            >
              Answer 5 quick questions and get a professional project proposal with timeline, deliverables, and budget breakdown.
            </motion.p>
          </div>
        </motion.div>
      )}

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-4 py-12 md:py-16" style={!showProposal ? {} : { paddingTop: '5rem' }}>
        {!showProposal ? (
          <div className="grid gap-8 md:grid-cols-2">
            {/* ===== MODERN FORM SECTION ===== */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              <div className="sticky top-8">
                {/* Glassmorphism Card */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white via-slate-50 to-indigo-50/30 p-8 shadow-2xl shadow-indigo-500/10 backdrop-blur-xl dark:from-slate-900 dark:via-slate-800 dark:to-indigo-900/20"
                >
                  {/* Decorative gradient orbs */}
                  <div className="pointer-events-none absolute -top-24 -right-24 h-48 w-48 rounded-full bg-gradient-to-br from-indigo-500/20 to-cyan-500/20 blur-3xl" />
                  <div className="pointer-events-none absolute -bottom-24 -left-24 h-48 w-48 rounded-full bg-gradient-to-br from-cyan-500/10 to-indigo-500/10 blur-3xl" />

                  {/* Header */}
                  <div className="relative mb-8">
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.5, delay: 0.3 }}
                      className="mb-4 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-indigo-500/10 to-cyan-500/10 px-4 py-1.5 text-sm font-medium text-indigo-700 dark:text-indigo-300"
                    >
                      {/* <Briefcase className="h-4 w-4" /> */}
                      Project Brief
                    </motion.div>
                    <motion.h2
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.35 }}
                      className="text-2xl font-bold text-slate-900 dark:text-white"
                      style={{ fontFamily: 'Poppins' }}
                    >
                      Tell us about your project
                    </motion.h2>
                    <motion.p
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.4 }}
                      className="mt-1 text-sm text-slate-500 dark:text-slate-400"
                    >
                      Fill in the details below to generate your proposal
                    </motion.p>
                  </div>

                  {/* Progress Bar */}
                  <motion.div
                    initial={{ opacity: 0, scaleX: 0 }}
                    animate={{ opacity: 1, scaleX: 1 }}
                    transition={{ duration: 0.6, delay: 0.5 }}
                    className="mb-8"
                  >
                    <div className="mb-2 flex items-center justify-between text-xs font-medium">
                      <span className="text-slate-500 dark:text-slate-400">Progress</span>
                      <span className="text-indigo-600 dark:text-indigo-400">
                        {completedFields} of 5 completed
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progressPercentage}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                        className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-indigo-600 to-cyan-500"
                      />
                    </div>
                  </motion.div>

                  {/* Form Fields */}
                  <div className="relative space-y-5">
                    {formFields.map((field, index) => {
                      const Icon = field.icon;
                      const isFilled = formData[field.key] !== '';
                      const isFocused = focusedField === field.key;

                      return (
                        <motion.div
                          key={field.key}
                          initial={{ opacity: 0, y: 15 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.4, delay: 0.15 * index }}
                        >
                          <div
                            className={`group relative rounded-xl border-2 transition-all duration-300 ${
                              isFocused
                                ? 'border-indigo-500 bg-white shadow-lg shadow-indigo-500/10 dark:bg-slate-800'
                                : isFilled
                                ? 'border-cyan-200 bg-white/80 dark:border-cyan-800 dark:bg-slate-800/80'
                                : 'border-slate-200 bg-white/60 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800/60 dark:hover:border-slate-600'
                            }`}
                          >
                            {/* Field Icon Badge */}
                            <div
                              className={`absolute -top-3 left-4 z-10 flex h-6 w-6 items-center justify-center rounded-lg transition-all duration-300 ${
                                isFocused
                                  ? 'bg-gradient-to-br from-indigo-500 to-cyan-500 text-white shadow-md shadow-indigo-500/30'
                                  : isFilled
                                  ? 'bg-gradient-to-br from-cyan-400 to-cyan-500 text-white shadow-md shadow-cyan-500/30'
                                  : 'bg-slate-100 text-slate-400 dark:bg-slate-700 dark:text-slate-500'
                              }`}
                            >
                              <Icon className="h-3.5 w-3.5" />
                            </div>

                            {/* Check indicator */}
                            <AnimatePresence>
                              {isFilled && (
                                <motion.div
                                  initial={{ opacity: 0, scale: 0 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  exit={{ opacity: 0, scale: 0 }}
                                  transition={{ duration: 0.2 }}
                                  className="absolute -top-3 right-4 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-500 text-white shadow-md shadow-emerald-500/30"
                                >
                                  <Check className="h-3.5 w-3.5" />
                                </motion.div>
                              )}
                            </AnimatePresence>

                            <div className="px-4 pt-3 pb-4">
                              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                {field.label}
                              </label>

                              {field.type === 'textarea' ? (
                                <Textarea
                                  placeholder={field.placeholder}
                                  value={formData[field.key]}
                                  onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                                  onFocus={() => setFocusedField(field.key)}
                                  onBlur={() => setFocusedField(null)}
                                  className="min-h-20 resize-none border-0 bg-transparent p-0 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:ring-0 dark:text-white dark:placeholder:text-slate-500"
                                />
                              ) : (
                                <Select
                                  value={formData[field.key]}
                                  onValueChange={(v) => setFormData({ ...formData, [field.key]: v })}
                                >
                                  <SelectTrigger
                                    className={`w-full border-0 bg-transparent p-0 text-sm font-medium transition-colors ${
                                      formData[field.key]
                                        ? 'text-slate-900 dark:text-white'
                                        : 'text-slate-400 dark:text-slate-500'
                                    } focus:ring-0`}
                                  >
                                    <SelectValue placeholder={field.placeholder} />
                                  </SelectTrigger>
                                  <SelectContent className="border-slate-200 dark:border-slate-700">
                                    {field.options?.map((option) => (
                                      <SelectItem
                                        key={option.value}
                                        value={option.value}
                                        className="focus:bg-indigo-50 focus:text-indigo-700 dark:focus:bg-indigo-900/30 dark:focus:text-indigo-300"
                                      >
                                        {option.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>

                  {/* Generate Button */}
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.9 }}
                    className="mt-8"
                  >
                    <motion.button
                      onClick={handleGenerateProposal}
                      disabled={!isFormComplete || loading}
                      whileHover={isFormComplete && !loading ? { scale: 1.02, y: -2 } : {}}
                      whileTap={isFormComplete && !loading ? { scale: 0.98 } : {}}
                      className={`relative w-full overflow-hidden rounded-xl px-6 py-4 text-base font-semibold transition-all duration-300 ${
                        isFormComplete && !loading
                          ? 'bg-gradient-to-r from-indigo-600 via-indigo-700 to-cyan-600 text-white shadow-xl shadow-indigo-500/30 hover:shadow-2xl hover:shadow-indigo-500/40'
                          : 'bg-slate-200 text-slate-400 dark:bg-slate-700 dark:text-slate-500'
                      } disabled:cursor-not-allowed`}
                    >
                      {/* Shimmer effect */}
                      {isFormComplete && !loading && (
                        <motion.div
                          initial={{ x: '-100%' }}
                          animate={{ x: '100%' }}
                          transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                        />
                      )}

                      <span className="relative flex items-center justify-center gap-2">
                        {loading ? (
                          <>
                            <Loader2 className="h-5 w-5 animate-spin" />
                            <span>Generating Proposal...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-5 w-5" />
                            <span>Generate Proposal</span>
                            <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                          </>
                        )}
                      </span>
                    </motion.button>

                    {!isFormComplete && (
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="mt-3 text-center text-xs text-slate-400 dark:text-slate-500"
                      >
                        Complete all fields to generate your proposal
                      </motion.p>
                    )}
                  </motion.div>
                </motion.div>
              </div>
            </motion.div>

            {/* Preview Section */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.1 }}
              className="space-y-4"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="relative overflow-hidden rounded-2xl border-2 border-dashed border-slate-200 bg-gradient-to-br from-slate-50 to-indigo-50/30 p-12 text-center dark:border-slate-700 dark:from-slate-800 dark:to-indigo-900/10"
              >
                {/* Animated dots background */}
                <div className="absolute inset-0 opacity-30">
                  {[...Array(20)].map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: [0, 0.5, 0] }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        delay: i * 0.1,
                      }}
                      className="absolute h-1 w-1 rounded-full bg-indigo-400"
                      style={{
                        top: `${Math.random() * 100}%`,
                        left: `${Math.random() * 100}%`,
                      }}
                    />
                  ))}
                </div>

                <div className="relative">
                  <motion.div
                    animate={{
                      scale: [1, 1.1, 1],
                      rotate: [0, 5, -5, 0],
                    }}
                    transition={{ duration: 3, repeat: Infinity }}
                    className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500/10 to-cyan-500/10"
                  >
                    <Target className="h-10 w-10 text-indigo-500" />
                  </motion.div>
                  <h3 className="mb-2 text-lg font-semibold text-slate-700 dark:text-slate-300">
                    Your Proposal Preview
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Fill out the form and your professional proposal will appear here
                  </p>

                  {/* Feature pills */}
                  <div className="mt-6 flex flex-wrap justify-center gap-2">
                    {['Timeline', 'Budget', 'Deliverables', 'Tech Stack'].map((item, i) => (
                      <motion.span
                        key={item}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 + i * 0.1 }}
                        className="rounded-full bg-white/80 px-3 py-1 text-xs font-medium text-indigo-600 shadow-sm dark:bg-slate-700/80 dark:text-indigo-400"
                      >
                        {item}
                      </motion.span>
                    ))}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        ) : proposal ? (
          // Proposal View (unchanged)
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="space-y-8"
          >
            {/* Header with Actions */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-foreground" style={{ fontFamily: 'Poppins' }}>
                  {proposal.title}
                </h1>
                <p className="mt-2 text-muted-foreground">Professional project proposal</p>
              </div>
              <div className="flex flex-wrap gap-3">
                {user ? (
                  <Button
                    onClick={handleSaveProposal}
                    variant="outline"
                    disabled={saving}
                    className="border-border hover:bg-secondary"
                  >
                    <Save className="mr-2 h-4 w-4" />
                    {saving ? 'Saving...' : 'Save'}
                  </Button>
                ) : (
                  <Button
                    onClick={() => toast.info('Sign in to save proposals')}
                    variant="outline"
                    className="border-border hover:bg-secondary"
                  >
                    <Save className="mr-2 h-4 w-4" />
                    Save
                  </Button>
                )}
                <Button
                  onClick={handleCopyProposal}
                  variant="outline"
                  className="border-border hover:bg-secondary"
                >
                  <Copy className="mr-2 h-4 w-4" />
                  Copy
                </Button>
                <Button
                  onClick={handleDownloadPDF}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  <Download className="mr-2 h-4 w-4" />
                  PDF
                </Button>
                <Button
                  onClick={() => {
                    if (!user) {
                      toast.info('Sign in to email proposals');
                      return;
                    }
                    setShowSendModal(true);
                  }}
                  className="bg-accent hover:bg-accent/90 text-white"
                >
                  <Mail className="mr-2 h-4 w-4" />
                  Send
                </Button>
              </div>
            </div>

            {/* Problem Summary */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Card className="border-border bg-card p-8 shadow-md">
                <h2 className="mb-4 text-2xl font-bold text-foreground" style={{ fontFamily: 'Poppins' }}>
                  Problem Summary
                </h2>
                <p className="text-foreground leading-relaxed">{proposal.problemSummary}</p>
              </Card>
            </motion.div>

            {/* Tech Stack */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
            >
              <Card className="border-border bg-card p-8 shadow-md">
                <h2 className="mb-6 text-2xl font-bold text-foreground" style={{ fontFamily: 'Poppins' }}>
                  Recommended Stack
                </h2>
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">
                  {proposal.stack.map((tech, idx) => (
                    <motion.div
                      key={tech}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.2 + idx * 0.05 }}
                      className="rounded-lg bg-secondary p-4 text-center font-semibold text-foreground"
                    >
                      {tech}
                    </motion.div>
                  ))}
                </div>
              </Card>
            </motion.div>

            {/* Deliverables */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Card className="border-border bg-card p-8 shadow-md">
                <h2 className="mb-6 text-2xl font-bold text-foreground flex items-center gap-2" style={{ fontFamily: 'Poppins' }}>
                  <Layers className="h-6 w-6 text-accent" />
                  Deliverables
                </h2>
                <ul className="space-y-3">
                  {proposal.deliverables.map((item, idx) => (
                    <motion.li
                      key={idx}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.25 + idx * 0.05 }}
                      className="flex items-start gap-3"
                    >
                      <Check className="mt-1 h-5 w-5 flex-shrink-0 text-accent" />
                      <span className="text-foreground">{item}</span>
                    </motion.li>
                  ))}
                </ul>
              </Card>
            </motion.div>

            {/* Timeline */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.25 }}
            >
              <Card className="border-border bg-card p-8 shadow-md">
                <h2 className="mb-6 text-2xl font-bold text-foreground flex items-center gap-2" style={{ fontFamily: 'Poppins' }}>
                  <Clock className="h-6 w-6 text-accent" />
                  Project Timeline
                </h2>
                <div className="space-y-6">
                  {proposal.timeline.map((phase, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + idx * 0.08 }}
                      className="border-l-4 border-accent pl-6"
                    >
                      <div className="flex items-baseline justify-between">
                        <h3 className="text-lg font-semibold text-foreground">{phase.phase}</h3>
                        <span className="text-sm font-medium text-accent">{phase.duration}</span>
                      </div>
                      <ul className="mt-3 space-y-2">
                        {phase.tasks.map((task, tidx) => (
                          <li key={tidx} className="text-sm text-muted-foreground flex items-start gap-2">
                            <span className="text-accent">•</span>
                            <span>{task}</span>
                          </li>
                        ))}
                      </ul>
                    </motion.div>
                  ))}
                </div>
              </Card>
            </motion.div>

            {/* Budget Breakdown */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <Card className="border-border bg-card p-8 shadow-md">
                <h2 className="mb-6 text-2xl font-bold text-foreground flex items-center gap-2" style={{ fontFamily: 'Poppins' }}>
                  <DollarSign className="h-6 w-6 text-accent" />
                  Budget Breakdown
                </h2>
                <div className="space-y-4">
                  {proposal.budgetSplit.map((item, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.35 + idx * 0.06 }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-foreground">{item.category}</span>
                        <span className="text-accent font-semibold">{item.amount}</span>
                      </div>
                      <div className="h-2 rounded-full bg-secondary overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${item.percentage}%` }}
                          transition={{ duration: 0.6, delay: 0.4 + idx * 0.08 }}
                          className="h-full bg-gradient-to-r from-primary to-accent"
                        />
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">{item.percentage}% of budget</div>
                    </motion.div>
                  ))}
                </div>
              </Card>
            </motion.div>

            {/* Next Steps */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.35 }}
            >
              <Card className="bg-gradient-to-br from-primary/10 to-accent/10 p-8 shadow-md border-primary/20">
                <h2 className="mb-4 text-2xl font-bold text-foreground" style={{ fontFamily: 'Poppins' }}>
                  Next Steps
                </h2>
                <p className="mb-6 text-foreground leading-relaxed">{proposal.nextSteps}</p>
                <Button
                  onClick={() => {
                    setShowProposal(false);
                    setProposal(null);
                    setSavedProposalId(null);
                  }}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                >
                  Create Another Proposal
                </Button>
              </Card>
            </motion.div>
          </motion.div>
        ) : null}
      </div>

      {/* Send Proposal Modal */}
      <SendProposalModal
        open={showSendModal}
        onClose={() => setShowSendModal(false)}
        proposalId={savedProposalId}
        proposalTitle={proposal?.title || ''}
      />
    </div>
  );
}