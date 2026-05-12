import express from 'express';
import { 
  getAllServiceRequests, 
  updateServiceStatus, 
  getDashboardStats, 
  deleteServiceRequest,
  getSettings,
  updateSettings,
  getServiceTypes,
  updateServiceType,
  createServiceType
} from '../controllers/adminController.js';
import { getMechanics, addMechanic, updateMechanic, deleteMechanic } from '../controllers/mechanicController.js';
import { protect, adminMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect, adminMiddleware);

router.route('/services').get(getAllServiceRequests);
router.route('/services/:id').put(updateServiceStatus).patch(updateServiceStatus).delete(deleteServiceRequest);
router.route('/stats').get(getDashboardStats);

router.route('/mechanics').get(getMechanics).post(addMechanic);
router.route('/mechanics/:id').put(updateMechanic).delete(deleteMechanic);

router.route('/settings').get(getSettings).put(updateSettings);
router.route('/service-types').get(getServiceTypes).post(createServiceType);
router.route('/service-types/:id').put(updateServiceType);

export default router;
