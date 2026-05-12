import dotenv from 'dotenv';
import Groq from 'groq-sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import axios from 'axios';

dotenv.config();

/**
 * Smart JSON extraction: finds the first { and last } to avoid parsing errors
 */
const extractJson = (text) => {
  try {
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start === -1 || end === -1) throw new Error('No JSON object found in response');
    const jsonStr = text.substring(start, end + 1);
    return JSON.parse(jsonStr);
  } catch (e) {
    console.error('--- AI PARSE ERROR ---');
    console.error('Raw Text:', text);
    throw new Error('Failed to parse AI response into a valid mission record.');
  }
};

/**
 * Unified request handler with robust fallback
 */
const callAiWithFallback = async (params) => {
  const { systemPrompt, userPrompt, isJson = false, temperature = 0.7 } = params;
  const errors = [];

  // 1. Try GROQ (Llama-3.1)
  if (process.env.GROQ_API_KEY && !process.env.GROQ_API_KEY.includes('your_')) {
    try {
      console.log('📡 [AI] Attempting GROQ (Llama-3.1)...');
      const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
      const response = await groq.chat.completions.create({
        messages: [
          { role: 'system', content: isJson ? systemPrompt + ' Return ONLY valid JSON.' : systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        model: 'llama-3.1-8b-instant', // Updated model
        temperature: isJson ? 0.1 : temperature,
        response_format: isJson ? { type: "json_object" } : undefined
      });
      console.log('✅ [AI] GROQ Success');
      return response.choices[0]?.message?.content;
    } catch (err) {
      console.warn('❌ [AI] GROQ Failed:', err.message);
      errors.push(`Groq: ${err.message}`);
    }
  }

  // 2. Try GEMINI (1.5 Flash)
  if (process.env.GEMINI_API_KEY && !process.env.GEMINI_API_KEY.includes('your_')) {
    try {
      console.log('📡 [AI] Attempting GEMINI (1.5 Flash)...');
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const prompt = isJson 
        ? `${systemPrompt}\n\nUser Input: ${userPrompt}\n\nReturn ONLY a valid JSON object.`
        : `${systemPrompt}\n\nUser Input: ${userPrompt}`;
      
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      console.log('✅ [AI] GEMINI Success');
      return text;
    } catch (err) {
      console.warn('❌ [AI] GEMINI Failed:', err.message);
      errors.push(`Gemini: ${err.message}`);
    }
  }

  // 3. Try DEEPSEEK (As final fallback)
  if (process.env.DEEPSEEK_API_KEY && !process.env.DEEPSEEK_API_KEY.includes('your_')) {
    try {
      console.log('📡 [AI] Attempting DEEPSEEK...');
      const response = await axios.post('https://api.deepseek.com/chat/completions', {
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: isJson ? systemPrompt + ' Return ONLY valid JSON.' : systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: isJson ? 0.1 : temperature
      }, {
        headers: {
          'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 15000
      });
      console.log('✅ [AI] DEEPSEEK Success');
      return response.data.choices[0]?.message?.content;
    } catch (err) {
      console.warn('❌ [AI] DEEPSEEK Failed:', err.message);
      errors.push(`DeepSeek: ${err.message}`);
    }
  }

  throw new Error(`All neural links failed. ${errors.join(' | ')}`);
};

export const aiService = {
  async diagnose(brand, modelName, issueDescription) {
    const systemPrompt = "You are an expert vehicle mechanic. Provide problemSummary, conditionAssessment, recommendedService, estimatedCostMin, estimatedCostMax, urgencyLevel.";
    const userPrompt = `Vehicle: ${brand} ${modelName}. Issue: ${issueDescription}.`;
    const content = await callAiWithFallback({ systemPrompt, userPrompt, isJson: true });
    return extractJson(content);
  },

  async estimateCost(brand, modelName, serviceType, issueDescription) {
    const systemPrompt = "Automotive cost estimator. Provide parts: [{name, minCost, maxCost}], laborMin, laborMax, totalMin, totalMax, estimatedDuration, aiNote.";
    const userPrompt = `Estimate for ${serviceType} on ${brand} ${modelName}. Issue: ${issueDescription}.`;
    const content = await callAiWithFallback({ systemPrompt, userPrompt, isJson: true });
    return extractJson(content);
  },

  async chat(message, history = []) {
    const systemPrompt = `You are ServicePoint Neural Assistant, an elite automotive expert.
    - Provide realistic ₹ (INR) cost estimates for common services based on the vehicle type.
    - Be knowledgeable about vehicle brands (Toyota, Honda, BMW, etc.) and their specific maintenance needs.
    - Explain ServicePoint offerings: Doorstep Pickup/Drop, AI-powered Diagnostics, Expert Mechanics, and Transparent Pricing.
    - Keep responses concise, professional, and helpful. Use bold text for key details.`;
    const userPrompt = `Context: ${JSON.stringify(history.slice(-3))}\n\nUser Question: ${message}`;
    return await callAiWithFallback({ systemPrompt, userPrompt });
  },

  async getInsight(vehicles, history) {
    const systemPrompt = "Maintenance advice (under 20 words).";
    const userPrompt = `Data: ${JSON.stringify(vehicles)}, History: ${JSON.stringify(history)}`;
    return await callAiWithFallback({ systemPrompt, userPrompt });
  },

  async getMonthlyReport(records) {
    const systemPrompt = "Strategic mission summary report.";
    const userPrompt = `Logs: ${JSON.stringify(records)}`;
    return await callAiWithFallback({ systemPrompt, userPrompt });
  }
};
