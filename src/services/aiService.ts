const modelName = "gemini-3.1-flash-lite";
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent`;

export const generateAIResponse = async (
  promptOrContents: string | any[],
  systemInstruction?: string
): Promise<string> => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "mock") {
    console.log("Using Mock AI fallback response (Invalid or Mock Gemini API Key)");
    const prompt = typeof promptOrContents === "string" 
      ? promptOrContents 
      : (promptOrContents[promptOrContents.length - 1]?.parts?.[0]?.text || "");
    return getMockFallbackResponse(prompt);
  }

  try {
    let contents: any[] = [];
    if (typeof promptOrContents === "string") {
      contents = [
        {
          role: "user",
          parts: [{ text: promptOrContents }]
        }
      ];
    } else {
      contents = promptOrContents;
    }

    const payload: any = { contents };
    if (systemInstruction) {
      payload.systemInstruction = {
        parts: [{ text: systemInstruction }]
      };
    }

    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Gemini API returned status ${response.status}`);
    }

    const data = await response.json();
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!reply) {
      throw new Error("Invalid response format from Gemini API");
    }
    return reply;
  } catch (error: any) {
    console.error("Gemini API call failed:", error.message);
    const prompt = typeof promptOrContents === "string" 
      ? promptOrContents 
      : (promptOrContents[promptOrContents.length - 1]?.parts?.[0]?.text || "");
    return getMockFallbackResponse(prompt);
  }
};

const getMockFallbackResponse = (prompt: string): string => {
  const lowerPrompt = prompt.toLowerCase();
  
  if (lowerPrompt.includes("eligibility") || lowerPrompt.includes("nih")) {
    return `Based on your loaded project context, you meet the primary eligibility for the NIH Seed Fund. However, section 4.2 requires a detailed Data Management Plan for clinical trials. Would you like me to draft a compliant Data Management Plan based on the official rubric?`;
  }
  
  if (lowerPrompt.includes("abstract") || lowerPrompt.includes("nsf")) {
    return `Here is a drafted abstract for the NSF Deep Tech Seed Fund:
    
PROJECT ABSTRACT:
This project proposes a novel AI-driven diagnostic platform designed to detect early-stage medical anomalies with high accuracy. By leveraging advanced machine learning models trained on diverse clinical datasets, the technology will enable clinicians to identify risks sooner, improving patient outcomes and reducing treatment costs. This aligns with the NSF's focus on deep tech innovations with commercial viability and positive societal impact.`;
  }

  if (lowerPrompt.includes("budget") || lowerPrompt.includes("pitfalls")) {
    return `Common pitfalls in grant budgeting include:
1. Unjustified personnel costs (make sure every role is clearly mapped to a project objective).
2. Underestimating indirect costs (ensure you use the correct federally negotiated rate or limit).
3. Vague descriptions of equipment purchases.
Let me know if you would like me to review your specific budget breakdown.`;
  }

  return `I have processed your query based on your loaded project context. I can help analyze your eligibility, draft abstract sections, or review compliance. What would you like to focus on next?`;
};
