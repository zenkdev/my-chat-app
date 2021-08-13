import { Button, Space } from 'antd';
import React from 'react';

import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { logout, selectUsername } from './userSlice';

import styles from './User.module.css';

export function UserInfo() {
  const username = useAppSelector(selectUsername);
  const dispatch = useAppDispatch();
  const onLogout = () => {
    dispatch(logout());
  };
  return (
    <Space>
      <span className={styles.username}>{username}</span>
      <Button onClick={onLogout}>Log out</Button>
    </Space>
  );
}
