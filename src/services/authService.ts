import { signInWithEmailAndPassword, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { User } from '../types/user';

export const authService = {
  async login(email: string, password: string): Promise<{ success: boolean; user?: FirebaseUser; error?: string }> {
    try {
      console.log('AuthService login attempt for:', email);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log('Firebase auth successful:', userCredential.user.uid);
      
      // Check if user is an investor
      const userProfile = await this.getUserProfile(userCredential.user.uid);
      console.log('Retrieved user profile:', userProfile);
      
      if (!userProfile || userProfile.role !== 'investor') {
        console.error('Access denied - not an investor:', userProfile?.role);
        throw new Error('Access denied. This portal is for investors only.');
      }

      return { success: true, user: userCredential.user };
    } catch (error: any) {
      console.error('Login error in authService:', error);
      return { success: false, error: error.message };
    }
  },

  async getUserProfile(uid: string): Promise<User | null> {
    try {
      console.log('Getting user profile for UID:', uid);
      const userDoc = await getDoc(doc(db, 'users', uid));
      console.log('User document exists:', userDoc.exists());
      if (userDoc.exists()) {
        const userData = userDoc.data();
        console.log('User data from Firestore:', userData);
        return {
          id: uid,
          ...userData,
          createdAt: userData.createdAt?.toDate() || new Date(),
          updatedAt: userData.updatedAt?.toDate() || new Date(),
        } as User;
      }
      console.log('No user document found');
      return null;
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      return null;
    }
  },
};