// webrtc.js
// Handles WebRTC video and voice calls via MongoDB polling

let localStream;
let remoteStream;
let peerConnection;
let isCaller = false;
let currentCallUser = null;
let currentCallId = null;
let isVideoCall = true;

// Polling intervals
let incomingCallInterval = null;
let syncInterval = null;

// Track processed ICE candidates to avoid duplicate additions
let processedIceCandidatesCount = 0;
// Track if we have already handled offer/answer to avoid duplicate processing
let hasProcessedOffer = false;
let hasProcessedAnswer = false;

const servers = {
    iceServers: [
        { urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'] }
    ]
};

// UI Elements
const videoCallBtn = document.getElementById('videoCallBtn');
const voiceCallBtn = document.getElementById('voiceCallBtn');
const incomingCallModal = document.getElementById('incomingCallModal');
const activeCallOverlay = document.getElementById('activeCallOverlay');
const incomingCallName = document.getElementById('incomingCallName');
const incomingCallType = document.getElementById('incomingCallType');
const acceptCallBtn = document.getElementById('acceptCallBtn');
const rejectCallBtn = document.getElementById('rejectCallBtn');
const endCallBtn = document.getElementById('endCallBtn');
const toggleVideoBtn = document.getElementById('toggleVideoBtn');
const toggleAudioBtn = document.getElementById('toggleAudioBtn');
const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');

// Get current user from localStorage
const getCurrentUser = () => JSON.parse(localStorage.getItem('user'));

// Start polling for incoming calls
const startIncomingCallPolling = () => {
    if (incomingCallInterval) clearInterval(incomingCallInterval);
    incomingCallInterval = setInterval(async () => {
        // Don't poll if we are already in a call
        if (currentCallId || activeCallOverlay.style.display === 'flex' || incomingCallModal.style.display === 'flex') {
            return;
        }

        try {
            const res = await fetch('/api/calls/incoming');
            if (res.ok) {
                const call = await res.json();
                if (call && call._id) {
                    currentCallId = call._id;
                    currentCallUser = call.callerId;
                    isVideoCall = call.isVideo;
                    
                    incomingCallName.textContent = `Call from ${call.callerName || 'Unknown'}`;
                    incomingCallType.textContent = isVideoCall ? 'Video Call' : 'Voice Call';
                    incomingCallModal.style.display = 'flex';
                }
            }
        } catch (error) {
            console.error("Error polling incoming calls:", error);
        }
    }, 3000); // Check every 3 seconds
};

// Start the incoming polling immediately
startIncomingCallPolling();

const startSyncPolling = () => {
    if (syncInterval) clearInterval(syncInterval);
    syncInterval = setInterval(async () => {
        if (!currentCallId) return;

        try {
            const res = await fetch(`/api/calls/${currentCallId}/sync`);
            if (res.ok) {
                const call = await res.json();
                
                // If the call was rejected or ended
                if (call.status === 'rejected') {
                    if (isCaller) alert('Call was declined.');
                    cleanupCall();
                    return;
                }
                if (call.status === 'ended') {
                    cleanupCall();
                    return;
                }

                // If Caller sees call is accepted, create and send offer
                if (isCaller && call.status === 'accepted' && !hasProcessedOffer) {
                    hasProcessedOffer = true;
                    createPeerConnection();
                    const offer = await peerConnection.createOffer();
                    await peerConnection.setLocalDescription(offer);
                    
                    await fetch(`/api/calls/${currentCallId}/signal`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ type: 'offer', sdp: peerConnection.localDescription })
                    });
                }

                // If Callee sees an offer, set it, create and send answer
                if (!isCaller && call.offer && !hasProcessedOffer) {
                    hasProcessedOffer = true;
                    if (!peerConnection) createPeerConnection();
                    
                    await peerConnection.setRemoteDescription(new RTCSessionDescription(call.offer));
                    const answer = await peerConnection.createAnswer();
                    await peerConnection.setLocalDescription(answer);
                    
                    await fetch(`/api/calls/${currentCallId}/signal`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ type: 'answer', sdp: peerConnection.localDescription })
                    });
                }

                // If Caller sees an answer, set it
                if (isCaller && call.answer && !hasProcessedAnswer) {
                    hasProcessedAnswer = true;
                    await peerConnection.setRemoteDescription(new RTCSessionDescription(call.answer));
                }

                // Process new ICE candidates
                if (call.iceCandidates && call.iceCandidates.length > processedIceCandidatesCount) {
                    const currentUser = getCurrentUser();
                    for (let i = processedIceCandidatesCount; i < call.iceCandidates.length; i++) {
                        const candidateData = call.iceCandidates[i];
                        // Only add candidates from the OTHER person
                        if (candidateData.from !== currentUser._id) {
                            if (peerConnection) {
                                await peerConnection.addIceCandidate(new RTCIceCandidate(candidateData.candidate));
                            }
                        }
                    }
                    processedIceCandidatesCount = call.iceCandidates.length;
                }
            }
        } catch (error) {
            console.error("Error syncing call:", error);
        }
    }, 2000); // Check every 2 seconds for signals
};

