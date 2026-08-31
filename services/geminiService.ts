
import { GoogleGenAI, Type, Modality, GenerateContentResponse } from "@google/genai";
import { ScanResult, ScanType } from "../types";

// Initialize Gemini Client safely
const getApiKey = () => {
  if (typeof process !== 'undefined' && process.env && process.env.API_KEY) {
    return process.env.API_KEY;
  }
  return '';
};

const apiKey = getApiKey();
const ai = new GoogleGenAI({ apiKey });

/**
 * Helper to retry API calls on 429 (Quota), 503 (Service Unavailable), or 500 (Server Error)
 */
const callWithRetry = async <T>(fn: () => Promise<T>, retries = 3, delay = 2000): Promise<T> => {
  try {
    return await fn();
  } catch (error: any) {
    const msg = error?.message || '';
    const status = error?.status;

    // Detect Retryable Errors
    const isQuotaError = status === 429 || msg.includes('429') || msg.includes('quota') || msg.includes('RESOURCE_EXHAUSTED');
    const isServerError = status === 503 || status === 500 || msg.includes('503') || msg.includes('overloaded');

    if (retries > 0 && (isQuotaError || isServerError)) {
      const reason = isQuotaError ? "Quota Limit" : "Server Overload";
      console.warn(`${reason} detected. Retrying in ${delay}ms... (${retries} attempts left)`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return callWithRetry(fn, retries - 1, delay * 2);
    }
    throw error;
  }
};

/**
 * Analyzes a medical image (Tablet or Report)
 */
export const analyzeMedicalImage = async (
  base64Image: string,
  type: ScanType
): Promise<Omit<ScanResult, 'id' | 'date' | 'imageUrl' | 'type'>> => {
  
  if (!apiKey) {
    throw new Error("API_KEY_MISSING");
  }

  let prompt = "";

  if (type === ScanType.TABLET) {
    prompt = `
      You are 'Digital Doctor'. Analyze this TABLET/MEDICINE/SKINCARE image.
      
      CRITICAL INSTRUCTION: Output strict JSON.
      
      1. **Title**: Identify ALL visible medicine/product names found in the image (e.g. "Hylofy Serum, Aquasoft, Manusa, & Tretin").
      2. **Primary Uses**: Identify EVERY SINGLE product visible. Return a CLEAN and NEAT strictly NUMBERED LIST (1, 2, 3...). 
         - **FORMAT RULE**: Start each new item on a NEW LINE using \\n.
         - Do not bold the numbers "1.".
         - Format MUST be:
           "1. **[Product Name]**: [Short, clear instruction/use].\\n2. **[Product Name]**: [Short, clear instruction/use].\\n3. **[Product Name]**: [instruction]..."
         - Example: "1. **Hylofy Serum**: Apply on face for hydration.\\n2. **Aquasoft**: Use as a moisturizer."
         - If there are 4 items, list 1 to 4. Do not summarize. Keep points short.
      3. **avoidAdvice**: What should the patient AVOID? Return a CLEAN NUMBERED LIST (1., 2., 3...).
         - **FORMAT RULE**: Start each new item on a NEW LINE using \\n.
         - **MANDATORY**: You MUST provide avoid advice. If no specific warnings are visible, provide general medical precautions for this type of medication (e.g. "1. Keep out of reach of children.\\n2. Do not exceed recommended dose.").
         - Example: "1. Avoid direct sunlight.\\n2. Do not take on an empty stomach.\\n3. Avoid alcohol consumption."
      4. **consumptionAdvice**: Who can use this? Categorize by age/gender.
         - Return a clean numbered list separated by \\n.
         - Categories: "Children", "Adults (30+)", "Elderly (60+)", "Pregnancy".
         - Example: "1. **Children**: Consult pediatrician.\\n2. **Adults (30+)**: One tablet daily.\\n3. **Elderly (60+)**: Monitor blood pressure."
      5. **Analysis**: Return an empty array [].
      6. **Risk Level**: Return "Safe" (Dummy value).
      7. **IsDanger**: Return false (Dummy value).
      8. **DangerReason**: Return "" (Dummy value).
      9. **ReportValues**: Return empty array [].
      10. **Dietary Advice**: Return "" (Dummy value).
      11. **Recommendation**: Key usage tip.
      12. **Motivational Message**: One short sentence.
      13. **Report Date**: Return "" (Dummy value).
      14. **Patient Name**: Return "" (Dummy value).
      15. **Doctor Name**: Return "" (Dummy value).
      16. **Recommended Specialist**: Return "" (Dummy value).

      Do NOT return doctor name, hospital, or patient age for tablets/products.
    `;
  } else {
    prompt = `
      You are 'Digital Doctor'. Analyze this MEDICAL REPORT image.
      
      CRITICAL INSTRUCTION: Output strict JSON. Look closely at headers, footers, and top-left/top-right sections for names.
      
      1. **Title**: Report Name (e.g., "Complete Blood Count").
      2. **Primary Uses**: List what this report tests for as a CLEAN NUMBERED LIST (1., 2., 3...).
         - **FORMAT RULE**: Start each item on a NEW LINE using \\n.
         - **CRITICAL**: Do NOT write a paragraph. Use "1. Text\\n2. Text".
         - Example: "1. Measures hemoglobin levels.\\n2. Checks for infections.\\n3. Evaluates kidney function."
      3. **Analysis**: List key findings/abnormalities as SHORT bullet points (Max 6 words each).
         - Severity 'high': Critical/Abnormal values (Red).
         - Severity 'moderate': Borderline values (Yellow).
         - Severity 'safe': Normal values (Green).
      4. **Report Values**: Extract SPECIFIC measured values into a structured list (Test Name, Value, Unit, Status).
      5. **Risk Level**: Safe/Moderate/High.
      6. **IsDanger**: True if critical values found.
      7. **DangerReason**: Why is it critical?
      8. **Doctor Name**: Look for "Dr.", "Consultant", "Referred By" or signatures. Extract the full name (e.g., "Dr. S. K. Gupta"). If not found, return empty string.
      9. **Patient Name**: Look for "Patient Name", "Name", "Mr/Ms". Extract full name.
      10. **Patient Age**: Extract Age/Gender if visible.
      11. **Hospital Name**: Look for logos or bold headers at the top.
      12. **Report Date**: Extract the date and time of the report/collection.
      13. **Dietary Advice**: 
          - **CRITICAL CONDITION**: ALWAYS provide advice, whether normal or abnormal.
          - **IF NORMAL**: Provide tips to maintain these healthy levels.
          - **IF ABNORMAL**: Provide specific, actionable dietary interventions based on the findings.
          - Provide the answer as a clear, natural paragraph or bullet points.
            - List specific foods to EAT.
            - List specific foods to AVOID.
            - Example: "Since your hemoglobin is low (Anemia), increase intake of iron-rich foods like spinach, red meat, and dates. Avoid drinking tea/coffee with meals."
      14. **Recommendation**: Next steps.
      15. **Motivational Message**: One short sentence.
      16. **AvoidAdvice**: Return "" (Dummy value).
      17. **Recommended Specialist**: Based on the abnormalities, specify the type of specialist to consult (e.g., "Cardiologist", "Endocrinologist", "Hematologist", "General Physician").
      18. **consumptionAdvice**: Return "" (Dummy value).
    `;
  }

  try {
    const response = await callWithRetry<GenerateContentResponse>(() => ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: base64Image,
            },
          },
          { text: prompt },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: "Name/Title" },
            primaryUses: { type: Type.STRING, description: "Numbered list of uses" },
            avoidAdvice: { type: Type.STRING, description: "Numbered list of avoid advice" },
            consumptionAdvice: { type: Type.STRING, description: "Usage instructions by age group" },
            isDanger: { type: Type.BOOLEAN, description: "True if high risk" },
            riskLevel: { type: Type.STRING, enum: ["Safe", "Moderate", "High/Danger"] },
            dangerReason: { type: Type.STRING, description: "Short reason if dangerous" },
            analysis: { 
              type: Type.ARRAY, 
              items: {
                type: Type.OBJECT,
                properties: {
                  point: { type: Type.STRING, description: "Key finding text (Max 6 words)" },
                  severity: { type: Type.STRING, enum: ['high', 'moderate', 'safe', 'info'] }
                },
                required: ['point', 'severity']
              },
              description: "List of key points with severity"
            },
            reportValues: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  testName: { type: Type.STRING, description: "Name of the test (e.g. Hemoglobin)" },
                  value: { type: Type.STRING, description: "Numerical value (e.g. 14.5)" },
                  unit: { type: Type.STRING, description: "Unit (e.g. g/dL)" },
                  status: { type: Type.STRING, enum: ['Normal', 'Abnormal', 'Critical'] }
                },
                required: ['testName', 'value', 'unit', 'status']
              },
              description: "Structured list of lab values extracted from report"
            },
            recommendation: { type: Type.STRING, description: "Short usage tips." },
            motivationalMessage: { type: Type.STRING, description: "One short comforting sentence." },
            doctorName: { type: Type.STRING, description: "Doctor Name with 'Dr.' prefix if available" },
            patientName: { type: Type.STRING, description: "Patient Name" },
            patientAgeInReport: { type: Type.STRING, description: "Patient Age" },
            hospitalName: { type: Type.STRING, description: "Hospital/Lab Name" },
            reportDate: { type: Type.STRING, description: "Date and Time of Report" },
            dietaryAdvice: { type: Type.STRING, description: "Specific food advice only if abnormalities found" },
            recommendedSpecialist: { type: Type.STRING, description: "Type of doctor to consult (e.g. Cardiologist)" }
          },
          required: ["title", "primaryUses", "avoidAdvice", "consumptionAdvice", "isDanger", "riskLevel", "analysis", "recommendation", "motivationalMessage", "dietaryAdvice"]
        }
      }
    }));

    if (response.text) {
      // CLEAN UP JSON: Remove markdown backticks if present (Common Gemini issue)
      let cleanText = response.text.replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(cleanText);
    }
    throw new Error("No response text from Gemini");
  } catch (error) {
    console.error("Analysis failed:", error);
    throw error;
  }
};

