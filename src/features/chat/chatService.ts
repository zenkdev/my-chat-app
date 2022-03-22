import { collection, doc, addDoc, setDoc, onSnapshot, getDoc, getDocs, deleteDoc } from 'firebase/firestore';

import { db } from '../../App';

const configuration = {
  iceServers: [
    {
      urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'],
    },
  ],
  iceCandidatePoolSize: 10,
};

let peerConnection: RTCPeerConnection | null = null;
let localStream: MediaStream | null = null;
let remoteStream: MediaStream | null = null;

export async function createRoom() {
  const roomRef = doc(collection(db, 'rooms'));

  console.log('Create PeerConnection with configuration: ', configuration);
  peerConnection = new RTCPeerConnection(configuration);

  registerPeerConnectionListeners();

  localStream?.getTracks().forEach(track => {
    peerConnection?.addTrack(track, localStream!);
  });

  // Code for collecting ICE candidates below
  const callerCandidatesCollection = collection(roomRef, 'callerCandidates');

  peerConnection.addEventListener('icecandidate', event => {
    if (!event.candidate) {
      console.log('Got final candidate!');
      return;
    }
    console.log('Got candidate: ', event.candidate);
    addDoc(callerCandidatesCollection, event.candidate.toJSON());
  });
  // Code for collecting ICE candidates above

  // Code for creating a room below
  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);
  console.log('Created offer:', offer);

  const roomWithOffer = {
    offer: {
      type: offer.type,
      sdp: offer.sdp,
    },
  };
  await setDoc(roomRef, roomWithOffer);
  console.log(`New room created with SDP offer. Room ID: ${roomRef.id}`);
  // Code for creating a room above

  peerConnection.addEventListener('track', event => {
    console.log('Got remote track:', event.streams[0]);
    event.streams[0].getTracks().forEach(track => {
      console.log('Add a track to the remoteStream:', track);
      remoteStream?.addTrack(track);
    });
  });

  // Listening for remote session description below
  onSnapshot(roomRef, async snapshot => {
    const data = snapshot.data();
    if (!peerConnection?.currentRemoteDescription && data && data.answer) {
      console.log('Got remote description: ', data.answer);
      const rtcSessionDescription = new RTCSessionDescription(data.answer);
      await peerConnection!.setRemoteDescription(rtcSessionDescription);
    }
  });
  // Listening for remote session description above

  // Listen for remote ICE candidates below
  onSnapshot(collection(roomRef, 'calleeCandidates'), snapshot => {
    snapshot.docChanges().forEach(async change => {
      if (change.type === 'added') {
        let data = change.doc.data();
        console.log(`Got new remote ICE candidate: ${JSON.stringify(data)}`);
        await peerConnection?.addIceCandidate(new RTCIceCandidate(data));
      }
    });
  });
  // Listen for remote ICE candidates above
  return roomRef.id;
}

export async function joinRoomById(roomId: string) {
  const roomRef = doc(collection(db, 'rooms'), `${roomId}`);
  const roomSnapshot = await getDoc(roomRef);
  console.log('Got room:', roomSnapshot.exists);

  if (roomSnapshot.exists()) {
    console.log('Create PeerConnection with configuration: ', configuration);
    peerConnection = new RTCPeerConnection(configuration);
    registerPeerConnectionListeners();
    localStream?.getTracks().forEach(track => {
      peerConnection!.addTrack(track, localStream!);
    });

    // Code for collecting ICE candidates below
    const calleeCandidatesCollection = collection(roomRef, 'calleeCandidates');
    peerConnection.addEventListener('icecandidate', event => {
      if (!event.candidate) {
        console.log('Got final candidate!');
        return;
      }
      console.log('Got candidate: ', event.candidate);
      addDoc(calleeCandidatesCollection, event.candidate.toJSON());
    });
    // Code for collecting ICE candidates above

    peerConnection.addEventListener('track', event => {
      console.log('Got remote track:', event.streams[0]);
      event.streams[0].getTracks().forEach(track => {
        console.log('Add a track to the remoteStream:', track);
        remoteStream?.addTrack(track);
      });
    });

    // Code for creating SDP answer below
    const offer = roomSnapshot.data()!.offer;
    console.log('Got offer:', offer);
    await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await peerConnection.createAnswer();
    console.log('Created answer:', answer);
    await peerConnection.setLocalDescription(answer);

    const roomWithAnswer = {
      answer: {
        type: answer.type,
        sdp: answer.sdp,
      },
    };
    await setDoc(roomRef, roomWithAnswer);
    // Code for creating SDP answer above

    // Listening for remote ICE candidates below
    onSnapshot(collection(roomRef, 'callerCandidates'), snapshot => {
      snapshot.docChanges().forEach(async change => {
        if (change.type === 'added') {
          let data = change.doc.data();
          console.log(`Got new remote ICE candidate: ${JSON.stringify(data)}`);
          await peerConnection?.addIceCandidate(new RTCIceCandidate(data));
        }
      });
    });
    // Listening for remote ICE candidates above
  }
}

export async function openUserMedia({ localVideo, removeVideo }: { localVideo: HTMLVideoElement; removeVideo: HTMLVideoElement }) {
  const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
  localVideo.srcObject = stream;
  localStream = stream;
  remoteStream = new MediaStream();
  removeVideo.srcObject = remoteStream;

  console.log('Stream:', localVideo.srcObject);
}

export async function hangUp({
  roomId,
  localVideo,
  removeVideo,
}: {
  roomId?: string;
  localVideo: HTMLVideoElement;
  removeVideo: HTMLVideoElement;
}) {
  const tracks = localStream?.getTracks();
  tracks?.forEach(track => {
    track.stop();
  });

  if (remoteStream) {
    remoteStream.getTracks().forEach(track => track.stop());
  }

  if (peerConnection) {
    peerConnection.close();
  }

  localVideo.srcObject = null;
  removeVideo.srcObject = null;

  // Delete room on hangup
  if (roomId) {
    const roomRef = doc(collection(db, 'rooms'), roomId);
    const calleeCandidates = await getDocs(collection(roomRef, 'calleeCandidates'));
    calleeCandidates.forEach(async candidate => {
      await deleteDoc(candidate.ref);
    });
    const callerCandidates = await getDocs(collection(roomRef, 'callerCandidates'));
    callerCandidates.forEach(async candidate => {
      await deleteDoc(candidate.ref);
    });
    await deleteDoc(roomRef);
  }
}

function registerPeerConnectionListeners() {
  if (!peerConnection) {
    return;
  }
  peerConnection.addEventListener('icegatheringstatechange', () => {
    console.log(`ICE gathering state changed: ${peerConnection?.iceGatheringState}`);
  });

  peerConnection.addEventListener('connectionstatechange', () => {
    console.log(`Connection state change: ${peerConnection?.connectionState}`);
  });

  peerConnection.addEventListener('signalingstatechange', () => {
    console.log(`Signaling state change: ${peerConnection?.signalingState}`);
  });

  peerConnection.addEventListener('iceconnectionstatechange ', () => {
    console.log(`ICE connection state change: ${peerConnection?.iceConnectionState}`);
  });
}
