// WebRTC Logic for Video and Voice Calls
let peerConnection;
let localStream;
let remoteStream;
let currentCallType = 'audio'; // 'audio' or 'video'
let isCaller = false;

// Google's public STUN servers
const configuration = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
    ]
};

// UI Elements
const incomingCallModal = document.getElementById('incomingCallModal');
const activeCallModal = document.getElementById('activeCallModal');
const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');
const acceptCallBtn = document.getElementById('acceptCallBtn');
const rejectCallBtn = document.getElementById('rejectCallBtn');
const endCallBtn = document.getElementById('endCallBtn');
const toggleAudioBtn = document.getElementById('toggleAudioBtn');
const toggleVideoBtn = document.getElementById('toggleVideoBtn');

let incomingCallData = null;

// Initialize Peer Connection
function createPeerConnection() {
    peerConnection = new RTCPeerConnection(configuration);

    peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
            socket.emit('ice-candidate', {
                to: selectedUserId,
                candidate: event.candidate
            });
        }
    };

    peerConnection.ontrack = (event) => {
        if (!remoteStream) {
            remoteStream = new MediaStream();
            remoteVideo.srcObject = remoteStream;
        }
        remoteStream.addTrack(event.track);
    };

    if (localStream) {
        localStream.getTracks().forEach(track => {
            peerConnection.addTrack(track, localStream);
        });
    }
}

// Request media permissions
async function getMedia(video = true) {
    try {
        localStream = await navigator.mediaDevices.getUserMedia({ video: video, audio: true });
        localVideo.srcObject = localStream;
        
        // Disable video toggle if it's an audio only call
        if (!video) {
            toggleVideoBtn.style.opacity = "0.5";
            toggleVideoBtn.disabled = true;
        } else {
            toggleVideoBtn.style.opacity = "1";
            toggleVideoBtn.disabled = false;
        }
        return true;
    } catch (err) {
        console.error("Error accessing media devices.", err);
        alert("Could not access camera/microphone. Please ensure permissions are granted.");
        return false;
    }
}

// Stop all media tracks
function stopMedia() {
    if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
        localStream = null;
    }
    if (remoteStream) {
        remoteStream.getTracks().forEach(track => track.stop());
        remoteStream = null;
    }
}

// Start a call
async function startCall(isVideo) {
    if (!selectedUserId) {
        alert("Select a user to call first!");
        return;
    }
    
    isCaller = true;
    currentCallType = isVideo ? 'video' : 'audio';
    
    const mediaGranted = await getMedia(isVideo);
    if (!mediaGranted) return;

    activeCallModal.style.display = 'flex';
    createPeerConnection();

    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);

    const currentUser = JSON.parse(localStorage.getItem('user'));
    
    socket.emit('call-user', {
        to: selectedUserId,
        offer: offer,
        callerId: currentUser._id,
        callerName: currentUser.name || currentUser.username,
        isVideo: isVideo
    });
}

// End or Reject call logic
function endCall() {
    if (peerConnection) {
        peerConnection.close();
        peerConnection = null;
    }
    stopMedia();
    activeCallModal.style.display = 'none';
    incomingCallModal.style.display = 'none';
    incomingCallData = null;
}

// --- Socket Listeners for WebRTC ---

socket.on('call-made', async (data) => {
    // data: offer, callerId, callerName, isVideo
    incomingCallData = data;
    document.getElementById('incomingCallerName').textContent = `${data.callerName} is calling you for a ${data.isVideo ? 'Video' : 'Voice'} Call`;
    incomingCallModal.style.display = 'flex';
});

socket.on('answer-made', async (data) => {
    if (peerConnection) {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
    }
});

socket.on('ice-candidate', async (candidate) => {
    if (peerConnection) {
        try {
            await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
            console.error('Error adding received ice candidate', e);
        }
    }
});

socket.on('call-rejected', () => {
    alert("Call was rejected.");
    endCall();
});

socket.on('call-ended', () => {
    endCall();
});

// --- UI Event Listeners ---

acceptCallBtn.addEventListener('click', async () => {
    if (!incomingCallData) return;
    
    incomingCallModal.style.display = 'none';
    activeCallModal.style.display = 'flex';
    
    const mediaGranted = await getMedia(incomingCallData.isVideo);
    if (!mediaGranted) {
        socket.emit('reject-call', { to: incomingCallData.callerId });
        endCall();
        return;
    }

    // Since we are receiving the call, the person calling us is our selectedUserId for this session
    if (selectedUserId !== incomingCallData.callerId) {
        selectedUserId = incomingCallData.callerId;
    }

    createPeerConnection();
    await peerConnection.setRemoteDescription(new RTCSessionDescription(incomingCallData.offer));
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);

    socket.emit('make-answer', {
        to: incomingCallData.callerId,
        answer: answer
    });
});

rejectCallBtn.addEventListener('click', () => {
    if (incomingCallData) {
        socket.emit('reject-call', { to: incomingCallData.callerId });
    }
    incomingCallModal.style.display = 'none';
    incomingCallData = null;
});

endCallBtn.addEventListener('click', () => {
    if (selectedUserId || (incomingCallData && incomingCallData.callerId)) {
        const target = selectedUserId || incomingCallData.callerId;
        socket.emit('end-call', { to: target });
    }
    endCall();
});

toggleAudioBtn.addEventListener('click', () => {
    if (localStream) {
        const audioTrack = localStream.getAudioTracks()[0];
        if (audioTrack) {
            audioTrack.enabled = !audioTrack.enabled;
            toggleAudioBtn.textContent = audioTrack.enabled ? '🎤' : '🔇';
            toggleAudioBtn.style.backgroundColor = audioTrack.enabled ? '' : '#dc3545';
        }
    }
});

toggleVideoBtn.addEventListener('click', () => {
    if (localStream && !toggleVideoBtn.disabled) {
        const videoTrack = localStream.getVideoTracks()[0];
        if (videoTrack) {
            videoTrack.enabled = !videoTrack.enabled;
            toggleVideoBtn.textContent = videoTrack.enabled ? '📹' : '📵';
            toggleVideoBtn.style.backgroundColor = videoTrack.enabled ? '' : '#dc3545';
        }
    }
});

// Call initiation buttons (from dashboard.html chat header)
const voiceCallBtn = document.getElementById('voiceCallBtn');
const videoCallBtn = document.getElementById('videoCallBtn');

if (voiceCallBtn) {
    voiceCallBtn.addEventListener('click', () => startCall(false));
}

if (videoCallBtn) {
    videoCallBtn.addEventListener('click', () => startCall(true));
}