/**
 * Translates text to a target language
 */
export const translateText = async (text: string, targetLanguage: string): Promise<string> => {
  if (!apiKey) return text;
  
  try {
    const response = await callWithRetry<GenerateContentResponse>(() => ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [{ text: `Translate the following medical summary to ${targetLanguage} for speech synthesis. Keep the tone natural and comforting. Text: "${text}"` }]
      }
    }));
    return response.text || text;
  } catch (error) {
    console.error("Translation failed", error);
    return text; // Fallback to original
  }
};

/**
 * Helper to decode Base64 string to Uint8Array
 */
const decodeBase64 = (base64: string): Uint8Array => {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
};

/**
 * Helper to convert raw PCM data to an AudioBuffer
 * Gemini TTS returns raw PCM (16-bit signed integer, 24kHz, mono)
 */
const pcmToAudioBuffer = (pcmData: Uint8Array, sampleRate: number = 24000): AudioBuffer => {
  // Use OfflineAudioContext to avoid "max AudioContexts" errors and autoplay policies
  const OfflineAudioContextClass = window.OfflineAudioContext || (window as any).webkitOfflineAudioContext;
  const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
  
  if (!OfflineAudioContextClass && !AudioContextClass) {
    throw new Error("Web Audio API is not supported");
  }

  // 16-bit PCM
  const pcm16 = new Int16Array(pcmData.buffer, pcmData.byteOffset, pcmData.byteLength / 2);
  
  let ctx: BaseAudioContext;
  if (OfflineAudioContextClass) {
      ctx = new OfflineAudioContextClass(1, pcm16.length || 1, sampleRate);
  } else {
      ctx = new AudioContextClass();
  }

  const audioBuffer = ctx.createBuffer(1, pcm16.length, sampleRate);
  const channelData = audioBuffer.getChannelData(0);
  for (let i = 0; i < pcm16.length; i++) {
    channelData[i] = pcm16[i] / 32768.0;
  }
  
  if (typeof (ctx as any).close === 'function') {
      (ctx as any).close();
  }
  
  return audioBuffer;
};

