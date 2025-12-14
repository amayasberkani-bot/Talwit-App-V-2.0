
import { GoogleGenAI, Type } from "@google/genai";
import { UserContext, Language, ActivityLog, WeeklySchedule } from "../types";

// Initialize AI Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const DEFAULT_INSTRUCTION = `
You are Talwit, a supportive, empathetic, and intelligent study companion for a university student.
Your tone is calm, encouraging, and non-judgmental.
You are NOT a therapist. If a user expresses severe distress, kindly suggest they seek professional help.

**SMART AGENDA CAPABILITY:**
If the user mentions a specific task, homework, deadline, exam, or event that should be remembered, you MUST perform two actions:
1. Respond naturally to the user acknowledging the item.
2. At the very end of your response, output a HIDDEN JSON block in this exact format:

\`\`\`json
{
  "action": "ADD_AGENDA",
  "title": "Short title of task",
  "type": "homework" | "project" | "event" | "task",
  "date": "YYYY-MM-DD"
}
\`\`\`

Rules for JSON:
- Calculate the "date" based on the current date provided in the context. If they say "tomorrow", add 1 day. If they say "next Monday", calculate the date.
- The JSON block must be valid and wrapped in triple backticks.
- Do not mention the JSON block in your spoken text.
`;

const PLANNER_INSTRUCTION = `
You are Talwit, an expert academic planner and time-management strategist.
Your goal is to analyze the provided schedule image, identify gaps, and fill them with productive study sessions balanced with wellness activities based on the user's profile.

OUTPUT FORMAT (STRICT):
Do not write paragraphs or intros. 
You MUST output the plan as a Markdown Table with columns: 
| Day | Time Slot | Activity | Focus Type (Pomodoro/Deep) |
`;

export const chatWithCompanion = async (
    message: string, 
    moodContext: string, 
    userContext?: UserContext, 
    language: Language = 'en',
    recentActivity: ActivityLog[] = [],
    imageBase64?: string | null
): Promise<string> => {
  try {
    const model = 'gemini-2.5-flash';
    
    // 1. Get Real-time Context
    const now = new Date();
    const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const dateString = now.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

    // 2. Define Data Context (From Firestore/Local State)
    let profileContext = `
      CURRENT DATE/TIME: ${dateString}, ${timeString}.
    `;
    
    if (userContext) {
      profileContext += `
      USER PROFILE:
      - Name: ${userContext.name}
      - Major/Field: ${userContext.studyField}
      - Peak Focus Time: ${userContext.productiveTime}
      - Stress Relief: ${userContext.stressRelief}
      - Hobbies: ${userContext.hobbies || "Not specified"}
      - Current Workload: ${userContext.currentLoad}
      `;
    }

    // 3. Determine System Instruction based on Input Type
    let systemInstruction = DEFAULT_INSTRUCTION;
    
    // --- LANGUAGE INJECTION ---
    const langInstruction = language === 'ar' 
        ? "IMPORTANT: You MUST reply in Arabic (العربية). Use a warm, supportive tone appropriate for an Arabic-speaking student."
        : language === 'fr'
        ? "IMPORTANT: You MUST reply in French (Français). Use 'tu' (informal) to be friendly."
        : "IMPORTANT: Reply in English.";

    systemInstruction += `\n\n${langInstruction}`;

    let userPrompt = `
      CONTEXT:
      ${profileContext}
      User Mood: ${moodContext}.
      
      MESSAGE:
      ${message}
    `;

    // 4. Construct Payload
    const contentParts: any[] = [];

    // If Image is present, switch to Planner Persona
    if (imageBase64) {
        systemInstruction = PLANNER_INSTRUCTION + `\n\n${langInstruction}`;
        
        userPrompt = `
        ${profileContext}
        
        INSTRUCTION:
        Analyze the attached schedule image to find free slots. 
        Cross-reference with the user's Peak Focus Time (${userContext?.productiveTime}) for hard subjects (${userContext?.studyField}).
        Today is ${dateString}.
        
        Create a detailed weekly study plan based on the user's request: "${message}"
        `;

        // Add Image Part
        contentParts.push({ 
            inlineData: { 
                mimeType: 'image/png', 
                data: imageBase64 
            } 
        });
    }

    // Add Text Part
    contentParts.push({ text: userPrompt });

    const response = await ai.models.generateContent({
      model,
      contents: [
        { role: 'user', parts: contentParts }
      ],
      config: {
        systemInstruction: systemInstruction,
      }
    });

    return response.text || "I'm having trouble analyzing that right now.";
  } catch (error) {
    console.error("Chat Error:", error);
    return "I'm having a little trouble connecting right now. Let's take a deep breath and try again in a moment.";
  }
};

