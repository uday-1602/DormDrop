import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import { ProductSkeletonGrid } from '../components/Skeleton';
import Button from '../components/Button';
import CollegeSelector from '../components/CollegeSelector';
import './AccountPage.css';

const AccountPage = () => {
    const { user, logout, updateCollege } = useAuth();
    const navigate = useNavigate();
    const [userListings, setUserListings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isEditingCollege, setIsEditingCollege] = useState(false);
    const [newCollege, setNewCollege] = useState(user?.college || '');
    const [updating, setUpdating] = useState(false);
    const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, listingId: null });
    const [confirmModal, setConfirmModal] = useState({ visible: false, listingId: null });

    const handleUpdateCollege = async () => {
        const normalizedCollege = newCollege.trim();
        if (!normalizedCollege) {
            setIsEditingCollege(false);
            return;
        }

        if (normalizedCollege === user.college) {
            setIsEditingCollege(false);
            return;
        }

        setUpdating(true);
        try {
            await updateCollege(normalizedCollege);
            setIsEditingCollege(false);
        } catch (error) {
            console.error('Failed to update college:', error);
            alert('Failed to update college. Please try again.');
        } finally {
            setUpdating(false);
        }
    };

    useEffect(() => {
        if (user) setNewCollege(user.college);
    }, [user]);

    useEffect(() => {
        const fetchUserListings = async () => {
            if (!user) return;

            setLoading(true);
            try {
                // Fetch only active listings (hide deleted ones from my profile)
                const { data, error } = await supabase
                    .from('listings')
                    .select('*')
                    .eq('seller_id', user.uid || user.id)
                    .neq('status', 'deleted')
                    .order('created_at', { ascending: false });

                if (error) throw error;
                setUserListings(data || []);
            } catch (error) {
                console.error('Error fetching user listings:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchUserListings();
    }, [user]);

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/');
        } catch (error) {
            console.error('Failed to log out', error);
        }
    };

    const handleContextMenu = (e, listingId) => {
        e.preventDefault();
        setContextMenu({
            visible: true,
            x: e.pageX,
            y: e.pageY,
            listingId
        });
    };

    const handleDeleteClick = () => {
        setConfirmModal({ visible: true, listingId: contextMenu.listingId });
        setContextMenu({ ...contextMenu, visible: false });
    };

    const confirmDelete = async () => {
        if (!confirmModal.listingId) return;

        const idToDelete = confirmModal.listingId;
        // Optimistic update
        setUserListings(prev => prev.filter(l => l.id !== idToDelete));
        setConfirmModal({ visible: false, listingId: null });

        try {
            const { error } = await supabase
                .from('listings')
                .update({
                    status: 'deleted',
                    deleted_at: new Date().toISOString()
                })
                .eq('id', idToDelete);

            if (error) throw error;

        } catch (err) {
            console.error("Error deleting listing:", err);
            // Optionally revert
        }
    };

    if (!user) {
        // Should be handled by protected route, but safety first
        return null;
    }

    return (
        <div className="page">
            <div className="container" onClick={() => setContextMenu({ ...contextMenu, visible: false })}>
                <div className="account-header">
                    <div className="account-info">
                        <h1 className="account-title">My Account</h1>
                        <div className="user-details">
                            <p className="user-name">{user.displayName || user.name}</p>
                            {isEditingCollege ? (
                                <div className="college-edit-group">
                                    <CollegeSelector
                                        value={newCollege}
                                        onChange={setNewCollege}
                                        placeholder="Search college..."
                                    />
                                    <div className="flex gap-2">
                                        <Button
                                            onClick={handleUpdateCollege}
                                            disabled={updating}
                                            variant="primary"
                                        >
                                            {updating ? '...' : 'Save'}
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            onClick={() => {
                                                setIsEditingCollege(false);
                                                setNewCollege(user.college);
                                            }}
                                            disabled={updating}
                                        >
                                            Cancel
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="college-display-group">
                                    <p className="user-college">{user.college}</p>
                                    <button
                                        className="edit-icon-btn"
                                        onClick={() => setIsEditingCollege(true)}
                                        title="Edit College"
                                    >
                                        <svg
                                            width="16"
                                            height="16"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            className="text-gray-400 hover:text-gray-600 transition-colors"
                                        >
                                            <path d="M12 20h9" />
                                            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                                        </svg>
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                    <Button variant="ghost" onClick={handleLogout}>
                        Sign Out
                    </Button>
                </div>

                <div className="account-section">
                    <h2 className="section-title">My Listings</h2>
                    {loading ? (
                        <ProductSkeletonGrid count={3} />
                    ) : userListings.length > 0 ? (
                        <div className="products-grid">
                            {userListings.map(listing => {
                                if (!listing) return null;
                                return (
                                    <div
                                        key={listing.id}
                                        onContextMenu={(e) => handleContextMenu(e, listing.id)}
                                    >
                                        <ProductCard listing={listing} />
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="empty-state">
                            <p>You haven't posted any listings yet.</p>
                            <Button onClick={() => navigate('/create')}>
                                Create Your First Listing
                            </Button>
                        </div>
                    )}
                </div>

                {/* Context Menu */}
                {contextMenu.visible && (
                    <div
                        className="context-menu"
                        style={{ top: contextMenu.y, left: contextMenu.x }}
                    >
                        <button className="context-menu-item delete" onClick={handleDeleteClick}>
                            Delete Listing
                        </button>
                    </div>
                )}

                {/* Confirmation Modal */}
                {confirmModal.visible && (
                    <div className="modal-backdrop">
                        <div className="modal-content">
                            <h3>Delete Listing?</h3>
                            <p className="text-gray-600 mb-6">Are you sure? This will remove the listing from search results.</p>
                            <div className="flex gap-4 justify-end">
                                <Button variant="ghost" onClick={() => setConfirmModal({ visible: false, listingId: null })}>
                                    Cancel
                                </Button>
                                <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={confirmDelete}>
                                    Delete
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AccountPage;