/**
 * Converts text to speech using Gemini TTS
 */
export const generateSpeech = async (text: string): Promise<AudioBuffer | null> => {
  if (!apiKey) return null;

  try {
    const response = await callWithRetry<GenerateContentResponse>(() => ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    }));

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) return null;

    const pcmData = decodeBase64(base64Audio);
    return pcmToAudioBuffer(pcmData, 24000);

  } catch (error) {
    console.error("TTS failed:", error);
    return null;
  }
};

/**
 * Chat with the Digital Doctor
 */
export const chatWithDoctor = async (message: string, history: {role: string, parts: {text: string}[]}[]): Promise<string> => {
  if (!apiKey) return "Error: System configuration issue (Missing API Key).";

  try {
    const chat = ai.chats.create({
      model: 'gemini-2.5-flash',
      history: [
        {
          role: 'user',
          parts: [{ text: "You are 'Digital Doctor', a helpful AI medical assistant. Answer concisely using bullet points." }]
        },
        {
          role: 'model',
          parts: [{ text: "Understood." }]
        },
        ...history
      ]
    });

    const result = await callWithRetry<GenerateContentResponse>(() => chat.sendMessage({ message }));
    return result.text || "I apologize, I couldn't process that request.";
  } catch (error) {
    console.error("Chat failed", error);
    return "I am having trouble connecting to my medical database right now.";
  }
};
