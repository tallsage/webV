import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
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

  useEffect(() =>{
    const cRef = firestore().collection('meet').doc('chatId')

    const subscribe = cRef.onSnapshot(snapshot =>{
      const data = snapshot.data()

      if(pc.current && !pc.current.remoteDescription && data && data.answer){
        pc.current.setRemoteDescription(new RTCSessionDescription(data.answer))
      }

      if(data && data.offer && !connecting.current){
        setGettingCall(true)
      }
    });

    const subscribeDelete = cRef.collection('callee').onSnapshot(snapshot =>{
      snapshot.docChanges().forEach(chgange => {
        if(chgange.type == 'removed'){
          hangup()
        }
      });
    })

    return () =>{
      subscribe()
      subscribeDelete()
    }
  },[])
  
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
  const join = async () => {
    console.log('joining the call');
    connecting.current = true;
    setGettingCall(false)

    const cRef = firestore().collection('meet').doc('chatId')
    const offer = (await cRef.get()).data()?.offer;
    
    if(offer){
      await setupWebrtc();

      collectIceCandidates(cRef, 'callee', 'celler')

      if(pc.current){
        pc.current.setRemoteDescription(new RTCSessionDescription(offer))

        const answer = await pc.current.createAnswer();
        pc.current.setLocalDescription(answer)
        const cWithAnswer = {
          answer: {
            type: answer.type,
            sdp: answer.sdp
          }
        }
        cRef.update(cWithAnswer)
      }
    }
  };
  const hangup = async () => {
    setGettingCall(false)
    connecting.current = false
    streamCleanUp()
    firestoreCleanUp()
    if(pc.current){
      pc.current.close()
    }
  };

  const streamCleanUp = async () => {
    if (localStream) {
      localStream.getTracks().forEach(t => t.stop());
      localStream.release()
    }
    setLocalStream(null)
    setRemoteStream(null)
  };
  const firestoreCleanUp = async () => {
    const cRef = firestore().collection('meet').doc('chatId')

    if(cRef){
      const calleeCandidate = await cRef.collection('callee').get()
      calleeCandidate.forEach( async (candidate) =>{
        await candidate.ref.delete()
      })
      const callerCandidate = await cRef.collection('caller').get()
      callerCandidate.forEach( async (candidate) =>{
        await candidate.ref.delete()
      })

      cRef.delete()
    }
  };

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
