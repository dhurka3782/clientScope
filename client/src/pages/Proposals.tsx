import { useState, useEffect } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth, apiGet, apiDelete } from "@/contexts/AuthContext";
import {
  FileText,
  Loader2,
  Trash2,
  Eye,
  Calendar,
  Clock,
  Zap,
  ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";

interface ProposalSummary {
  id: number;
  title: string;
  business_type: string;
  goal: string;
  budget: string;
  timeline: string;
  platform: string;
  created_at: string;
  updated_at: string;
}

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const budgetLabel: Record<string, string> = {
  "under-5k": "Under $5K",
  "5k-15k": "$5K - $15K",
  "15k-50k": "$15K - $50K",
  "over-50k": "$50K+",
};

const timelineLabel: Record<string, string> = {
  "2-4-weeks": "2-4 weeks",
  "1-3-months": "1-3 months",
  "3-6-months": "3-6 months",
  "6-plus-months": "6+ months",
};

export default function Proposals() {
  const { user, token, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [proposals, setProposals] = useState<ProposalSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLocation("/");
      return;
    }

    const fetchProposals = async () => {
      try {
        const data = await apiGet("/api/proposals", token);
        setProposals(data.proposals || []);
      } catch (err: any) {
        toast.error(err.message || "Failed to load proposals");
      } finally {
        setLoading(false);
      }
    };

    fetchProposals();
  }, [user, token, authLoading]);

  const handleDelete = async (id: number) => {
    setDeletingId(id);
    try {
      await apiDelete(`/api/proposals/${id}`, token);
      setProposals((prev) => prev.filter((p) => p.id !== id));
      toast.success("Proposal deleted successfully");
    } catch (err: any) {
      toast.error(err.message || "Failed to delete proposal");
    } finally {
      setDeletingId(null);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
          <p className="mt-4 text-muted-foreground">Loading your proposals...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-4 py-12 md:py-24">
        {/* Header */}
        <div className="mb-10 flex items-center justify-between">
          <div>
            <Link 
              href="/" 
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Generator
            </Link>
            <h1 
              className="text-4xl font-bold tracking-tight text-foreground" 
              style={{ fontFamily: "Poppins" }}
            >
              My Proposals
            </h1>
            <p className="mt-2 text-lg text-muted-foreground">
              View and manage your saved project proposals
            </p>
          </div>

          <Link href="/">
            <Button size="lg" className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25">
              <Zap className="mr-2 h-5 w-5" />
              New Proposal
            </Button>
          </Link>
        </div>

        {/* Empty State */}
        {proposals.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-card py-24"
          >
            <FileText className="mb-6 h-20 w-20 text-muted-foreground/40" />
            <h2 className="text-2xl font-semibold text-foreground">No proposals yet</h2>
            <p className="mt-3 text-muted-foreground text-center max-w-md">
              Your generated proposals will appear here. Create your first one to get started.
            </p>
            <Link href="/">
              <Button size="lg" className="mt-8 bg-primary hover:bg-primary/90">
                <Zap className="mr-2 h-5 w-5" />
                Create Your First Proposal
              </Button>
            </Link>
          </motion.div>
        ) : (
          /* Proposal Cards */
          <div className="space-y-6">
            <AnimatePresence>
              {proposals.map((proposal, idx) => (
                <motion.div
                  key={proposal.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ delay: idx * 0.04 }}
                >
                  <Card className="group overflow-hidden border border-border/60 bg-card hover:shadow-xl hover:shadow-black/5 transition-all duration-300 rounded-3xl p-8">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                      <div className="flex-1 min-w-0">
                        <h3 
                          className="text-2xl font-semibold text-foreground leading-tight mb-4" 
                          style={{ fontFamily: "Poppins" }}
                        >
                          {proposal.title}
                        </h3>

                        {/* Metadata */}
                        <div className="flex flex-wrap items-center gap-3 text-sm mb-4">
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            {formatDate(proposal.created_at)}
                          </div>
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            {timelineLabel[proposal.timeline] || proposal.timeline}
                          </div>
                          <div className="rounded-full bg-primary/10 px-4 py-1 text-xs font-medium text-primary">
                            {budgetLabel[proposal.budget] || proposal.budget}
                          </div>
                          <div className="rounded-full bg-accent/10 px-4 py-1 text-xs font-medium text-accent capitalize">
                            {proposal.platform}
                          </div>
                        </div>

                        {/* Goal Description */}
                        <p className="text-muted-foreground line-clamp-2 text-[15px] leading-relaxed">
                          {proposal.goal}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-row lg:flex-col gap-3 lg:pt-2">
                        <Button
                          variant="default"
                          size="sm"
                          className="gap-2 rounded-2xl px-6"
                          onClick={() => setLocation(`/proposals/${proposal.id}`)}
                        >
                          <Eye className="h-4 w-4" />
                          View
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-2 text-destructive hover:bg-destructive/10 rounded-2xl px-6"
                          onClick={() => handleDelete(proposal.id)}
                          disabled={deletingId === proposal.id}
                        >
                          {deletingId === proposal.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                          Delete
                        </Button>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}