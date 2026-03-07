import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import Button from './Button';
import './Header.css';

const Header = ({ onSignInClick }) => {
    const { isLoggedIn, user, logout } = useAuth();
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        if (!isLoggedIn || !user) {
            setUnreadCount(0);
            return;
        }

        const fetchUnreadCount = async () => {
            try {
                const { count, error } = await supabase
                    .from('messages')
                    .select('*', { count: 'exact', head: true })
                    .eq('receiver_id', user.id)
                    .eq('read', false);

                if (error) throw error;
                setUnreadCount(count || 0);
            } catch (err) {
                console.error("Error fetching unread count:", err);
            }
        };

        fetchUnreadCount();

        // Subscribe to changes in messages table
        const channel = supabase
            .channel(`header-unread-${user.id}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'messages',
                },
                (payload) => {
                    const newMsg = payload.new;
                    const oldMsg = payload.old;

                    // Re-fetch if I am the receiver (new message or status update)
                    if (
                        (newMsg && newMsg.receiver_id === user.id) ||
                        (oldMsg && oldMsg.receiver_id === user.id)
                    ) {
                        fetchUnreadCount();
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [isLoggedIn, user]);

    return (
        <header className="header">
            <div className="header-container">
                <div className="header-content">
                    <Link to="/" className="logo">
                        <h1>DormDrop</h1>
                    </Link>

                    <nav className="nav">
                        {isLoggedIn && (
                            <>
                                <Link to="/messages" className="nav-link messages-icon-link">
                                    <svg
                                        width="24"
                                        height="24"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    >
                                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                                    </svg>
                                    {unreadCount > 0 && <span className="notification-dot"></span>}
                                </Link>
                                <Link to="/create" className="nav-link">Sell</Link>
                            </>
                        )}
                    </nav>

                    <div className="header-actions">
                        {isLoggedIn ? (
                            <>
                                {/* Desktop: show name text */}
                                <Link to="/account" className="user-name-link">
                                    {user?.name}
                                </Link>
                                {/* Mobile: show person icon instead */}
                                <Link to="/account" className="user-icon-link" aria-label="Account">
                                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="12" cy="8" r="4" />
                                        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                                    </svg>
                                </Link>
                            </>
                        ) : (
                            <Button onClick={onSignInClick}>Sign In</Button>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
