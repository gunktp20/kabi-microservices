import express from 'express';
import { invitationSent, invitationAccepted } from '../controllers/eventController';

const router = express.Router();

// Invitation events
router.post('/invitation-sent', invitationSent);
router.post('/invitation-accepted', invitationAccepted);

export default router;