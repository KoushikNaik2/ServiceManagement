import express from 'express';
import { aiService } from '../services/aiService.js';

const router = express.Router();

// Middleware to handle AI errors
const handleAiError = (res, err) => {
  console.error('AI Route Error:', err);
  res.status(500).json({ 
    error: 'AI Systems Malfunction', 
    message: err.message,
    status: 'NEURAL_LINK_ERROR'
  });
};

router.post('/diagnose', async (req, res) => {
  try {
    const { brand, model, issueDescription } = req.body;
    const diagnosis = await aiService.diagnose(brand, model, issueDescription);
    res.json(diagnosis);
  } catch (err) {
    handleAiError(res, err);
  }
});

router.post('/cost-estimate', async (req, res) => {
  try {
    const { brand, model, serviceType, issueDescription } = req.body;
    const estimate = await aiService.estimateCost(brand, model, serviceType, issueDescription);
    res.json(estimate);
  } catch (err) {
    handleAiError(res, err);
  }
});

router.post('/chat', async (req, res) => {
  try {
    const { message, history } = req.body;
    const response = await aiService.chat(message, history);
    res.json({ response });
  } catch (err) {
    handleAiError(res, err);
  }
});

router.post('/vehicle-insight', async (req, res) => {
  try {
    const { vehicles, serviceHistory } = req.body;
    const insight = await aiService.getInsight(vehicles, serviceHistory);
    res.json({ insight });
  } catch (err) {
    handleAiError(res, err);
  }
});

router.post('/monthly-report', async (req, res) => {
  try {
    const { records } = req.body;
    const report = await aiService.getMonthlyReport(records);
    res.json({ report });
  } catch (err) {
    handleAiError(res, err);
  }
});

export default router;
