const mongoose = require('mongoose');

const callSchema = new mongoose.Schema({
    callerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    receiverId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    status: {
        type: String,
        enum: ['ringing', 'accepted', 'rejected', 'ended'],
        default: 'ringing'
    },
    isVideo: {
        type: Boolean,
        default: true
    },
    callerName: {
        type: String
    },
    offer: {
        type: mongoose.Schema.Types.Mixed
    },
    answer: {
        type: mongoose.Schema.Types.Mixed
    },
    iceCandidates: [{
        candidate: mongoose.Schema.Types.Mixed,
        from: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    }],
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 3600 // Auto delete after 1 hour
    }
});

module.exports = mongoose.model('Call', callSchema);
