import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

import healthRouter from "./server/routes/health";
import { authRouter } from "./server/routes/auth";
import { usersRouter } from "./server/routes/users";
import { rolesRouter } from "./server/routes/roles";
import accountsRouter from "./server/routes/accounts";
import journalEntriesRouter from "./server/routes/journalEntries";
import reportsRouter from "./server/routes/reports";
import customersRouter from "./server/routes/customers";
import suppliersRouter from "./server/routes/suppliers";
import inventoryRouter from "./server/routes/inventory";
import salesRouter from "./server/routes/sales";
import purchasesRouter from "./server/routes/purchases";
import { errorHandler } from "./server/middleware/errorHandler";


dotenv.config();

// Lazy initialization of GoogleGenAI to ensure the app boots even if the key is momentarily missing
let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is required. Please set it in Settings > Secrets.");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Body parsers
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // API Routes FIRST
  app.post("/api/gemini/generate", async (req, res) => {
    try {
      const { prompt, systemInstruction } = req.body;
      
      if (!prompt) {
        return res.status(400).json({ error: "Prompt is required" });
      }

      const client = getAiClient();
      const response = await client.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction: systemInstruction || "You are an expert ERPNext & Frappe Framework senior developer. Write clean, production-ready, security-hardened code. Follow Python PEP 8 and Javascript ES6 standards.",
        },
      });

      return res.json({ text: response.text });
    } catch (error: any) {
      console.error("Gemini API Error:", error);
      return res.status(500).json({ 
        error: error.message || "Failed to generate content from Gemini API" 
      });
    }
  });

  // NOVARO ERP Phase 2D Identity, Auth & RBAC Routes
  app.use("/api/auth", authRouter);
  app.use("/api/v1/users", usersRouter);
  app.use("/api/v1/roles", rolesRouter);

  // NOVARO ERP Phase 2A-2C Modular Domain Routes
  app.use("/api", healthRouter);
  app.use("/api/v1/accounts", accountsRouter);
  app.use("/api/v1/journal-entries", journalEntriesRouter);
  app.use("/api/v1/reports", reportsRouter);
  app.use("/api/v1/customers", customersRouter);
  app.use("/api/v1/suppliers", suppliersRouter);
  app.use("/api/v1/inventory", inventoryRouter);
  app.use("/api/v1/sales", salesRouter);
  app.use("/api/v1/purchases", purchasesRouter);


  // Simulated local ERPNext Database & REST Client endpoint
  app.post("/api/erpnext/simulate", (req, res) => {
    const { doctype, action, doc } = req.body;
    
    // Simulating ERPNext REST API endpoints: /api/resource/:doctype
    if (action === "insert") {
      const simulatedName = `${doctype.replace(/\s+/g, "-")}-${Math.floor(100000 + Math.random() * 900000)}`;
      return res.json({
        message: {
          name: simulatedName,
          owner: "Administrator",
          creation: new Date().toISOString(),
          modified: new Date().toISOString(),
          modified_by: "Administrator",
          docstatus: 0,
          idx: 0,
          ...doc,
          doctype
        }
      });
    }

    if (action === "get_list") {
      // Mocking ERPNext lists
      return res.json({
        message: [
          { name: "REC-2026-0001", owner: "Administrator", modified: new Date().toISOString() },
          { name: "REC-2026-0002", owner: "Administrator", modified: new Date().toISOString() },
          { name: "REC-2026-0003", owner: "Administrator", modified: new Date().toISOString() }
        ]
      });
    }

    return res.status(400).json({ error: "Unsupported simulated action" });
  });

  // Global API Error Handler
  app.use(errorHandler);

  // Serve static assets or mount Vite middleware
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[ERPNext Workspace] Server running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Fatal Server Error:", err);
  process.exit(1);
});
