const Call = require('../models/Call');

// @desc    Initiate a new call
// @route   POST /api/calls/start
// @access  Private
const initiateCall = async (req, res) => {
    try {
        const { receiverId, isVideo, callerName } = req.body;
        const callerId = req.user.id;

        // Create new call
        const call = await Call.create({
            callerId,
            receiverId,
            isVideo,
            callerName
        });

        res.status(201).json(call);
    } catch (error) {
        console.error("Error initiating call:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// @desc    Get active incoming call for current user
// @route   GET /api/calls/incoming
// @access  Private
const getIncomingCall = async (req, res) => {
    try {
        const receiverId = req.user.id;

        // Find any 'ringing' call for this user
        const call = await Call.findOne({
            receiverId,
            status: 'ringing'
        }).sort({ createdAt: -1 });

        res.status(200).json(call || null);
    } catch (error) {
        console.error("Error fetching incoming calls:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// @desc    Update call status (accept, reject, end)
// @route   PUT /api/calls/:id/status
// @access  Private
const updateCallStatus = async (req, res) => {
    try {
        const { status } = req.body;
        
        const call = await Call.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        );

        if (!call) {
            return res.status(404).json({ message: "Call not found" });
        }

        res.status(200).json(call);
    } catch (error) {
        console.error("Error updating call status:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// @desc    Save SDP offer or answer
// @route   PUT /api/calls/:id/signal
// @access  Private
const saveSignalData = async (req, res) => {
    try {
        const { type, sdp } = req.body; // type is 'offer' or 'answer'
        
        const updateData = {};
        if (type === 'offer') updateData.offer = sdp;
        if (type === 'answer') updateData.answer = sdp;

        const call = await Call.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        );

        res.status(200).json(call);
    } catch (error) {
        console.error("Error saving signal data:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// @desc    Add ICE candidate
// @route   POST /api/calls/:id/ice
// @access  Private
const addIceCandidate = async (req, res) => {
    try {
        const { candidate } = req.body;
        const from = req.user.id;

        const call = await Call.findByIdAndUpdate(
            req.params.id,
            { $push: { iceCandidates: { candidate, from } } },
            { new: true }
        );

        res.status(200).json(call);
    } catch (error) {
        console.error("Error adding ICE candidate:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// @desc    Sync call state (polling)
// @route   GET /api/calls/:id/sync
// @access  Private
const syncCall = async (req, res) => {
    try {
        const call = await Call.findById(req.params.id);
        
        if (!call) {
            return res.status(404).json({ message: "Call not found" });
        }

        res.status(200).json(call);
    } catch (error) {
        console.error("Error syncing call:", error);
        res.status(500).json({ message: "Server error" });
    }
};

module.exports = {
    initiateCall,
    getIncomingCall,
    updateCallStatus,
    saveSignalData,
    addIceCandidate,
    syncCall
};
