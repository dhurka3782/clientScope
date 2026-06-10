import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth, apiPost } from "@/contexts/AuthContext";
import { Loader2, Send, AlertCircle, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

interface SendProposalModalProps {
  open: boolean;
  onClose: () => void;
  proposalId: number | null;
  proposalTitle: string;
}

export default function SendProposalModal({
  open,
  onClose,
  proposalId,
  proposalTitle,
}: SendProposalModalProps) {
  const { token } = useAuth();
  const [recipientEmail, setRecipientEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const resetForm = () => {
    setRecipientEmail("");
    setMessage("");
    setSent(false);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!recipientEmail) return;
    if (!proposalId) {
      toast.error("Please save the proposal first before sending");
      return;
    }

    setLoading(true);
    try {
      await apiPost(
        `/api/proposals/${proposalId}/email`,
        { recipientEmail, message },
        token
      );
      setSent(true);
      toast.success("Proposal sent successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to send proposal. Check email configuration.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg border-border bg-card">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-foreground" style={{ fontFamily: "Poppins" }}>
            Send Proposal
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Email your proposal directly to your client
          </DialogDescription>
        </DialogHeader>

        {sent ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center py-8 text-center"
          >
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent/10">
              <CheckCircle className="h-8 w-8 text-accent" />
            </div>
            <h3 className="text-xl font-semibold text-foreground">Proposal Sent!</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Your proposal has been emailed to {recipientEmail}
            </p>
            <Button
              onClick={handleClose}
              className="mt-6 bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              Done
            </Button>
          </motion.div>
        ) : (
          <form onSubmit={handleSend} className="space-y-4">
            {/* Proposal being sent */}
            <div className="rounded-lg bg-secondary/50 p-3">
              <p className="text-sm font-medium text-foreground">
                Sending: {proposalTitle || "Untitled Proposal"}
              </p>
            </div>

            {!proposalId && (
              <div className="flex items-start gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <span>Please save the proposal first before sending</span>
              </div>
            )}

            {/* Recipient Email */}
            <div className="space-y-2">
              <Label htmlFor="recipient-email" className="text-foreground">
                Recipient Email
              </Label>
              <Input
                id="recipient-email"
                type="email"
                placeholder="client@example.com"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                className="border-border bg-input text-foreground placeholder:text-muted-foreground"
                required
                disabled={loading}
              />
            </div>

            {/* Message */}
            <div className="space-y-2">
              <Label htmlFor="email-message" className="text-foreground">
                Personal Message (optional)
              </Label>
              <Textarea
                id="email-message"
                placeholder="Hi, I've attached the project proposal for your review..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="min-h-24 border-border bg-input text-foreground placeholder:text-muted-foreground"
                disabled={loading}
              />
            </div>

            {/* Send Button */}
            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                className="flex-1 border-border"
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading || !recipientEmail || !proposalId}
                className="flex-1 bg-accent hover:bg-accent/90 text-white"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Send Proposal
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}