// Initialize Media
const initMedia = async (video = true) => {
    try {
        localStream = await navigator.mediaDevices.getUserMedia({ video, audio: true });
        localVideo.srcObject = localStream;
        if (!video) {
            localVideo.style.display = 'none';
        } else {
            localVideo.style.display = 'block';
        }
        return true;
    } catch (err) {
        console.error('Error accessing media devices.', err);
        alert('Could not access Camera/Microphone.');
        return false;
    }
};

// Create Peer Connection
const createPeerConnection = () => {
    peerConnection = new RTCPeerConnection(servers);

    remoteStream = new MediaStream();
    remoteVideo.srcObject = remoteStream;
    if (!isVideoCall) {
        remoteVideo.style.opacity = '0';
    } else {
        remoteVideo.style.opacity = '1';
    }

    localStream.getTracks().forEach((track) => {
        peerConnection.addTrack(track, localStream);
    });

    peerConnection.ontrack = (event) => {
        event.streams[0].getTracks().forEach((track) => {
            remoteStream.addTrack(track);
        });
    };

    peerConnection.onicecandidate = async (event) => {
        if (event.candidate && currentCallId) {
            await fetch(`/api/calls/${currentCallId}/ice`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ candidate: event.candidate })
            });
        }
    };
};

// Start a Call
const startCall = async (video) => {
    if (typeof selectedUserId === 'undefined' || !selectedUserId) {
        alert('Please select a user to call.');
        return;
    }
    const currentUser = getCurrentUser();
    currentCallUser = selectedUserId;
    isCaller = true;
    isVideoCall = video;

    const mediaSuccess = await initMedia(video);
    if (!mediaSuccess) return;

    activeCallOverlay.style.display = 'flex';

    // Initiate call on server
    try {
        const res = await fetch('/api/calls/start', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                receiverId: currentCallUser,
                isVideo: video,
                callerName: currentUser.name || currentUser.username
            })
        });
        
        if (res.ok) {
            const call = await res.json();
            currentCallId = call._id;
            startSyncPolling();
        } else {
            alert('Failed to initiate call.');
            cleanupCall();
        }
    } catch (error) {
        console.error("Error starting call:", error);
        cleanupCall();
    }
};

// Event Listeners for Call Buttons
if (videoCallBtn) {
    videoCallBtn.addEventListener('click', () => startCall(true));
}
if (voiceCallBtn) {
    voiceCallBtn.addEventListener('click', () => startCall(false));
}

// Answer Call
if (acceptCallBtn) {
    acceptCallBtn.addEventListener('click', async () => {
        incomingCallModal.style.display = 'none';
        activeCallOverlay.style.display = 'flex';
        
        const mediaSuccess = await initMedia(isVideoCall);
        if (!mediaSuccess) {
            await fetch(`/api/calls/${currentCallId}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'rejected' })
            });
            cleanupCall();
            return;
        }

        // Accept the call
        await fetch(`/api/calls/${currentCallId}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'accepted' })
        });
        
        startSyncPolling();
    });
}

// Reject Call
if (rejectCallBtn) {
    rejectCallBtn.addEventListener('click', async () => {
        incomingCallModal.style.display = 'none';
        if (currentCallId) {
            await fetch(`/api/calls/${currentCallId}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'rejected' })
            });
        }
        cleanupCall();
    });
}

// End Call
const cleanupCall = () => {
    if (syncInterval) {
        clearInterval(syncInterval);
        syncInterval = null;
    }
    if (peerConnection) {
        peerConnection.close();
        peerConnection = null;
    }
    if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
        localStream = null;
    }
    activeCallOverlay.style.display = 'none';
    incomingCallModal.style.display = 'none';
    currentCallUser = null;
    currentCallId = null;
    isCaller = false;
    processedIceCandidatesCount = 0;
    hasProcessedOffer = false;
    hasProcessedAnswer = false;
};

if (endCallBtn) {
    endCallBtn.addEventListener('click', async () => {
        if (currentCallId) {
            await fetch(`/api/calls/${currentCallId}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'ended' })
            });
        }
        cleanupCall();
    });
}

// Toggle Audio/Video
if (toggleAudioBtn) {
    toggleAudioBtn.addEventListener('click', () => {
        if (localStream) {
            const audioTrack = localStream.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                toggleAudioBtn.style.backgroundColor = audioTrack.enabled ? 'rgba(255, 255, 255, 0.2)' : 'var(--primary-red)';
            }
        }
    });
}

if (toggleVideoBtn) {
    toggleVideoBtn.addEventListener('click', () => {
        if (localStream) {
            const videoTrack = localStream.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled;
                toggleVideoBtn.style.backgroundColor = videoTrack.enabled ? 'rgba(255, 255, 255, 0.2)' : 'var(--primary-red)';
            }
        }
    });
}
