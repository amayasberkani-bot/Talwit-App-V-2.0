import { GoogleGenAI, Type } from "@google/genai";
import { UserContext } from "../types";

// Initialize AI Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const BASE_INSTRUCTION = `
You are Talwit, a supportive, empathetic, and intelligent study companion for a university student.
Your tone is calm, encouraging, and non-judgmental.
You are NOT a therapist. If a user expresses severe distress, kindly suggest they seek professional help.
Your primary goals:
1. Help organize study sessions efficiently.
2. Reduce academic anxiety by breaking tasks down.
3. Validate feelings ("It's okay to feel overwhelmed") while pivoting to actionable small steps.
4. Keep answers concise and readable.
`;

export const chatWithCompanion = async (message: string, moodContext: string, userContext?: UserContext): Promise<string> => {
  try {
    const model = 'gemini-2.5-flash';
    
    // Construct the personalized profile
    let profileContext = "";
    if (userContext) {
      profileContext = `
      USER PROFILE CONTEXT (Use this to personalize your advice):
      - Name: ${userContext.name}
      - Studying: ${userContext.studyField}
      - Current Goal: ${userContext.mainGoal}
      - Best Study Time: ${userContext.productiveTime}
      - Current Workload: ${userContext.currentLoad}
      - Wellness State: ${userContext.wellnessStatus}
      - Preferred Motivation Style: ${userContext.motivationStyle}
      - Stress Relief Strategy: ${userContext.stressRelief}
      
      When relevant, refer to their study field or goals. If they like gentle motivation, be softer. If they like structured planning, be more direct.
      `;
    }

    const contextPrompt = `The user is currently feeling: ${moodContext}. Please adjust your tone accordingly.\n${profileContext}`;
    
    const response = await ai.models.generateContent({
      model,
      contents: [
        { role: 'user', parts: [{ text: contextPrompt + "\n" + message }] }
      ],
      config: {
        systemInstruction: BASE_INSTRUCTION,
      }
    });

    return response.text || "I'm here for you, but I'm having trouble processing that right now.";
  } catch (error) {
    console.error("Chat Error:", error);
    return "I'm having a little trouble connecting right now. Let's take a deep breath and try again in a moment.";
  }
};

export const generateStudyPlan = async (
  subject: string, 
  duration: string, 
  energyLevel: string
): Promise<any> => {
  try {
    const prompt = `Create a study plan for ${subject} for the next ${duration}. My energy level is ${energyLevel}. 
    Break it down into blocks. If energy is low, include more breaks.
    Return ONLY a JSON object with this schema:
    {
      "goal": "Main objective",
      "blocks": [
        { "activity": "Specific task", "duration": "time in mins", "type": "focus" | "break" | "review" }
      ]
    }`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
            type: Type.OBJECT,
            properties: {
                goal: { type: Type.STRING },
                blocks: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            activity: { type: Type.STRING },
                            duration: { type: Type.STRING },
                            type: { type: Type.STRING, enum: ["focus", "break", "review"] }
                        }
                    }
                }
            }
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response");
    return JSON.parse(text);

  } catch (error) {
    console.error("Plan Gen Error:", error);
    throw new Error("Could not generate plan.");
  }
};
