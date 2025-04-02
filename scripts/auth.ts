import { getAuth, signInAnonymously } from 'firebase/auth';
import { app } from './firebase';

const auth = getAuth(app);

signInAnonymously(auth)
  .then((userCredential) => {
    console.log('User signed in anonymously:', userCredential.user.uid);
  })
  .catch((error) => {
    console.error('Error signing in anonymously:', error);
  });

export { auth }; // ✅ don't re-export `app` here
