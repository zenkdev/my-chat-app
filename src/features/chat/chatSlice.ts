import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { RootState } from '../../app/store';
import { createRoom, hangUp, joinRoomById, openUserMedia } from './chatService';

export interface ChatState {
  roomId?: string;
  currentRoom: string;
  cameraBtnDisabled: boolean;
  joinBtnDisabled: boolean;
  createBtnDisabled: boolean;
  hangupBtnDisabled: boolean;
  isModalVisible: boolean;
  cameraoff: boolean;
  micmuted: boolean;
  soundoff: boolean;
}

const initialState: ChatState = {
  currentRoom: '',
  cameraBtnDisabled: false,
  joinBtnDisabled: true,
  createBtnDisabled: true,
  hangupBtnDisabled: true,
  isModalVisible: false,
  micmuted: false,
  cameraoff: false,
  soundoff: false,
};

export const createRoomAsync = createAsyncThunk('chat/createRoom', async () => {
  const roomId = await createRoom();
  // The value we return becomes the `fulfilled` action payload
  return roomId;
});

export const joinRoomByIdAsync = createAsyncThunk('chat/joinRoomById', async (roomId: string) => {
  await joinRoomById(roomId);
  // The value we return becomes the `fulfilled` action payload
  return roomId;
});

export const openUserMediaAsync = createAsyncThunk(
  'chat/openUserMedia',
  async (payload: { localVideo: HTMLVideoElement; removeVideo: HTMLVideoElement }) => {
    await openUserMedia(payload);
  },
);

export const hangUpAsync = createAsyncThunk(
  'chat/hangUp',
  async (payload: { localVideo: HTMLVideoElement; removeVideo: HTMLVideoElement }, { getState }) => {
    const roomId = (getState() as RootState).chat.roomId;
    await hangUp({ roomId, ...payload });
  },
);

export const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    joinRoom: state => {
      state.cameraBtnDisabled = true;
      state.joinBtnDisabled = true;
      state.isModalVisible = true;
    },
    closeModal: state => {
      state.isModalVisible = false;
    },
    micMute: state => {
      state.micmuted = true;
    },
    micUnmute: state => {
      state.micmuted = false;
    },
    cameraOff: state => {
      state.cameraoff = true;
    },
    cameraOn: state => {
      state.cameraoff = false;
    },
    soundOff: state => {
      state.soundoff = true;
    },
    soundOn: state => {
      state.soundoff = false;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(createRoomAsync.pending, state => {
        state.isModalVisible = false;
        state.createBtnDisabled = true;
        state.joinBtnDisabled = true;
      })
      .addCase(createRoomAsync.fulfilled, (state, action) => {
        state.roomId = action.payload;
        state.currentRoom = `Current room is ${state.roomId} - You are the caller!`;
      })
      .addCase(joinRoomByIdAsync.pending, state => {
        state.isModalVisible = false;
      })
      .addCase(joinRoomByIdAsync.fulfilled, (state, action) => {
        state.roomId = action.payload;
        state.currentRoom = `Current room is ${state.roomId} - You are the callee!`;
      })
      .addCase(openUserMediaAsync.fulfilled, state => {
        state.cameraBtnDisabled = true;
        state.joinBtnDisabled = false;
        state.createBtnDisabled = false;
        state.hangupBtnDisabled = false;
      })
      .addCase(hangUpAsync.fulfilled, state => {
        state.currentRoom = '';
        state.cameraBtnDisabled = false;
        state.joinBtnDisabled = true;
        state.createBtnDisabled = true;
        state.hangupBtnDisabled = true;
      });
  },
});

export const { joinRoom, closeModal, micMute, micUnmute, cameraOff, cameraOn, soundOff, soundOn } = chatSlice.actions;

export default chatSlice.reducer;
