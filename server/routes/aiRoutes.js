import express from 'express';
import { diagnoseIssue, getQuickInsight, chatWithAI, generateMonthlyReport, generateCostEstimate, workloadBalance } from '../controllers/aiController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.post('/diagnose', diagnoseIssue);
router.post('/vehicle-insight', getQuickInsight);
router.post('/chat', chatWithAI);
router.post('/monthly-report', generateMonthlyReport);
router.post('/cost-estimate', generateCostEstimate);
router.post('/workload-balance', workloadBalance);

export default router;
