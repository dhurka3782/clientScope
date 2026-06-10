import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Copy, Download, Loader2, Check, Zap, Target, Layers, Clock, DollarSign, Save, Send, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth, apiPost } from '@/contexts/AuthContext';
import SendProposalModal from '@/components/SendProposalModal';

/**
 * Design Philosophy: Premium Minimalist with Depth
 * - Deep Indigo (#1e3a8a) primary + Teal (#0891b2) accents
 * - Asymmetric split layout (form left, preview right)
 * - Poppins display + Inter body fonts
 * - Smooth 200-300ms transitions, staggered card reveals
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

export default function Home() {
  const { user, token } = useAuth();
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

  const isFormComplete = Object.values(formData).every((v) => v);

  const handleGenerateProposal = async () => {
    if (!isFormComplete) return;

    setLoading(true);
    setSavedProposalId(null);

    try {
      // Try AI-powered generation if user is authenticated
      if (user && token) {
        try {
          const data = await apiPost("/api/proposals/generate", formData, token);
          if (data.source === "ai" && data.proposal) {
            setProposal(data.proposal);
            setShowProposal(true);
            setLoading(false);
            toast.success('AI-powered proposal generated!');
            return;
          }
        } catch (err: any) {
          console.warn("AI generation failed, falling back to template:", err.message);
        }
      }

      // Fallback to template-based generation
      await new Promise((resolve) => setTimeout(resolve, 800));
      const generated = templateGenerateProposal(formData);
      setProposal(generated);
      setShowProposal(true);
      setLoading(false);
      toast.success('Proposal generated successfully!');

      // Auto-save if user is authenticated
      if (user && token) {
        try {
          await apiPost("/api/proposals", {
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
      console.error("Generation error:", err);
      toast.error("Failed to generate proposal");
      setLoading(false);
    }
  };

  const handleSaveProposal = async () => {
    if (!proposal || !user || !token) {
      toast.error("Please sign in to save proposals");
      return;
    }

    setSaving(true);
    try {
      const data = await apiPost("/api/proposals", {
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
      toast.error(err.message || "Failed to save proposal");
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

    // Generate a printable version
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

    // Wait for resources to load then print
    setTimeout(() => {
      printWindow.print();
    }, 500);

    toast.success('PDF dialog opened');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      {!showProposal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="relative overflow-hidden bg-gradient-to-br from-primary via-primary/80 to-accent/60 px-4 py-20 md:py-32"
        >
          <div
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage: `url('https://d2xsxph8kpxj0f.cloudfront.net/310419663031206766/DEUtTJbrRtvttNsWTanYwv/hero-background-gdA7NByfivFprPiE6qgeWA.webp')`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
          <div className="relative z-10 mx-auto max-w-3xl text-center">
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
      <div className="mx-auto max-w-7xl px-4 py-12 md:py-16">
        {!showProposal ? (
          // Form View
          <div className="grid gap-8 md:grid-cols-2">
            {/* Form Section */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <Card className="sticky top-8 border-border bg-card p-8 shadow-lg">
                <h2 className="mb-8 text-2xl font-bold text-foreground" style={{ fontFamily: 'Poppins' }}>Project Brief</h2>

                <div className="space-y-6">
                  {/* Business Type */}
                  <div className="space-y-2">
                    <Label htmlFor="business-type" className="text-foreground" style={{ fontFamily: 'Poppins' }}>
                      What type of business are you building for?
                    </Label>
                    <Select value={formData.businessType} onValueChange={(v) => setFormData({ ...formData, businessType: v })}>
                      <SelectTrigger id="business-type" className="border-border bg-input text-foreground">
                        <SelectValue placeholder="Select business type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SaaS">SaaS Platform</SelectItem>
                        <SelectItem value="E-commerce">E-commerce Store</SelectItem>
                        <SelectItem value="Marketplace">Marketplace</SelectItem>
                        <SelectItem value="Content">Content Platform</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Goal */}
                  <div className="space-y-2">
                    <Label htmlFor="goal" className="text-foreground" style={{ fontFamily: 'Poppins' }}>
                      What's your main goal?
                    </Label>
                    <Textarea
                      id="goal"
                      placeholder="e.g., Help teams collaborate on projects in real-time"
                      value={formData.goal}
                      onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
                      className="min-h-24 border-border bg-input text-foreground placeholder:text-muted-foreground"
                    />
                  </div>

                  {/* Budget */}
                  <div className="space-y-2">
                    <Label htmlFor="budget" className="text-foreground" style={{ fontFamily: 'Poppins' }}>
                      Budget Range
                    </Label>
                    <Select value={formData.budget} onValueChange={(v) => setFormData({ ...formData, budget: v })}>
                      <SelectTrigger id="budget" className="border-border bg-input text-foreground">
                        <SelectValue placeholder="Select budget range" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="under-5k">Under $5,000</SelectItem>
                        <SelectItem value="5k-15k">$5,000 - $15,000</SelectItem>
                        <SelectItem value="15k-50k">$15,000 - $50,000</SelectItem>
                        <SelectItem value="over-50k">$50,000+</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Timeline */}
                  <div className="space-y-2">
                    <Label htmlFor="timeline" className="text-foreground" style={{ fontFamily: 'Poppins' }}>
                      Desired Timeline
                    </Label>
                    <Select value={formData.timeline} onValueChange={(v) => setFormData({ ...formData, timeline: v })}>
                      <SelectTrigger id="timeline" className="border-border bg-input text-foreground">
                        <SelectValue placeholder="Select timeline" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="2-4-weeks">2-4 weeks</SelectItem>
                        <SelectItem value="1-3-months">1-3 months</SelectItem>
                        <SelectItem value="3-6-months">3-6 months</SelectItem>
                        <SelectItem value="6-plus-months">6+ months</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Platform */}
                  <div className="space-y-2">
                    <Label htmlFor="platform" className="text-foreground" style={{ fontFamily: 'Poppins' }}>
                      Preferred Platform
                    </Label>
                    <Select value={formData.platform} onValueChange={(v) => setFormData({ ...formData, platform: v })}>
                      <SelectTrigger id="platform" className="border-border bg-input text-foreground">
                        <SelectValue placeholder="Select platform" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="web">Web Application</SelectItem>
                        <SelectItem value="mobile">Mobile App</SelectItem>
                        <SelectItem value="ecommerce">E-commerce</SelectItem>
                        <SelectItem value="saas">SaaS</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Generate Button */}
                  <Button
                    onClick={handleGenerateProposal}
                    disabled={!isFormComplete || loading}
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-6 text-base transition-all duration-200 hover:shadow-lg disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Zap className="mr-2 h-5 w-5" />
                        Generate Proposal
                      </>
                    )}
                  </Button>
                </div>
              </Card>
            </motion.div>

            {/* Preview Section */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="space-y-4"
            >
              <div className="rounded-lg border-2 border-dashed border-border bg-secondary/50 p-12 text-center">
                <Target className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Fill out the form and your proposal will appear here
                </p>
              </div>
            </motion.div>
          </div>
        ) : proposal ? (
          // Proposal View
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="space-y-8"
          >
            {/* Header with Actions */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-foreground" style={{ fontFamily: 'Poppins' }}>{proposal.title}</h1>
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
                <h2 className="mb-4 text-2xl font-bold text-foreground" style={{ fontFamily: 'Poppins' }}>Problem Summary</h2>
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
                <h2 className="mb-6 text-2xl font-bold text-foreground" style={{ fontFamily: 'Poppins' }}>Recommended Stack</h2>
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
              <Card className="border-border bg-gradient-to-br from-primary/10 to-accent/10 p-8 shadow-md border-primary/20">
                <h2 className="mb-4 text-2xl font-bold text-foreground" style={{ fontFamily: 'Poppins' }}>Next Steps</h2>
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