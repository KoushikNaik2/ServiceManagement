import express from 'express';
import { getVehicles, addVehicle, updateVehicle, deleteVehicle } from '../controllers/vehicleController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(protect, getVehicles)
  .post(protect, addVehicle);

router.route('/:id')
  .patch(protect, updateVehicle)
  .delete(protect, deleteVehicle);

export default router;
