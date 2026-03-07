import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import Button from '../components/Button';
import './MessagingPage.css';

const MessagingPage = () => {
    const { listingId } = useParams();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    // Determine context: "otherUser" is who we are chatting with.
    // If I am the buyer, otherUser is seller.
    // If I am the seller, I need to know which buyer I'm talking to (from URL param).
    const buyerIdParam = searchParams.get('buyerId');

    const [listing, setListing] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const markAsRead = async (msgs) => {
        if (!user || !msgs || msgs.length === 0) return;

        const unreadIds = msgs
            .filter(m => m.receiver_id === user.id && !m.read)
            .map(m => m.id);

        if (unreadIds.length === 0) return;

        try {
            await supabase
                .from('messages')
                .update({ read: true })
                .in('id', unreadIds);
        } catch (err) {
            console.error("Error marking messages as read:", err);
        }
    };

    // 1. Fetch Listing Details
    useEffect(() => {
        const fetchListing = async () => {
            const { data, error } = await supabase
                .from('listings')
                .select('*')
                .eq('id', listingId)
                .single();

            if (data) setListing(data);
            if (error) console.error(error);
        };
        fetchListing();
    }, [listingId]);

    // 2. Load Messages & Subscribe
    useEffect(() => {
        if (!user || !listing) return;

        // Determine who is the "Other" participant
        let otherUserId;
        if (user.id === listing.seller_id) {
            // I am the seller. I need a buyer ID.
            if (!buyerIdParam) {
                // Ambiguous state: Seller viewing listing chat without specific buyer.
                // Redirect to inbox? Or show empty?
                // For now, let's just wait or handle if we can't determine.
                return;
            }
            otherUserId = buyerIdParam;
        } else {
            // I am the buyer. Chatting with seller.
            otherUserId = listing.seller_id;
        }

        const fetchMessages = async () => {
            setLoading(true);
            const { data, error } = await supabase
                .from('messages')
                .select('*')
                .eq('listing_id', listingId)
                .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`) // My messages
                .or(`sender_id.eq.${otherUserId},receiver_id.eq.${otherUserId}`) // With this specific person
                .order('created_at', { ascending: true });

            // The OR logic above is slightly flawed in Supabase syntax for "messages between A and B".
            // Correct logic: (sender=Me AND receiver=Other) OR (sender=Other AND receiver=Me)
            // Supabase .or() with nested ANDs is tricky.
            // Simpler: Fetch all for this listing, then filter, OR usage of raw SQL or simpler queries.
            // Actually, querying *all* messages for the listing involving ME is safest, 
            // then client-side filter for the specific conversation partner if needed (e.g. if I am seller).

            if (data) {
                // If I am seller, I only want messages with this specific buyer.
                // If I am buyer, I only want messages with seller (implied, usually).
                const filtered = data.filter(m =>
                    (m.sender_id === user.id && m.receiver_id === otherUserId) ||
                    (m.sender_id === otherUserId && m.receiver_id === user.id)
                );
                setMessages(filtered);
                markAsRead(filtered);
            }
            setLoading(false);
            scrollToBottom();
        };

        fetchMessages();

        // Subscribe to message changes for this listing
        const channel = supabase
            .channel(`listing-${listingId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'messages',
                    filter: `listing_id=eq.${listingId}`
                },
                (payload) => {
                    if (payload.eventType === 'INSERT') {
                        const newMsg = payload.new;
                        // Check if this message belongs to our conversation
                        if (
                            (newMsg.sender_id === user.id && newMsg.receiver_id === otherUserId) ||
                            (newMsg.sender_id === otherUserId && newMsg.receiver_id === user.id)
                        ) {
                            setMessages(prev => {
                                if (prev.some(m => m.id === newMsg.id)) return prev;
                                return [...prev, newMsg];
                            });
                            markAsRead([newMsg]);
                            scrollToBottom();
                        }
                    } else if (payload.eventType === 'UPDATE') {
                        const updatedMsg = payload.new;
                        setMessages(prev => prev.map(m => m.id === updatedMsg.id ? updatedMsg : m));
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [listingId, user, listing, buyerIdParam]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !user || !listing) return;

        let receiverId;
        if (user.id === listing.seller_id) {
            receiverId = buyerIdParam;
            if (!receiverId) return; // Cannot send to unknown buyer
        } else {
            receiverId = listing.seller_id;
        }

        const msgText = newMessage.trim();
        setNewMessage(''); // Optimistic clear

        const { data, error } = await supabase.from('messages').insert([
            {
                listing_id: listingId,
                sender_id: user.id || user.uid,
                receiver_id: receiverId,
                content: msgText,
                read: false
            }
        ]).select().single();

        if (error) {
            console.error('Error sending:', error);
        } else if (data) {
            setMessages(prev => {
                // Prevent duplicates if subscription fires quickly
                if (prev.some(m => m.id === data.id)) return prev;
                return [...prev, data];
            });
            scrollToBottom();
        }


    };

    if (!listing) return <div className="p-10 text-center">Loading...</div>;

    const displayImages = listing.images || listing.photos || [];

    return (
        <div className="messaging-page-wrapper">
            <div className="messaging-container">
                    {/* Chat Header */}
                    <div className="chat-header">
                        <div className="chat-header-content">
                            <button onClick={() => navigate(-1)} className="back-button">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M19 12H5M12 19l-7-7 7-7" />
                                </svg>
                            </button>
                            <div className="chat-product-info">
                                {displayImages.length > 0 && (
                                    <img
                                        src={displayImages[0]}
                                        alt={listing.title}
                                        className="chat-product-image"
                                    />
                                )}
                                <div>
                                    <h2 className="chat-product-title">{listing.title}</h2>
                                    <p className="chat-product-price">₹{listing.price}</p>
                                </div>
                            </div>
                        </div>
                        <div className="chat-seller-info">
                            <p className="text-sm text-gray-600">
                                {user?.id === listing.seller_id ? 'Chatting with Buyer' : 'Seller'}
                            </p>
                            <p className="font-medium">
                                {user?.id === listing.seller_id ? 'Potential Buyer' : listing.seller_name}
                            </p>
                        </div>
                    </div>

                    {/* Messages Area */}
                    <div className="messages-area">
                        {loading && <p className="text-center text-gray-400 py-4">Loading messages...</p>}

                        {!loading && messages.length === 0 && (
                            <div className="empty-messages">
                                <p className="text-gray-600">
                                    Start a conversation about this item
                                </p>
                            </div>
                        )}

                        {messages.map((message) => {
                            const isMe = message.sender_id === user?.id;
                            return (
                                <div
                                    key={message.id}
                                    className={`message ${isMe ? 'message-sent' : 'message-received'}`}
                                >
                                    <div className="message-content">
                                        {message.content}
                                    </div>
                                    <div className="text-xs text-gray-400 mt-1 text-right">
                                        {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>
                            );
                        })}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Message Input or Deleted Banner */}
                    {listing.status === 'deleted' ? (
                        <div className="deleted-banner p-4 bg-gray-100 text-center text-gray-600 border-t">
                            <p>This listing has been deleted by the seller. Chat is disabled.</p>
                        </div>
                    ) : (
                        <form onSubmit={handleSendMessage} className="message-input-form">
                            <textarea
                                className="message-input"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder="Type your message..."
                                rows="1"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSendMessage(e);
                                    }
                                }}
                            />
                            <button
                                type="submit"
                                className="send-button"
                                disabled={!newMessage.trim()}
                                aria-label="Send message"
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="22" y1="2" x2="11" y2="13"></line>
                                    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                                </svg>
                            </button>
                        </form>
                    )}
            </div>
        </div>
    );
};

export default MessagingPage;
