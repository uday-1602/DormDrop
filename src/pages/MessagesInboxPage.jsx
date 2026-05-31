import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { InboxSkeletonList } from '../components/Skeleton';
import './MessagesInboxPage.css';

const MessagesInboxPage = () => {
    const { user } = useAuth();
    const [conversations, setConversations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, conversation: null });

    useEffect(() => {
        const fetchConversations = async () => {
            if (!user) return;

            setLoading(true);
            try {
                // Fetch all messages where I am sender OR receiver
                const { data: messages, error } = await supabase
                    .from('messages')
                    .select(`
                        id,
                        content,
                        created_at,
                        sender_id,
                        receiver_id,
                        read,
                        deleted_by_sender,
                        deleted_by_receiver,
                        listing:listings (
                            id,
                            title,
                            price,
                            images,
                            seller_id,
                            seller_name
                        )
                    `)
                    .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
                    .order('created_at', { ascending: false });

                if (error) throw error;

                // Group by conversation unique key
                // Key = listing_id + partner_id
                const groups = {};

                messages.forEach(msg => {
                    if (!msg) return;

                    const isMeSender = msg.sender_id === user.id;
                    const partnerId = isMeSender ? msg.receiver_id : msg.sender_id;
                    const listingId = msg.listing?.id;

                    // Filter out deleted messages
                    // Use optional chaining and default to false if null/undefined
                    if (isMeSender && (msg.deleted_by_sender === true)) return;
                    if (!isMeSender && (msg.deleted_by_receiver === true)) return;

                    if (!listingId) return; // Skip if listing deleted

                    const key = `${listingId}-${partnerId}`;

                    if (!groups[key]) {
                        groups[key] = {
                            listing: msg.listing,
                            partnerId: partnerId,
                            lastMessage: msg.content,
                            timestamp: msg.created_at,
                            messages: [],
                            role: msg.listing.seller_id === user.id ? 'seller' : 'buyer',
                            hasUnread: false // Initialize
                        };
                    }
                    groups[key].messages.push(msg);

                    // If I am the receiver and message is not read
                    if (msg.receiver_id === user.id && !msg.read) {
                        groups[key].hasUnread = true;
                    }
                });

                setConversations(Object.values(groups));

            } catch (err) {
                console.error("Error fetching inbox:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchConversations();

        // Subscribe to any message changes involving this user
        const channel = supabase
            .channel('inbox-updates')
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

                    if (
                        (newMsg && (newMsg.sender_id === user.id || newMsg.receiver_id === user.id)) ||
                        (oldMsg && (oldMsg.sender_id === user.id || oldMsg.receiver_id === user.id))
                    ) {
                        fetchConversations();
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user]);

    const handleContextMenu = (e, conversation) => {
        if (!conversation) return;
        e.preventDefault();
        setContextMenu({
            visible: true,
            x: e.pageX,
            y: e.pageY,
            conversation
        });
    };

    const handleDeleteConversation = async () => {
        if (!contextMenu.conversation || !user) return;

        const conv = contextMenu.conversation;
        const listingId = conv.listing?.id;
        const partnerId = conv.partnerId;

        if (!listingId || !partnerId) return;

        // Optimistically remove from UI
        setConversations(prev => prev.filter(c =>
            !(c.listing.id === listingId && c.partnerId === partnerId)
        ));
        setContextMenu({ ...contextMenu, visible: false });

        try {
            // Update messages in this conversation where I am sender
            await supabase
                .from('messages')
                .update({ deleted_by_sender: true })
                .match({
                    listing_id: listingId,
                    sender_id: user.id,
                    receiver_id: partnerId
                });

            // Update messages in this conversation where I am receiver
            await supabase
                .from('messages')
                .update({ deleted_by_receiver: true })
                .match({
                    listing_id: listingId,
                    sender_id: partnerId,
                    receiver_id: user.id
                });

        } catch (err) {
            console.error("Error deleting conversation:", err);
            // Ideally revert optimistic update here if critical
        }
    };

    return (
        <div className="page">
            <div className="container">
                <div className="messages-inbox-container">
                    <h1 className="page-title">Messages</h1>
                    <p className="page-subtitle">Your conversations</p>

                    {loading ? (
                        <InboxSkeletonList count={3} />
                    ) : conversations.length === 0 ? (
                        <div className="empty-state">
                            <p className="text-gray-600">No messages yet</p>
                        </div>
                    ) : (
                        <div className="conversations-list">
                            {conversations.map(conv => {
                                // Determine Link URL
                                let linkUrl = `/messages/${conv.listing.id}`;
                                if (conv.role === 'seller') {
                                    linkUrl += `?buyerId=${conv.partnerId}`;
                                }

                                const images = conv.listing.images || [];
                                const imageSrc = images.length > 0 ? images[0] : null;

                                return (
                                    <div
                                        key={`${conv.listing.id}-${conv.partnerId}`}
                                        onContextMenu={(e) => handleContextMenu(e, conv)}
                                        className={`conversation-wrapper ${conv.hasUnread ? 'unread-conversation' : ''}`}
                                    >
                                        {conv.hasUnread && <span className="unread-dot"></span>}
                                        <Link
                                            to={linkUrl}
                                            className="conversation-item"
                                        >
                                            <div className="conversation-image">
                                                {imageSrc ? (
                                                    <img src={imageSrc} alt={conv.listing.title} />
                                                ) : (
                                                    <div className="w-full h-full bg-gray-200 flex items-center justify-center text-xs">No Img</div>
                                                )}
                                            </div>

                                            <div className="conversation-content">
                                                <div className="conversation-header">
                                                    <h3 className="conversation-title">{conv.listing.title}</h3>
                                                    <span className="conversation-time">
                                                        {new Date(conv.timestamp).toLocaleDateString()}
                                                    </span>
                                                </div>

                                                <p className="conversation-preview truncate block w-full">
                                                    {conv.role === 'seller' ? 'Partner: Buyer' : `Seller: ${conv.listing.seller_name}`}
                                                    <span className="mx-2 text-gray-300">|</span>
                                                    {conv.lastMessage}
                                                </p>

                                                <div className="conversation-meta">
                                                    <span className="conversation-price">₹{conv.listing.price}</span>
                                                </div>
                                            </div>
                                        </Link>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Context Menu */}
                {contextMenu.visible && (
                    <div
                        className="context-menu"
                        style={{ top: contextMenu.y, left: contextMenu.x }}
                    >
                        <button
                            className="context-menu-item delete"
                            onClick={handleDeleteConversation}
                        >
                            Delete
                        </button>
                    </div>
                )}

                {/* Click outside to close menu */}
                {contextMenu.visible && (
                    <div
                        className="context-menu-backdrop"
                        onClick={() => setContextMenu({ ...contextMenu, visible: false })}
                    />
                )}
            </div>
        </div>
    );
};

export default MessagesInboxPage;
