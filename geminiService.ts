
import { GoogleGenAI } from "@google/genai";

// Initialize the GoogleGenAI client with the API key from environment variables
// The apiKey parameter must be obtained exclusively and directly from process.env.API_KEY
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getCareerAdvice = async (userProfile: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: userProfile,
      config: {
        systemInstruction: `You are a professional career counselor at Fortex Education (Kerala). 
        Your goal is to help students choose between our core programs: B.Sc. Nursing, GNM, Medical Laboratory Technology (MLT), BCA, and Engineering.
        Provide encouraging, concise, and expert advice based on the student's interests or background. 
        Always mention that Fortex offers admissions support in Wayanad and Malappuram. 
        Keep the tone professional and helpful.`,
        temperature: 0.7,
      },
    });

    // Directly access the text property; do not use text() method.
    // Ensure we provide a fallback message if response.text is undefined.
    return response.text || "I'm sorry, I'm having trouble generating advice at the moment. Please call us at +91 70253 37762 for immediate assistance.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "I'm sorry, I'm having trouble connecting right now. Please call us at +91 70253 37762 for immediate assistance.";
  }
};