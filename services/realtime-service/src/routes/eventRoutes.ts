import express from 'express';
import { invitationSent, invitationAccepted, taskAssigned } from '../controllers/eventController';

const router = express.Router();

// Invitation events
router.post('/invitation-sent', invitationSent);
router.post('/invitation-accepted', invitationAccepted);

// Task events
router.post('/task-assigned', taskAssigned);

export default router;