import { Button, Input, Modal, Space, Tooltip } from 'antd';
import {
  VideoCameraOutlined,
  TeamOutlined,
  UsergroupAddOutlined,
  CloseOutlined,
  AudioMutedOutlined,
  AudioOutlined,
  EyeInvisibleOutlined,
  EyeOutlined,
  SoundOutlined,
  StopOutlined,
} from '@ant-design/icons';
import React, { createRef, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import {
  cameraOff,
  cameraOn,
  closeModal,
  createRoomAsync,
  hangUpAsync,
  joinRoom,
  joinRoomByIdAsync,
  micMute,
  micUnmute,
  openUserMediaAsync,
  soundOff,
  soundOn,
} from './chatSlice';

export function Chat() {
  const localVideoRef = createRef<HTMLVideoElement>();
  const remoteVideoRef = createRef<HTMLVideoElement>();
  const roomIdRef = createRef<Input>();

  const dispatch = useAppDispatch();
  const {
    currentRoom,
    cameraBtnDisabled,
    joinBtnDisabled,
    createBtnDisabled,
    hangupBtnDisabled,
    isModalVisible,
    micmuted,
    cameraoff,
    soundoff,
  } = useAppSelector((state) => state.chat);

  const createBtnClick = () => {
    dispatch(createRoomAsync());
  };

  const joinBtnClick = () => {
    dispatch(joinRoom());
  };

  const cameraBtnClick = () => {
    dispatch(openUserMediaAsync({ localVideo: localVideoRef.current!, removeVideo: remoteVideoRef.current! }));
  };

  const hangupBtnClick = () => {
    dispatch(hangUpAsync({ localVideo: localVideoRef.current!, removeVideo: remoteVideoRef.current! }));
  };

  const handleOk = useCallback(async () => {
    const roomId = roomIdRef.current?.input.value;
    if (!roomId) {
      return;
    }
    console.log('Join room: ', roomId);
    dispatch(joinRoomByIdAsync(roomId));
  }, [roomIdRef, dispatch]);

  const handleCancel = () => {
    dispatch(closeModal());
  };

  const micmuteClick = () => {
    if (micmuted) {
      dispatch(micUnmute());
    } else {
      dispatch(micMute());
    }
  };

  const cameraoffClick = () => {
    dispatch(cameraoff ? cameraOn() : cameraOff());
  };
  const soundoffClick = () => {
    dispatch(soundoff ? soundOn() : soundOff());
  };

  return (
    <div>
      <div id='buttons'>
        <Space>
          <Button id='cameraBtn' icon={<VideoCameraOutlined />} onClick={cameraBtnClick} disabled={cameraBtnDisabled}>
            Open camera & microphone
          </Button>
          <Button id='createBtn' icon={<UsergroupAddOutlined />} onClick={createBtnClick} disabled={joinBtnDisabled}>
            Create room
          </Button>
          <Button id='joinBtn' icon={<TeamOutlined />} onClick={joinBtnClick} disabled={createBtnDisabled}>
            Join room
          </Button>
          <Button id='hangupBtn' icon={<CloseOutlined />} onClick={hangupBtnClick} disabled={hangupBtnDisabled}>
            Hangup
          </Button>
        </Space>
      </div>
      <div>
        <span id='currentRoom'>{currentRoom}</span>
      </div>
      <div id='videos'>
        <video id='localVideo' ref={localVideoRef} muted autoPlay playsInline></video>
        <div>
          <Space>
            <Tooltip title={micmuted ? 'Unmute mic' : 'Mute mic'}>
              <Button
                id='micmute'
                shape='circle'
                icon={micmuted ? <AudioOutlined /> : <AudioMutedOutlined />}
                onClick={micmuteClick}
              />
            </Tooltip>
            <Tooltip title={cameraoff ? 'Camera On' : 'Camera Off'}>
              <Button
                id='cameraoff'
                shape='circle'
                icon={cameraoff ? <EyeOutlined /> : <EyeInvisibleOutlined />}
                onClick={cameraoffClick}
              />
            </Tooltip>
            <Tooltip title={soundoff ? 'Sound On' : 'Sound Off'}>
              <Button
                id='soundoff'
                shape='circle'
                icon={soundoff ? <SoundOutlined /> : <StopOutlined />}
                onClick={soundoffClick}
              />
            </Tooltip>
          </Space>
        </div>
        <video id='remoteVideo' ref={remoteVideoRef} autoPlay playsInline></video>
      </div>
      <Modal visible={isModalVisible} okText='Join' title='Join room' onOk={handleOk} onCancel={handleCancel}>
        Enter ID for room to join:
        <Input placeholder='Room ID' ref={roomIdRef} />
      </Modal>
    </div>
  );
}
