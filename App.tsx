import React, { useState, useRef } from 'react';
import { SnapshotViewIOSBase, StyleSheet, Text, View } from 'react-native';
import Button from './components/Button';
import GettingCall from './components/GettingCall';
import Video from './components/Video';
import { EventOnAddStream, MediaStream, RTCPeerConnection, RTCIceCandidate } from 'react-native-webrtc'
import Utils from './Utils';
import firestore, { FirebaseFirestoreTypes } from '@react-native-firebase/firestore'

const configuration = {"iceServers": [{"url": "stun:stun.l.google.com:19302"}]};

export default function App() {

  const [localStream, setLocalStream] = useState<MediaStream | null>()
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>()
  const [gettingCall, setGettingCall] = useState(false)
  const pc = useRef<RTCPeerConnection>()
  const connecting = useRef(false)
  
  const setupWebrtc = async () => {
    pc.current = new RTCPeerConnection(configuration)

    const stream = await Utils.getStream()
    if(stream){
      setLocalStream(stream)
      pc.current.addStream(stream)
    }

    pc.current.onaddStream = (event: EventOnAddStream) => {
      setRemoteStream(event.stream)
    }
  };
  const create = async () => {
    console.log('calling');
    connecting.current = true
    
    await setupWebrtc()

    //tut database(nuzno izmenit')
    const cRef = firestore().collection('meet').doc('chatId')

    //exchanghe ice between caller and callee
    collectIceCandidates(cRef, 'caller', 'callee')

    if (pc.current) {
      //create the offer for call
      const offer = await pc.current.createOffer();
      pc.current.setLocalDescription(offer);

      const cWithOffer ={
        offer:{
          type: offer.type,
          sdp: offer.sdp 
        }
      };
      
      cRef.set(cWithOffer)
    }
  };
  const join = async () => {};
  const hangup = async () => {};

  const collectIceCandidates = async (
    cRef: FirebaseFirestoreTypes.DocumentReference<FirebaseFirestoreTypes.DocumentData>,
    localName: string,
    remoteName: string
  ) => {
    const candidateCollection = cRef.collection(localName);

    if(pc.current){
      //new ice? add to fs
      pc.current.onicecandidate = (event) => {
        if (event.candidate) {
          candidateCollection.add(event.candidate)
        }
      }
    }

    cRef.collection(remoteName).onSnapshot(snapshot =>{
      snapshot.docChanges().forEach((change: any) =>{
        if(change.type == 'added'){
          const candidate = new RTCIceCandidate(change.doc.data())
          pc.current?.addIceCandidate(candidate)
        }
      })
    })
  };

  if(gettingCall){
    return <GettingCall hangup={hangup} join={join} />
  }

  if(localStream){
    return <Video hangup={hangup} localStream={localStream} remoteStream={remoteStream}/>
  }

  return (
    <View style={styles.container}>
      <Button iconName="video" backgroundColor="gray" onPress={create}/>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
