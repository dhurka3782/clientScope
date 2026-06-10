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
  AlertCircle,
  Zap,
  ArrowLeft,
  ExternalLink,
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
      toast.success("Proposal deleted");
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
          <p className="mt-4 text-muted-foreground">Loading proposals...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-4 py-12 md:py-16">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <Link href="/" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-4 w-4" />
              Back to Generator
            </Link>
            <h1 className="mt-2 text-3xl font-bold text-foreground md:text-4xl" style={{ fontFamily: "Poppins" }}>
              My Proposals
            </h1>
            <p className="mt-2 text-muted-foreground">
              View and manage your saved project proposals
            </p>
          </div>
          <Link href="/">
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
              <Zap className="mr-2 h-4 w-4" />
              New Proposal
            </Button>
          </Link>
        </div>

        {/* Empty State */}
        {proposals.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-secondary/30 py-20"
          >
            <FileText className="mb-4 h-16 w-16 text-muted-foreground/50" />
            <h2 className="text-xl font-semibold text-foreground">No proposals yet</h2>
            <p className="mt-2 text-muted-foreground">
              Generate your first proposal to see it here
            </p>
            <Link href="/">
              <Button className="mt-6 bg-primary hover:bg-primary/90 text-primary-foreground">
                <Zap className="mr-2 h-4 w-4" />
                Create a Proposal
              </Button>
            </Link>
          </motion.div>
        ) : (
          /* Proposal List */
          <div className="space-y-4">
            <AnimatePresence>
              {proposals.map((proposal, idx) => (
                <motion.div
                  key={proposal.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <Card className="group border-border bg-card p-6 shadow-sm transition-all hover:shadow-md">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-foreground truncate" style={{ fontFamily: "Poppins" }}>
                          {proposal.title}
                        </h3>
                        <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                          <span className="inline-flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            {formatDate(proposal.created_at)}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            {timelineLabel[proposal.timeline] || proposal.timeline}
                          </span>
                          <span className="rounded-full bg-primary/10 px-3 py-0.5 text-xs font-medium text-primary">
                            {budgetLabel[proposal.budget] || proposal.budget}
                          </span>
                          <span className="rounded-full bg-accent/10 px-3 py-0.5 text-xs font-medium text-accent">
                            {proposal.platform}
                          </span>
                        </div>
                        <p className="mt-2 text-sm text-muted-foreground line-clamp-1">
                          {proposal.goal}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 md:flex-shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-1.5 text-foreground hover:bg-secondary"
                          onClick={() => {
                            // Load proposal - navigate to home with proposal data
                            toast.info("View feature coming soon");
                          }}
                        >
                          <Eye className="h-4 w-4" />
                          <span className="hidden sm:inline">View</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-1.5 text-destructive hover:bg-destructive/10"
                          onClick={() => handleDelete(proposal.id)}
                          disabled={deletingId === proposal.id}
                        >
                          {deletingId === proposal.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                          <span className="hidden sm:inline">Delete</span>
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