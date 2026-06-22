import { Router } from 'express';
import * as analyticsController from '../controllers/analyticsController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/overview', analyticsController.getOverview);
router.get('/personal-records', analyticsController.getPersonalRecords);
router.get('/volume-chart', analyticsController.getVolumeChart);
router.get('/frequency', analyticsController.getFrequency);
router.get('/weekly-frequency', analyticsController.getWeeklyFrequency);
router.get('/muscle-distribution', analyticsController.getMuscleDistribution);

export default router;
