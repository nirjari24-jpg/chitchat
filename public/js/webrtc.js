// webrtc.js
// Handles WebRTC video and voice calls

let localStream;
let remoteStream;
let peerConnection;
let isCaller = false;
let currentCallUser = null;
let isVideoCall = true;

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

// Initialize Socket Listeners for WebRTC (wait a moment for socket to be ready)
setTimeout(() => {
    if (window.socket) {
        window.socket.on('callUser', async (data) => {
            // data = { signal, from, name, isVideo }
            if (activeCallOverlay.style.display === 'flex') {
                // Already in a call, reject automatically
                window.socket.emit('rejectCall', { to: data.from });
                return;
            }
            
            currentCallUser = data.from;
            isVideoCall = data.isVideo;
            incomingCallName.textContent = `Call from ${data.name}`;
            incomingCallType.textContent = isVideoCall ? 'Video Call' : 'Voice Call';
            incomingCallModal.style.display = 'flex';
        });

        window.socket.on('callAccepted', async () => {
            // Callee accepted, create Peer Connection and Offer
            createPeerConnection();
            
            try {
                const offer = await peerConnection.createOffer();
                await peerConnection.setLocalDescription(offer);
                window.socket.emit('webrtc_offer', { 
                    to: currentCallUser, 
                    sdp: peerConnection.localDescription,
                    from: getCurrentUser()._id,
                    isVideo: isVideoCall
                });
            } catch (err) {
                console.error("Error creating offer:", err);
            }
        });

        window.socket.on('callRejected', () => {
            alert('Call was declined.');
            cleanupCall();
        });

        window.socket.on('callEnded', () => {
            cleanupCall();
        });

        window.socket.on('webrtc_offer', async (data) => {
            // Receive offer from Caller
            if (!peerConnection) {
                createPeerConnection();
            }
            try {
                await peerConnection.setRemoteDescription(new RTCSessionDescription(data.sdp));
                const answer = await peerConnection.createAnswer();
                await peerConnection.setLocalDescription(answer);
                window.socket.emit('webrtc_answer', {
                    to: currentCallUser,
                    sdp: peerConnection.localDescription
                });
            } catch (err) {
                console.error("Error handling offer:", err);
            }
        });

        window.socket.on('webrtc_answer', async (data) => {
            try {
                await peerConnection.setRemoteDescription(new RTCSessionDescription(data.sdp));
            } catch (err) {
                console.error("Error handling answer:", err);
            }
        });

        window.socket.on('webrtc_ice_candidate', async (data) => {
            try {
                if (peerConnection) {
                    await peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
                }
            } catch (err) {
                console.error("Error adding ICE candidate:", err);
            }
        });
    }
}, 1000);

// Initialize Media
const initMedia = async (video = true) => {
    try {
        localStream = await navigator.mediaDevices.getUserMedia({ video, audio: true });
        localVideo.srcObject = localStream;
        if (!video) {
            // Hide local video element for voice calls
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
        // Hide remote video if voice call, or replace with avatar
        remoteVideo.style.opacity = '0'; // keep the element for audio
    } else {
        remoteVideo.style.opacity = '1';
    }

    // Add local tracks to peer connection
    localStream.getTracks().forEach((track) => {
        peerConnection.addTrack(track, localStream);
    });

    // Listen for remote tracks
    peerConnection.ontrack = (event) => {
        event.streams[0].getTracks().forEach((track) => {
            remoteStream.addTrack(track);
        });
    };

    // Listen for ICE candidates and send them
    peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
            window.socket.emit('webrtc_ice_candidate', {
                to: currentCallUser,
                candidate: event.candidate
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

    window.socket.emit('callUser', {
        userToCall: currentCallUser,
        from: currentUser._id,
        name: currentUser.name || currentUser.username,
        isVideo: video
    });
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
            window.socket.emit('rejectCall', { to: currentCallUser });
            cleanupCall();
            return;
        }

        window.socket.emit('answerCall', { to: currentCallUser });
    });
}

// Reject Call
if (rejectCallBtn) {
    rejectCallBtn.addEventListener('click', () => {
        incomingCallModal.style.display = 'none';
        window.socket.emit('rejectCall', { to: currentCallUser });
        cleanupCall();
    });
}

// End Call
const cleanupCall = () => {
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
    isCaller = false;
};

if (endCallBtn) {
    endCallBtn.addEventListener('click', () => {
        if (currentCallUser) {
            window.socket.emit('endCall', { to: currentCallUser });
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
