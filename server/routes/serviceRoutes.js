import express from 'express';
import { bookService, getMyServices, analyzeServiceRequest, cancelServiceRequest, deleteServiceRequest, clearAllPending } from '../controllers/serviceController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.route('/').post(bookService).get(getMyServices);
router.post('/clear-pending', clearAllPending);
router.route('/:id').delete(deleteServiceRequest);
router.post('/:id/cancel', cancelServiceRequest);
router.post('/analyze', analyzeServiceRequest);

export default router;
