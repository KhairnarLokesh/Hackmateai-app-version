import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  teamId: string | null;
  profileCompleted: boolean;
  userProfile: UserProfile | null;
  refreshTeamId: () => Promise<void>;
}

interface UserProfile {
  displayName: string | null;
  email: string | null;
  skills: string | null;
  githubUsername: string | null;
  profileCompleted: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  teamId: null,
  profileCompleted: false,
  userProfile: null,
  refreshTeamId: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [teamId, setTeamId] = useState<string | null>(null);
  const [profileCompleted, setProfileCompleted] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  const fetchTeamId = async (uid: string, isAnonymous: boolean) => {
    // Anonymous users skip profile/team setup — they go straight to tabs as guests
    if (isAnonymous) {
      setTeamId(null);
      setProfileCompleted(true); // Treat as completed so we skip those screens
      setUserProfile({
        displayName: 'Guest',
        email: null,
        skills: null,
        githubUsername: null,
        profileCompleted: true,
      });
      return;
    }

    try {
      const userDocRef = doc(db, 'users', uid);
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
        const data = userDoc.data();
        setTeamId(data.teamId || null);
        setProfileCompleted(data.profileCompleted || false);
        setUserProfile({
          displayName: data.displayName || null,
          email: data.email || null,
          skills: data.skills || null,
          githubUsername: data.githubUsername || null,
          profileCompleted: data.profileCompleted || false,
        });
      } else {
        setTeamId(null);
        setProfileCompleted(false);
        setUserProfile(null);
      }
    } catch (error: any) {
      console.error('Error fetching team ID:', error);
      if (error.code === 'unavailable' || error.message?.includes('offline')) {
        console.log('📴 Offline mode - using cached data');
      }
      setTeamId(null);
      setProfileCompleted(false);
      setUserProfile(null);
    }
  };

  const refreshTeamId = async () => {
    if (user) {
      await fetchTeamId(user.uid, user.isAnonymous);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await fetchTeamId(currentUser.uid, currentUser.isAnonymous);
      } else {
        setTeamId(null);
        setProfileCompleted(false);
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, teamId, profileCompleted, userProfile, refreshTeamId }}>
      {children}
    </AuthContext.Provider>
  );
};
