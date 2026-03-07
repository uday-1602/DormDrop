import { createContext, useContext, useState, useEffect } from 'react';
import { auth } from '../lib/firebase';
import {
    onAuthStateChanged,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    updateProfile,
    GoogleAuthProvider,
    signInWithPopup
} from 'firebase/auth';
import { supabase } from '../lib/supabaseClient';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                // Fetch user data from Supabase to get 'college' and other details
                let { data: profile, error } = await supabase
                    .from('users')
                    .select('*')
                    .eq('id', firebaseUser.uid)
                    .single();

                if (!profile) {
                    // If no profile exists (e.g., first time Google sign-in)
                    // Auto-create profile
                    const { data: newProfile, error: insertError } = await supabase.from('users').insert([
                        {
                            id: firebaseUser.uid,
                            email: firebaseUser.email,
                            name: firebaseUser.displayName || 'Google User',
                            college: 'Please update in profile',
                            avatar_url: firebaseUser.photoURL || null
                        }
                    ]).select().single();

                    if (!insertError) profile = newProfile;
                }

                if (profile) {
                    setUser({ ...firebaseUser, ...profile });
                } else {
                    setUser(firebaseUser);
                }
            } else {
                setUser(null);
            }
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const signup = async (email, password, name, college) => {
        // 1. Create user in Firebase
        const { user: firebaseUser } = await createUserWithEmailAndPassword(auth, email, password);

        // 2. Update Firebase profile
        await updateProfile(firebaseUser, { displayName: name });

        // 3. Create user in Supabase
        const { error } = await supabase.from('users').insert([
            {
                id: firebaseUser.uid,
                email,
                name,
                college,
                avatar_url: firebaseUser.photoURL || null
            }
        ]);

        if (error) throw error;

        return firebaseUser;
    };

    const login = (email, password) => {
        return signInWithEmailAndPassword(auth, email, password);
    };

    const loginWithGoogle = async () => {
        const provider = new GoogleAuthProvider();
        return signInWithPopup(auth, provider);
    };

    const updateCollege = async (newCollege) => {
        if (!user) return;

        const { error } = await supabase
            .from('users')
            .update({ college: newCollege })
            .eq('id', user.uid || user.id);

        if (error) throw error;

        // Refresh local user state
        setUser(prev => ({ ...prev, college: newCollege }));
    };

    const logout = () => {
        return signOut(auth);
    };

    const value = {
        isLoggedIn: !!user,
        user,
        signup,
        login,
        loginWithGoogle,
        updateCollege,
        logout,
        loading
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
