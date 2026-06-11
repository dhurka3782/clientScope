import { useState, useEffect } from "react";
import { Link, useParams, useLocation } from "wouter";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth, apiGet } from "@/contexts/AuthContext";
import {
  ArrowLeft,
  Check,
  Clock,
  Copy,
  DollarSign,
  Download,
  Layers,
  Loader2,
  Mail,
} from "lucide-react";
import { toast } from "sonner";
import SendProposalModal from "@/components/SendProposalModal";

interface ProposalData {
  title: string;
  problemSummary: string;
  stack: string[];
  deliverables: string[];
  timeline: { phase: string; duration: string; tasks: string[] }[];
  budgetSplit: { category: string; percentage: number; amount: string }[];
  nextSteps: string;
}

export default function ProposalDetail() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { user, token, isLoading: authLoading } = useAuth();
  const [proposal, setProposal] = useState<ProposalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSendModal, setShowSendModal] = useState(false);
  const [emailEnabled, setEmailEnabled] = useState(false);

  useEffect(() => {
    fetch("/api/config")
      .then((r) => r.json())
      .then((d) => setEmailEnabled(!!d.emailEnabled))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLocation("/");
      return;
    }
    if (!id || !token) return;

    const fetchProposal = async () => {
      try {
        const data = await apiGet(`/api/proposals/${id}`, token);
        if (data.proposal_data) {
          setProposal(data.proposal_data);
        } else {
          toast.error("Proposal data not found");
        }
      } catch (err: any) {
        toast.error(err.message || "Failed to load proposal");
        setLocation("/proposals");
      } finally {
        setLoading(false);
      }
    };

    fetchProposal();
  }, [id, token, user, authLoading]);

  const handleCopy = () => {
    if (!proposal) return;
    const text = `
${proposal.title}

PROBLEM SUMMARY
${proposal.problemSummary}

RECOMMENDED STACK
${proposal.stack.join(" • ")}

DELIVERABLES
${proposal.deliverables.map((d) => `• ${d}`).join("\n")}

PROJECT TIMELINE
${proposal.timeline
  .map(
    (p) =>
      `${p.phase} (${p.duration})\n${p.tasks.map((t) => `  - ${t}`).join("\n")}`
  )
  .join("\n\n")}

BUDGET BREAKDOWN
${proposal.budgetSplit.map((b) => `${b.category}: ${b.percentage}% (${b.amount})`).join("\n")}

NEXT STEPS
${proposal.nextSteps}
`.trim();
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  const handleDownloadPDF = () => {
    if (!proposal) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Please allow popups to download PDF");
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
          .next-steps { margin-top: 32px; padding: 24px; background: linear-gradient(135deg, #eef2ff, #ecfeff); border-radius: 8px; }
          hr { border: none; border-top: 1px solid #e2e8f0; margin: 24px 0; }
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
          ${proposal.stack.map((tech) => `<span class="stack-item">${tech}</span>`).join("")}
        </div>
        <h2>Deliverables</h2>
        ${proposal.deliverables.map((d) => `<div class="deliverable">${d}</div>`).join("")}
        <h2>Project Timeline</h2>
        ${proposal.timeline
          .map(
            (phase) => `
          <div class="phase">
            <h3>${phase.phase}</h3>
            <div class="duration">${phase.duration}</div>
            <ul style="margin-top: 8px; padding-left: 20px;">
              ${phase.tasks.map((task) => `<li>${task}</li>`).join("")}
            </ul>
          </div>`
          )
          .join("")}
        <h2>Budget Breakdown</h2>
        ${proposal.budgetSplit
          .map(
            (b) => `
          <div class="budget-item">
            <span>${b.category} (${b.percentage}%)</span>
            <span style="font-weight: 600; color: #0891b2;">${b.amount}</span>
          </div>`
          )
          .join("")}
        <h2>Next Steps</h2>
        <div class="next-steps"><p>${proposal.nextSteps}</p></div>
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 500);
    toast.success("PDF dialog opened");
  };

  if (authLoading || loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
          <p className="mt-4 text-muted-foreground">Loading proposal...</p>
        </div>
      </div>
    );
  }

  if (!proposal) return null;

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-4 py-12 md:py-24">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <Link
              href="/proposals"
              className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to My Proposals
            </Link>
            <h1
              className="mt-2 text-3xl font-bold text-foreground md:text-4xl"
              style={{ fontFamily: "Poppins" }}
            >
              {proposal.title}
            </h1>
            <p className="mt-2 text-muted-foreground">Professional project proposal</p>
          </div>
          <div className="flex flex-wrap gap-3 md:flex-shrink-0">
            <Button
              onClick={handleCopy}
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
            {/* {emailEnabled ? (
              <Button
                onClick={() => setShowSendModal(true)}
                className="bg-accent hover:bg-accent/90 text-white"
              >
                <Mail className="mr-2 h-4 w-4" />
                Send
              </Button>
            ) : (
              <Button
                disabled
                title="Email sending is not configured on this server"
                className="cursor-not-allowed opacity-50 bg-accent text-white"
              >
                <Mail className="mr-2 h-4 w-4" />
                Send
              </Button>
            )} */}
          </div>
        </div>

        <div className="space-y-8">
          {/* Problem Summary */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.05 }}
          >
            <Card className="border-border bg-card p-8 shadow-md">
              <h2
                className="mb-4 text-2xl font-bold text-foreground"
                style={{ fontFamily: "Poppins" }}
              >
                Problem Summary
              </h2>
              <p className="leading-relaxed text-foreground">{proposal.problemSummary}</p>
            </Card>
          </motion.div>

          {/* Tech Stack */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card className="border-border bg-card p-8 shadow-md">
              <h2
                className="mb-6 text-2xl font-bold text-foreground"
                style={{ fontFamily: "Poppins" }}
              >
                Recommended Stack
              </h2>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">
                {proposal.stack.map((tech, idx) => (
                  <motion.div
                    key={tech}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.15 + idx * 0.05 }}
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
            transition={{ duration: 0.5, delay: 0.15 }}
          >
            <Card className="border-border bg-card p-8 shadow-md">
              <h2
                className="mb-6 flex items-center gap-2 text-2xl font-bold text-foreground"
                style={{ fontFamily: "Poppins" }}
              >
                <Layers className="h-6 w-6 text-accent" />
                Deliverables
              </h2>
              <ul className="space-y-3">
                {proposal.deliverables.map((item, idx) => (
                  <motion.li
                    key={idx}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + idx * 0.05 }}
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
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="border-border bg-card p-8 shadow-md">
              <h2
                className="mb-6 flex items-center gap-2 text-2xl font-bold text-foreground"
                style={{ fontFamily: "Poppins" }}
              >
                <Clock className="h-6 w-6 text-accent" />
                Project Timeline
              </h2>
              <div className="space-y-6">
                {proposal.timeline.map((phase, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.25 + idx * 0.08 }}
                    className="border-l-4 border-accent pl-6"
                  >
                    <div className="flex items-baseline justify-between">
                      <h3 className="text-lg font-semibold text-foreground">{phase.phase}</h3>
                      <span className="text-sm font-medium text-accent">{phase.duration}</span>
                    </div>
                    <ul className="mt-3 space-y-2">
                      {phase.tasks.map((task, tidx) => (
                        <li
                          key={tidx}
                          className="flex items-start gap-2 text-sm text-muted-foreground"
                        >
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
            transition={{ duration: 0.5, delay: 0.25 }}
          >
            <Card className="border-border bg-card p-8 shadow-md">
              <h2
                className="mb-6 flex items-center gap-2 text-2xl font-bold text-foreground"
                style={{ fontFamily: "Poppins" }}
              >
                <DollarSign className="h-6 w-6 text-accent" />
                Budget Breakdown
              </h2>
              <div className="space-y-4">
                {proposal.budgetSplit.map((item, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + idx * 0.06 }}
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <span className="font-medium text-foreground">{item.category}</span>
                      <span className="font-semibold text-accent">{item.amount}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-secondary">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${item.percentage}%` }}
                        transition={{ duration: 0.6, delay: 0.35 + idx * 0.08 }}
                        className="h-full bg-gradient-to-r from-primary to-accent"
                      />
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {item.percentage}% of budget
                    </div>
                  </motion.div>
                ))}
              </div>
            </Card>
          </motion.div>

          {/* Next Steps */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card className="border-primary/20 bg-gradient-to-br from-primary/10 to-accent/10 p-8 shadow-md">
              <h2
                className="mb-4 text-2xl font-bold text-foreground"
                style={{ fontFamily: "Poppins" }}
              >
                Next Steps
              </h2>
              <p className="mb-6 leading-relaxed text-foreground">{proposal.nextSteps}</p>
              <Link href="/proposals">
                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to My Proposals
                </Button>
              </Link>
            </Card>
          </motion.div>
        </div>
      </div>

      <SendProposalModal
        open={showSendModal}
        onClose={() => setShowSendModal(false)}
        proposalId={id ? Number(id) : null}
        proposalTitle={proposal.title}
      />
    </div>
  );
}
