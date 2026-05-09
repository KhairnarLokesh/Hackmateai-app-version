import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  teamId: string | null;
  refreshTeamId: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  teamId: null,
  refreshTeamId: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [teamId, setTeamId] = useState<string | null>(null);

  const fetchTeamId = async (uid: string) => {
    try {
      const userDocRef = doc(db, 'users', uid);
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
        const data = userDoc.data();
        setTeamId(data.teamId || null);
      } else {
        setTeamId(null);
      }
    } catch (error) {
      console.error('Error fetching team ID:', error);
      setTeamId(null);
    }
  };

  const refreshTeamId = async () => {
    if (user) {
      await fetchTeamId(user.uid);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await fetchTeamId(currentUser.uid);
      } else {
        setTeamId(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, teamId, refreshTeamId }}>
      {children}
    </AuthContext.Provider>
  );
};
