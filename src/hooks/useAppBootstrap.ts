import { useEffect, useState } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { getIslands } from '../lib/firestore/islands';
import { seedCanonicalData } from '../seed';
import type { IslandDoc, UserProfile } from '../types';

export function useAppBootstrap() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [islands, setIslands] = useState<IslandDoc[]>([]);
  const [activeAgent, setActiveAgent] = useState<'concierge' | 'operator'>('concierge');

  useEffect(() => {
    if (profile?.role === 'merchant' || profile?.role === 'admin') {
      setActiveAgent('operator');
    } else {
      setActiveAgent('concierge');
    }
  }, [profile]);

  useEffect(() => {
    if (loading) return;

    async function loadIslands() {
      try {
        const data = await getIslands();
        if (data.length === 0) {
          const isHardcodedAdmin = user?.email === 'OvandoRawlins@gmail.com';
          const isProfileAdmin = profile?.role === 'admin';
          if (isHardcodedAdmin || isProfileAdmin) {
            await seedCanonicalData();
            const refreshedData = await getIslands();
            setIslands(refreshedData);
          }
        } else {
          setIslands(data);
        }
      } catch (error) {
        console.error('Error loading islands:', error);
      }
    }

    loadIslands();
  }, [loading, profile, user]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        const docRef = doc(db, 'users', firebaseUser.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setProfile(docSnap.data() as UserProfile);
        } else {
          const newProfile: UserProfile = {
            uid: firebaseUser.uid,
            email: firebaseUser.email || '',
            displayName: firebaseUser.displayName || 'Guest',
            photoURL: firebaseUser.photoURL || '',
            role: 'user',
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };
          try {
            await setDoc(docRef, newProfile);
            setProfile(newProfile);
          } catch (error) {
            console.error('Error creating profile:', error);
          }
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return {
    user,
    profile,
    loading,
    islands,
    activeAgent,
  };
}
