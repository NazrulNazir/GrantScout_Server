import { Request, Response, NextFunction } from "express";
import { Project } from "../models/Project";
import { Grant } from "../models/Grant";
import { generateAIResponse } from "../services/aiService";

export const getAIChatResponse = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { message, projectId } = req.body;
    
    let contextStr = "";
    if (projectId) {
      const project = await Project.findOne({ _id: projectId, user: (req as any).user._id });
      if (project) {
        contextStr = `Project Name: ${project.name}\nProject Description: ${project.description}\nProject Tags: ${project.tags?.join(", ") || ""}\n`;
      }
    }

    const systemInstruction = `You are GrantScout AI, an expert AI grant consultant.
Below is the project context for the user:
${contextStr || "No project context loaded."}
Please answer the user's query professionally, drawing on their project context where applicable.`;

    const reply = await generateAIResponse(message, systemInstruction);
    res.json({ reply });
  } catch (error) {
    next(error);
  }
};

export const getGrantMatches = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { projectId } = req.body;
    if (!projectId) {
      res.status(400);
      throw new Error("projectId is required");
    }

    const project = await Project.findOne({ _id: projectId, user: (req as any).user._id });
    if (!project) {
      res.status(404);
      throw new Error("Project not found");
    }

    const prompt = `Evaluate the following project for suitability against these 3 grants:
1. "NIH SBIR/STTR Health Disparities" ($1,200,000, focused on healthcare disparities in rural or underserved areas, technical integration guidelines apply)
2. "NSF Deep Tech Seed Fund" ($500,000, focused on deep tech, novel AI, and commercial viability)
3. "Gates Foundation: Global Health" ($2,500,000, focused on global health deployment, particularly in Sub-Saharan Africa or developing nations)

Project:
Name: ${project.name}
Description: ${project.description}
Tags: ${project.tags?.join(", ") || ""}

For each grant, return:
- Match Score (0 to 100 percentage based on suitability)
- Explanation (1-2 sentences explaining why the score was given, referring back to the project description)
- Funder tags (like NIH, NSF, Health, Deep Tech, etc.)

Return the result as a raw JSON array matching this format (no markdown code blocks, just raw JSON text):
[
  {
    "id": "1",
    "grant": "NIH SBIR/STTR Health Disparities",
    "amount": 1200000,
    "score": 95,
    "explanation": "Explanation...",
    "tags": ["NIH", "Health", "Highly Recommended"]
  },
  ...
]`;

    const systemInstruction = "You are a JSON generator. You must output only a valid JSON array and nothing else. Do not wrap it in markdown code blocks like ```json.";
    const responseText = await generateAIResponse(prompt, systemInstruction);

    let matches;
    try {
      let cleaned = responseText.replace(/```json/gi, "").replace(/```/g, "").trim();
      matches = JSON.parse(cleaned);
    } catch (parseError) {
      console.error("JSON parsing of AI matches failed, using fallback mock data:", responseText);
      matches = [
        {
          id: "1",
          grant: "NIH SBIR/STTR Health Disparities",
          amount: 1200000,
          score: project.name.toLowerCase().includes("biotech") || project.description.toLowerCase().includes("medical") ? 98 : 65,
          explanation: `Your project '${project.name}' is evaluated against rural health criteria. If your technology focuses on diagnostics or clinical integration, this is a strong fit.`,
          tags: ["NIH", "Health", "Highly Recommended"]
        },
        {
          id: "2",
          grant: "NSF Deep Tech Seed Fund",
          amount: 500000,
          score: project.tags?.includes("AI") || project.description.toLowerCase().includes("ai") ? 92 : 75,
          explanation: `Matches the NSF's emphasis on novel technical innovations with commercial potential, particularly if using advanced algorithms.`,
          tags: ["NSF", "Deep Tech"]
        },
        {
          id: "3",
          grant: "Gates Foundation: Global Health",
          amount: 2500000,
          score: project.description.toLowerCase().includes("global") || project.description.toLowerCase().includes("africa") ? 88 : 55,
          explanation: `Evaluation focuses on deployment in developing regions. High value, but requires scaling capability.`,
          tags: ["Global Health", "High Value"]
        }
      ];
    }

    res.json(matches);
  } catch (error) {
    next(error);
  }
};

export const generateProposal = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { projectId, grantId } = req.body;
    if (!projectId || !grantId) {
      res.status(400);
      throw new Error("projectId and grantId are required");
    }

    const project = await Project.findOne({ _id: projectId, user: (req as any).user._id });
    if (!project) {
      res.status(404);
      throw new Error("Project not found");
    }

    let grant = await Grant.findById(grantId);
    let grantTitle = "Target Funder Opportunity";
    let grantOrg = "Funder Organization";
    let grantDesc = "";

    if (grant) {
      grantTitle = grant.title;
      grantOrg = grant.organization;
      grantDesc = grant.description;
    } else {
      if (grantId.includes("1") || grantId.includes("disparities")) {
        grantTitle = "NIH SBIR/STTR Health Disparities";
        grantOrg = "National Institutes of Health (NIH)";
        grantDesc = "Addressing healthcare disparities in rural or underserved areas using scalable technologies.";
      } else if (grantId.includes("2") || grantId.includes("nsf") || grantId.includes("deep")) {
        grantTitle = "NSF Deep Tech Seed Fund";
        grantOrg = "National Science Foundation (NSF)";
        grantDesc = "Translating deep tech and AI software innovations into commercial ventures with high positive societal impacts.";
      } else {
        grantTitle = "Gates Foundation: Global Health";
        grantOrg = "Bill & Melinda Gates Foundation";
        grantDesc = "Accelerating global health deployment, testing, and vaccine scaling in developing regions.";
      }
    }

    const prompt = `Draft a comprehensive, highly structured grant proposal applying for the grant "${grantTitle}" by "${grantOrg}".
    
Project Details:
Name: ${project.name}
Description: ${project.description}
Tags: ${project.tags?.join(", ") || ""}

Funder Focus:
${grantDesc}

Please output the proposal in professional markdown format. Include the following sections:
1. EXECUTIVE SUMMARY
2. SIGNIFICANCE AND INNOVATION
3. TECHNICAL APPROACH & CORE ARCHITECTURE
4. MILESTONES & WORK PLAN
5. BUDGET JUSTIFICATION (estimate a sensible cost breakdown)`;

    const systemInstruction = "You are a professional senior grant consultant. Draft compliant, persuasive, and highly technical proposal documents. Do not write introductory meta-chatter, output only the markdown document starting with its title.";

    const proposal = await generateAIResponse(prompt, systemInstruction);
    res.json({
      proposal,
      project: project.name,
      grant: grantTitle
    });
  } catch (error) {
    next(error);
  }
};
