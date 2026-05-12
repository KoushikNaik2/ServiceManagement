import dotenv from 'dotenv';
import Groq from 'groq-sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import axios from 'axios';

dotenv.config();

async function testGroq() {
  console.log('\n--- Testing GROQ ---');
  if (!process.env.GROQ_API_KEY) return console.log('❌ GROQ_API_KEY is missing');
  try {
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    await groq.chat.completions.create({
      messages: [{ role: 'user', content: 'hi' }],
      model: 'llama-3.1-8b-instant', // Updated model
      max_tokens: 5
    });
    console.log('✅ GROQ Connection Success!');
  } catch (err) {
    console.log('❌ GROQ Failed:', err.message);
  }
}

async function testGemini() {
  console.log('\n--- Testing GEMINI ---');
  if (!process.env.GEMINI_API_KEY) return console.log('❌ GEMINI_API_KEY is missing');
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    // Trying gemini-pro as a stable alternative
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    await model.generateContent("hi");
    console.log('✅ GEMINI Connection Success!');
  } catch (err) {
    console.log('❌ GEMINI Failed:', err.message);
  }
}

async function testDeepSeek() {
  console.log('\n--- Testing DEEPSEEK ---');
  if (!process.env.DEEPSEEK_API_KEY) return console.log('❌ DEEPSEEK_API_KEY is missing');
  try {
    const response = await axios.post('https://api.deepseek.com/chat/completions', {
      model: 'deepseek-chat',
      messages: [{ role: 'user', content: 'hi' }],
      max_tokens: 5
    }, {
      headers: { 'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}` },
      timeout: 5000
    });
    console.log('✅ DEEPSEEK Connection Success!');
  } catch (err) {
    console.log('❌ DEEPSEEK Failed:', err.message);
  }
}

async function runAll() {
  console.log('🚀 Starting AI Diagnostic Test (Updated Models)...');
  console.log('Working Directory:', process.cwd());
  await testGroq();
  await testDeepSeek();
  await testGemini();
  console.log('\n--- Test Complete ---');
}

runAll();
