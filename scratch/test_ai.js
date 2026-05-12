import 'dotenv/config';
import { GoogleGenerativeAI } from '@google/generative-ai';

async function testAI() {
  const key = process.env.GEMINI_API_KEY;
  console.log('Testing key:', key?.slice(0, 15) + '...');
  if (!key) {
    console.error('No GEMINI_API_KEY');
    return;
  }
  
  // Test different models
  const models = ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-2.0-flash', 'gemini-pro'];
  
  for (const modelName of models) {
    const genAI = new GoogleGenerativeAI(key);
    const model = genAI.getGenerativeModel({ model: modelName });
    try {
      const result = await model.generateContent('Say hi');
      console.log(`✅ Model ${modelName} works:`, result.response.text().slice(0, 50));
      break;
    } catch (err) {
      console.log(`❌ Model ${modelName}: ${err.message.slice(0, 80)}`);
    }
  }
}

testAI();