/**
 * Generates a short, dynamic welcome message based on time of day.
 */
export const generateDailyGreeting = async (
    userContext: UserContext | null,
    language: Language
): Promise<string> => {
    try {
        const now = new Date();
        const hours = now.getHours();
        const timeOfDay = hours < 12 ? 'Morning' : hours < 18 ? 'Afternoon' : 'Evening';
        const name = userContext?.name || 'Student';
        
        // Simple prompt for a quick, creative greeting
        const prompt = `
        Generate a warm, short (max 20 words) greeting for a student named "${name}".
        Time of day: ${timeOfDay}.
        Language: ${language} (${language === 'ar' ? 'Arabic' : language === 'fr' ? 'French' : 'English'}).
        Context: They are opening their study app. Be encouraging but natural.
        Do not use hashtags.
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [{ role: 'user', parts: [{ text: prompt }] }]
        });

        return response.text || `Welcome back, ${name}! Ready to focus?`;
    } catch (e) {
        console.error("Greeting Gen Error", e);
        return `Hello ${userContext?.name || ''}! How can I help you today?`;
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

export const generateScheduleFromImage = async (
    imageBase64: string, 
    userContext: UserContext | null
): Promise<WeeklySchedule> => {
    try {
        const contextStr = userContext ? `
        The user studies: ${userContext.studyField}.
        Their hobbies are: ${userContext.hobbies}.
        Their stress relief methods are: ${userContext.stressRelief}.
        Their productive time is: ${userContext.productiveTime}.
        ` : '';

        const prompt = `
        Analyze the attached image of a weekly schedule.
        1. Extract all FIXED commitments (classes, labs, work). Mark them as type 'fixed'.
        2. Identify the gaps/free time.
        3. Fill the gaps with:
           - 'study' blocks for their major (${userContext?.studyField || 'studies'}).
           - 'wellness' or 'hobby' blocks based on their hobbies (${userContext?.hobbies || 'relaxing'}) and stress relief (${userContext?.stressRelief || 'breathing'}).
           - 'meal' blocks for lunch/dinner.
        4. Ensure a balanced, healthy schedule. Do not overwork the student.
        5. Return a JSON object for the whole week (Monday to Sunday).
        
        Use specific start and end times (HH:MM).
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: {
                parts: [
                    { inlineData: { mimeType: 'image/png', data: imageBase64 } },
                    { text: prompt + contextStr }
                ]
            },
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        weekId: { type: Type.STRING },
                        days: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    day: { type: Type.STRING }, // "Monday", "Tuesday"...
                                    blocks: {
                                        type: Type.ARRAY,
                                        items: {
                                            type: Type.OBJECT,
                                            properties: {
                                                id: { type: Type.STRING },
                                                startTime: { type: Type.STRING },
                                                endTime: { type: Type.STRING },
                                                activity: { type: Type.STRING },
                                                type: { type: Type.STRING, enum: ['fixed', 'study', 'wellness', 'hobby', 'meal'] },
                                                description: { type: Type.STRING }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });

        const text = response.text;
        if (!text) throw new Error("No schedule generated");
        return JSON.parse(text);

    } catch (error) {
        console.error("Schedule Gen Error:", error);
        throw new Error("Failed to generate schedule from image.");
    }
};
