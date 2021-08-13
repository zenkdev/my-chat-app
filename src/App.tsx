import React from 'react';
import './App.css';
import { UserInfo } from './features/user/UserInfo';
import { useAppSelector } from './app/hooks';
import { selectIsLoggedIn } from './features/user/userSlice';
import { Login } from './features/user/Login';
import { Chat } from './features/chat/Chat';
import { Layout } from 'antd';

import firebase from 'firebase/app';
import 'firebase/auth';
import 'firebase/firestore';

firebase.initializeApp({
  apiKey: 'AIzaSyDce3bHLUZgiC1x1pbncat4_nerKKCOCDA',
  authDomain: 'fir-rtc-8e7eb.firebaseapp.com',
  projectId: 'fir-rtc-8e7eb',
  storageBucket: 'fir-rtc-8e7eb.appspot.com',
  messagingSenderId: '523471811445',
  appId: '1:523471811445:web:768d2a6e045ac859fd593c',
});

function App() {
  const isLoggedIn = useAppSelector(selectIsLoggedIn);
  return (
    <div>
      <Layout>
        <Layout.Header>{isLoggedIn && <UserInfo />}</Layout.Header>
        <Layout.Content className="App-content">{isLoggedIn ? <Chat /> : <Login />}</Layout.Content>
        <Layout.Footer>Footer</Layout.Footer>
      </Layout>
    </div>
  );
}

export default App;
