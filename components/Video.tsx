import React from 'react';
import { StyleSheet, View } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5'
import { MediaStream, RTCView } from 'react-native-webrtc'
import Button from './Button'

interface Props {
    hanup: () => void;
    localStream?: MediaStream | null;
    remoteStream?: MediaStream | null;
}

function ButtonContainer(props: Props){
    return <View style={styles.bContainer}>
        <Button
            iconName='phone'
            backgroundColor='red'
            onPress={props.hanup}
        />
    </View>
}

export default function Video(props: Props) {

    if(props.localStream && !props.remoteStream){
        return <View style={styles.container}>
            <RTCView 
                streamURl={props.localStream.toURL()} 
                objectFir={'cover'}
                style={styles.video}/>
            <ButtonContainer hanup={props.hanup}/>
        </View>
    }
    if(props.localStream && props.remoteStream){
        return <View style={styles.container}>
            <RTCView 
                streamURl={props.localStream.toURL()} 
                objectFir={'cover'}
                style={styles.video}/>
            <RTCView 
                streamURl={props.localStream.toURL()} 
                objectFir={'cover'}
                style={styles.videoLocal}/>
            <ButtonContainer hanup={props.hanup}/>
        </View>
    }

  return <ButtonContainer hanup={props.hanup}/>
}

const styles = StyleSheet.create({
  bContainer: {
      flexDirection: 'row',
      bottom: 30
  },
  container: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center'
  },
  video: {
      position: 'absolute',
      height: '100%',
      width: '100%'
  },
  videoLocal: {
    position: 'absolute',
    height: 150,
    width: 100,
    top: 0,
    left: 20,
    elevation: 10
}
});