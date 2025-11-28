import { 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { auth, googleProvider } from '../config/firebase';

export const authService = {
  loginWithGoogle: async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      if (!user.email.endsWith('@colegiomariano.cl')) {
        await signOut(auth);
        throw new Error('Debes usar una cuenta @colegiomariano.cl');
      }
      
      return {
        uid: user.uid,
        email: user.email,
        name: user.displayName,
        photoURL: user.photoURL
      };
    } catch (error) {
      throw error;
    }
  },

  logout: async () => {
    await signOut(auth);
  },

  onAuthChange: (callback) => {
    return onAuthStateChanged(auth, (user) => {
      if (user && user.email.endsWith('@colegiomariano.cl')) {
        callback({
          uid: user.uid,
          email: user.email,
          name: user.displayName,
          photoURL: user.photoURL
        });
      } else {
        callback(null);
      }
    });
  },

  getCurrentUser: () => {
    const user = auth.currentUser;
    if (user && user.email.endsWith('@colegiomariano.cl')) {
      return {
        uid: user.uid,
        email: user.email,
        name: user.displayName,
        photoURL: user.photoURL
      };
    }
    return null;
  }
};