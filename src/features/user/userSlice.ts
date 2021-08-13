import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { RootState } from '../../app/store';
import { loginAsync } from './userService';

export interface UserState {
  isLoggedIn: boolean;
  username?: string;
  loginStatus: 'idle' | 'pending' | 'failed';
}

const initialState: UserState = {
  // isLoggedIn: false,
  isLoggedIn: true,
  username: 'Admin',
  loginStatus: 'idle',
};

export const login = createAsyncThunk(
  'user/login',
  async (payload: { username: string; password: string }, { rejectWithValue }) => {
    try {
      const response = await loginAsync(payload);
      // The value we return becomes the `fulfilled` action payload
      return response;
    } catch (e) {
      return rejectWithValue(e.message);
    }
  },
);

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    logout: (state) => {
      state.isLoggedIn = false;
      state.username = undefined;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.isLoggedIn = false;
        state.username = undefined;
        state.loginStatus = 'pending';
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loginStatus = 'idle';
        state.isLoggedIn = true;
        state.username = action.payload.username;
      })
      .addCase(login.rejected, (state, action) => {
        state.loginStatus = 'failed';
      });
  },
});

export const selectIsLoggedIn = (state: RootState) => state.user.isLoggedIn;
export const selectUsername = (state: RootState) => state.user.username;

export const { logout } = userSlice.actions;

export default userSlice.reducer;
