import React, { useState, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Button from './components/Button';
import GettingCall from './components/GettingCall';
import Video from './components/Video';
import { EventOnAddStream, MediaStream, RTCPeerConnection } from 'react-native-webrtc'
import Utils from './Utils';

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

    // const cRef
  };
  const join = async () => {};
  const hangup = async () => {};

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
