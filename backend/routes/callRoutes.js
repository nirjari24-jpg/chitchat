const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
    initiateCall,
    getIncomingCall,
    updateCallStatus,
    saveSignalData,
    addIceCandidate,
    syncCall
} = require('../controllers/callController');

// All call routes require authentication
router.use(protect);

// Start a new call
router.post('/start', initiateCall);

// Poll for incoming calls
router.get('/incoming', getIncomingCall);

// Update call status (accept, reject, end)
router.put('/:id/status', updateCallStatus);

// Save SDP signal (offer or answer)
router.put('/:id/signal', saveSignalData);

// Add ICE candidate
router.post('/:id/ice', addIceCandidate);

// Sync call state (polling)
router.get('/:id/sync', syncCall);

module.exports = router;
