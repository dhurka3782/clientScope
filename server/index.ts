import express from "express";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import OpenAI from "openai";
import nodemailer from "nodemailer";
import db from "./db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const JWT_SECRET = process.env.JWT_SECRET || "client-scope-secret-key-change-in-production";
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";

const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

// Email transporter setup
let emailTransporter: nodemailer.Transporter | null = null;
if (process.env.SMTP_HOST) {
  emailTransporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

interface JwtPayload {
  userId: number;
  email: string;
}

function authMiddleware(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No token provided" });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    (req as any).user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
}

async function startServer() {
  const app = express();
  const server = createServer(app);

  app.use(express.json());

  // ==============================
  // AUTH ROUTES
  // ==============================

  // Signup
  app.post("/api/auth/signup", async (req, res) => {
    try {
      const { email, name, password } = req.body;

      if (!email || !name || !password) {
        return res.status(400).json({ error: "Email, name, and password are required" });
      }

      if (password.length < 6) {
        return res.status(400).json({ error: "Password must be at least 6 characters" });
      }

      const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(email);
      if (existing) {
        return res.status(409).json({ error: "Email already registered" });
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const result = db.prepare(
        "INSERT INTO users (email, name, password_hash) VALUES (?, ?, ?)"
      ).run(email, name, passwordHash);

      const token = jwt.sign({ userId: result.lastInsertRowid, email }, JWT_SECRET, {
        expiresIn: "30d",
      });

      res.json({
        token,
        user: { id: result.lastInsertRowid, email, name },
      });
    } catch (err) {
      console.error("Signup error:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Login
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
      }

      const user = db.prepare(
        "SELECT id, email, name, password_hash FROM users WHERE email = ?"
      ).get(email) as { id: number; email: string; name: string; password_hash: string } | undefined;

      if (!user) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      const validPassword = await bcrypt.compare(password, user.password_hash);
      if (!validPassword) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, {
        expiresIn: "30d",
      });

      res.json({
        token,
        user: { id: user.id, email: user.email, name: user.name },
      });
    } catch (err) {
      console.error("Login error:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get current user
  app.get("/api/auth/me", authMiddleware, (req, res) => {
    const { userId } = (req as any).user;
    const user = db.prepare(
      "SELECT id, email, name, created_at FROM users WHERE id = ?"
    ).get(userId) as { id: number; email: string; name: string; created_at: string } | undefined;

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ user });
  });

  // ==============================
  // OPENAI PROPOSAL GENERATION
  // ==============================

  app.post("/api/proposals/generate", authMiddleware, async (req, res) => {
    try {
      const { businessType, goal, budget, timeline, platform } = req.body;

      if (!businessType || !goal || !budget || !timeline || !platform) {
        return res.status(400).json({ error: "All fields are required" });
      }

      // If OpenAI key is set, use AI to generate the proposal
      if (OPENAI_API_KEY) {
        const prompt = `You are a professional project proposal writer. Generate a detailed project proposal based on the following client brief:

Business Type: ${businessType}
Main Goal: ${goal}
Budget Range: ${budget}
Timeline: ${timeline}
Platform: ${platform}

Return a JSON object (no markdown, no code fences) with exactly this structure:
{
  "title": "A compelling project title",
  "problemSummary": "A 2-3 sentence summary of the problem and solution",
  "stack": ["array", "of", "5-7", "recommended", "technologies"],
  "deliverables": ["array", "of", "7-10", "deliverables"],
  "timeline": [
    {
      "phase": "Phase Name",
      "duration": "X weeks",
      "tasks": ["task1", "task2", "task3", "task4"]
    }
  ],
  "budgetSplit": [
    {
      "category": "Category Name",
      "percentage": 25,
      "amount": "$X,XXX"
    }
  ],
  "nextSteps": "A paragraph describing next steps for the client"
}

Make the proposal specific to the client's business type and goal. Use realistic budget figures based on the budget range. Ensure the timeline phases match the client's timeline. Budget percentages should total 100%.`;

        const completion = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: "You are a professional proposal writer. Return only valid JSON, no markdown formatting.",
            },
            { role: "user", content: prompt },
          ],
          temperature: 0.7,
          response_format: { type: "json_object" },
        });

        const content = completion.choices[0]?.message?.content;
        if (!content) {
          throw new Error("No response from OpenAI");
        }

        const proposalData = JSON.parse(content);
        res.json({ proposal: proposalData, source: "ai" });
      } else {
        // Fallback to template-based generation if no API key
        res.json({ proposal: null, source: "template", message: "OpenAI not configured. Please set OPENAI_API_KEY." });
      }
    } catch (err) {
      console.error("Proposal generation error:", err);
      res.status(500).json({ error: "Failed to generate proposal. Please check your OpenAI API key." });
    }
  });

  // ==============================
  // PROPOSAL CRUD
  // ==============================

  // Save a proposal
  app.post("/api/proposals", authMiddleware, (req, res) => {
    try {
      const { userId } = (req as any).user;
      const { title, businessType, goal, budget, timeline, platform, proposalData } = req.body;

      if (!title || !businessType || !goal || !budget || !timeline || !platform || !proposalData) {
        return res.status(400).json({ error: "All fields are required" });
      }

      const result = db.prepare(
        `INSERT INTO proposals (user_id, title, business_type, goal, budget, timeline, platform, proposal_data)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(userId, title, businessType, goal, budget, timeline, platform, JSON.stringify(proposalData));

      res.json({
        id: result.lastInsertRowid,
        message: "Proposal saved successfully",
      });
    } catch (err) {
      console.error("Save proposal error:", err);
      res.status(500).json({ error: "Failed to save proposal" });
    }
  });

  // Get all proposals for user
  app.get("/api/proposals", authMiddleware, (req, res) => {
    try {
      const { userId } = (req as any).user;
      const proposals = db.prepare(
        `SELECT id, title, business_type, goal, budget, timeline, platform, created_at, updated_at
         FROM proposals WHERE user_id = ? ORDER BY created_at DESC`
      ).all(userId);

      res.json({ proposals });
    } catch (err) {
      console.error("Get proposals error:", err);
      res.status(500).json({ error: "Failed to get proposals" });
    }
  });

  // Get a single proposal
  app.get("/api/proposals/:id", authMiddleware, (req, res) => {
    try {
      const { userId } = (req as any).user;
      const { id } = req.params;

      const proposal = db.prepare(
        `SELECT * FROM proposals WHERE id = ? AND user_id = ?`
      ).get(id, userId) as any;

      if (!proposal) {
        return res.status(404).json({ error: "Proposal not found" });
      }

      res.json({
        ...proposal,
        proposal_data: JSON.parse(proposal.proposal_data),
      });
    } catch (err) {
      console.error("Get proposal error:", err);
      res.status(500).json({ error: "Failed to get proposal" });
    }
  });

  // Delete a proposal
  app.delete("/api/proposals/:id", authMiddleware, (req, res) => {
    try {
      const { userId } = (req as any).user;
      const { id } = req.params;

      const result = db.prepare(
        "DELETE FROM proposals WHERE id = ? AND user_id = ?"
      ).run(id, userId);

      if (result.changes === 0) {
        return res.status(404).json({ error: "Proposal not found" });
      }

      res.json({ message: "Proposal deleted successfully" });
    } catch (err) {
      console.error("Delete proposal error:", err);
      res.status(500).json({ error: "Failed to delete proposal" });
    }
  });

  // ==============================
  // EMAIL EXPORT
  // ==============================

  app.post("/api/proposals/:id/email", authMiddleware, async (req, res) => {
    try {
      const { userId } = (req as any).user;
      const { id } = req.params;
      const { recipientEmail, message } = req.body;

      if (!recipientEmail) {
        return res.status(400).json({ error: "Recipient email is required" });
      }

      if (!emailTransporter) {
        return res.status(400).json({
          error: "Email service not configured. Please set SMTP_HOST, SMTP_USER, and SMTP_PASS environment variables.",
        });
      }

      const user = db.prepare(
        "SELECT id, email, name FROM users WHERE id = ?"
      ).get(userId) as { id: number; email: string; name: string } | undefined;

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const proposal = db.prepare(
        "SELECT * FROM proposals WHERE id = ? AND user_id = ?"
      ).get(id, userId) as any;

      if (!proposal) {
        return res.status(404).json({ error: "Proposal not found" });
      }

      const proposalData = JSON.parse(proposal.proposal_data);

      // Build HTML email
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1e293b; }
            h1 { color: #1e3a8a; font-size: 24px; margin-bottom: 8px; }
            h2 { color: #1e3a8a; font-size: 18px; margin-top: 24px; border-bottom: 2px solid #0891b2; padding-bottom: 8px; }
            .section { margin: 16px 0; }
            .stack { display: flex; flex-wrap: wrap; gap: 8px; }
            .stack-item { background: #f1f5f9; padding: 4px 12px; border-radius: 6px; font-size: 13px; color: #1e3a8a; }
            .deliverable { margin: 4px 0; padding-left: 12px; border-left: 3px solid #0891b2; }
            .phase { margin: 12px 0; padding: 12px; background: #f8fafc; border-radius: 8px; }
            .phase h3 { color: #0891b2; margin: 0 0 4px; }
            .phase .duration { color: #64748b; font-size: 13px; }
            .budget-item { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e2e8f0; }
            .footer { margin-top: 32px; padding: 16px; background: linear-gradient(135deg, #1e3a8a, #0891b2); color: white; border-radius: 8px; text-align: center; }
            hr { border: none; border-top: 1px solid #e2e8f0; margin: 24px 0; }
          </style>
        </head>
        <body>
          <h1>${proposal.title}</h1>
          <p style="color: #64748b; font-size: 14px;">Professional Project Proposal</p>
          <hr />

          <h2>Problem Summary</h2>
          <p>${proposalData.problemSummary}</p>

          <h2>Recommended Stack</h2>
          <div class="stack">
            ${(proposalData.stack || []).map((tech: string) => `<span class="stack-item">${tech}</span>`).join('')}
          </div>

          <h2>Deliverables</h2>
          ${(proposalData.deliverables || []).map((d: string) => `<div class="deliverable">${d}</div>`).join('')}

          <h2>Project Timeline</h2>
          ${(proposalData.timeline || []).map((phase: any) => `
            <div class="phase">
              <h3>${phase.phase}</h3>
              <div class="duration">${phase.duration}</div>
              <ul style="margin-top: 8px; padding-left: 20px;">
                ${(phase.tasks || []).map((task: string) => `<li>${task}</li>`).join('')}
              </ul>
            </div>
          `).join('')}

          <h2>Budget Breakdown</h2>
          ${(proposalData.budgetSplit || []).map((b: any) => `
            <div class="budget-item">
              <span>${b.category} (${b.percentage}%)</span>
              <span style="font-weight: 600; color: #0891b2;">${b.amount}</span>
            </div>
          `).join('')}

          <h2>Next Steps</h2>
          <p>${proposalData.nextSteps}</p>

          ${message ? `<hr /><p style="font-style: italic; color: #64748b;">${message}</p>` : ''}

          <div class="footer">
            <p style="margin: 0; font-size: 14px;">Proposal created by ${user.name} via Client Scope Assistant</p>
          </div>
        </body>
        </html>
      `;

      const plainText = `
${proposal.title}

PROBLEM SUMMARY
${proposalData.problemSummary}

RECOMMENDED STACK
${(proposalData.stack || []).join(' • ')}

DELIVERABLES
${(proposalData.deliverables || []).map((d: string) => `• ${d}`).join('\n')}

PROJECT TIMELINE
${(proposalData.timeline || []).map((p: any) => `${p.phase} (${p.duration})\n${p.tasks.map((t: string) => `  - ${t}`).join('\n')}`).join('\n\n')}

BUDGET BREAKDOWN
${(proposalData.budgetSplit || []).map((b: any) => `${b.category}: ${b.percentage}% (${b.amount})`).join('\n')}

NEXT STEPS
${proposalData.nextSteps}

${message ? `\n---\n${message}` : ''}

---
Proposal created by ${user.name} via Client Scope Assistant
      `.trim();

      await emailTransporter.sendMail({
        from: `"${user.name}" <${process.env.SMTP_USER}>`,
        to: recipientEmail,
        subject: `Proposal: ${proposal.title}`,
        text: plainText,
        html,
      });

      res.json({ message: "Proposal sent successfully" });
    } catch (err) {
      console.error("Email error:", err);
      res.status(500).json({ error: "Failed to send email. Please check your SMTP configuration." });
    }
  });

  // ==============================
  // STATIC FILES & CLIENT ROUTING
  // ==============================

  // Serve static files from dist/public in production
  const staticPath =
    process.env.NODE_ENV === "production"
      ? path.resolve(__dirname, "public")
      : path.resolve(__dirname, "..", "dist", "public");

  app.use(express.static(staticPath));

  // Handle client-side routing - serve index.html for all non-API routes
  app.get("*", (_req, res) => {
    res.sendFile(path.join(staticPath, "index.html"));
  });

  const port = process.env.PORT || 3000;

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
    console.log(`OpenAI API: ${OPENAI_API_KEY ? "Configured" : "Not configured"}`);
    console.log(`Email Service: ${emailTransporter ? "Configured" : "Not configured"}`);
  });
}

startServer().catch(console.error);