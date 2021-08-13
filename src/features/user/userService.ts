const users = [
  { username: 'Admin', password: 'Password1' },
  { username: 'User1', password: 'Password1' },
  { username: 'User2', password: 'Password1' },
];

// A mock function to mimic making an async request for data
export function loginAsync(payload: { username: string; password: string }) {
  return new Promise<{ username: string }>((resolve, reject) =>
    setTimeout(() => {
      const user = users.find(u => u.username === payload.username && u.password === payload.password);
      if (user) {
        resolve({ username: user.username });
      } else {
        reject(new Error('Invalid user name or password'));
      }
    }, 500),
  );
}
