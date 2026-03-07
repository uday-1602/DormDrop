import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Input from './Input';
import Button from './Button';
import CollegeSelector from './CollegeSelector';

const AuthModal = ({ onClose }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [college, setCollege] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { login, signup, loginWithGoogle } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (isLogin) {
                await login(email, password);
            } else {
                if (!name || !college) {
                    throw new Error("Please fill in all details");
                }
                await signup(email, password, name, college);
            }
            onClose();
        } catch (err) {
            console.error(err);
            setError(err.message.replace('Firebase:', '').trim());
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="modal modal-dark p-8">
                <div className="mb-6">
                    <h2 className="text-3xl font-bold mb-2">{isLogin ? 'Sign In' : 'Sign Up'}</h2>
                    <p className="text-gray-400 text-sm">
                        {isLogin ? 'Welcome back to DormDrop' : 'Create an account to verify your college'}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                    {!isLogin && (
                        <div className="grid grid-cols-2 gap-4">
                            <Input
                                label="Full Name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="John Doe"
                                required
                            />
                            <CollegeSelector
                                value={college}
                                onChange={setCollege}
                                placeholder="Search college..."
                                required
                            />
                        </div>
                    )}

                    <Input
                        label="Email Address"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="your.email@college.edu"
                        required
                    />

                    <Input
                        label="Password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                    />

                    {error && <p className="text-red-400 text-sm font-medium bg-red-950/30 p-3 rounded-md border border-red-900/50">{error}</p>}

                    <Button type="submit" fullWidth disabled={loading}>
                        {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
                    </Button>

                    <div className="relative py-2">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-gray-800"></span>
                        </div>
                        <div className="relative flex justify-center text-xs uppercase tracking-widest font-semibold">
                            <span className="px-3 bg-black text-gray-500">Or continue with</span>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={async () => {
                            setError('');
                            setLoading(true);
                            try {
                                await loginWithGoogle();
                                onClose();
                            } catch (err) {
                                setError(err.message.replace('Firebase:', '').trim());
                            } finally {
                                setLoading(false);
                            }
                        }}
                        disabled={loading}
                        className="google-btn flex items-center justify-center gap-3 px-4 py-3 border border-gray-800 rounded-lg shadow-sm bg-gray-900 text-sm font-semibold text-white hover:bg-gray-800 transition-all active:scale-[0.98] disabled:opacity-50"
                    >
                        <svg className="h-5 w-5" viewBox="0 0 24 24">
                            <path
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                fill="#4285F4"
                            />
                            <path
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                fill="#34A853"
                            />
                            <path
                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                                fill="#FBBC05"
                            />
                            <path
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                fill="#EA4335"
                            />
                        </svg>
                        Continue with Google
                    </button>

                    <div className="text-center mt-2 text-sm text-gray-400">
                        {isLogin ? "New to DormDrop? " : "Already have an account? "}
                        <button
                            type="button"
                            className="text-white font-bold hover:underline"
                            onClick={() => setIsLogin(!isLogin)}
                        >
                            {isLogin ? 'Sign Up' : 'Sign In'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AuthModal;
