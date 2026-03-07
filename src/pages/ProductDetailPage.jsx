import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import Button from '../components/Button';
import './ProductDetailPage.css';

const ProductDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { isLoggedIn } = useAuth();
    const [listing, setListing] = useState(null);
    const [loading, setLoading] = useState(true);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    useEffect(() => {
        const fetchListing = async () => {
            setLoading(true);
            try {
                // Determine if ID is UUID (Supabase) or something else
                // But Supabase ID is UUID.

                const { data, error } = await supabase
                    .from('listings')
                    .select('*')
                    .eq('id', id)
                    .single();

                if (error) throw error;
                setListing(data);
            } catch (error) {
                console.error('Error fetching listing:', error);
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchListing();
    }, [id]);

    if (loading) {
        return (
            <div className="page">
                <div className="container">
                    <div className="text-center py-20 text-gray-500">Loading details...</div>
                </div>
            </div>
        );
    }

    if (!listing) {
        return (
            <div className="page">
                <div className="container">
                    <div className="empty-state">
                        <h2>Product not found</h2>
                        <Button onClick={() => navigate('/')}>Back to Home</Button>
                    </div>
                </div>
            </div>
        );
    }

    // Support both 'images' (DB) and 'photos' (legacy/mock) just in case, though DB is source of truth
    const displayImages = listing.images || listing.photos || [];

    const handleBuyClick = () => {
        navigate(`/messages/${listing.id}`);
    };

    return (
        <div className="page">
            <div className="container">
                <div className="product-detail">
                    {/* Image Gallery */}
                    <div className="product-gallery">
                        <div className="main-image">
                            {displayImages.length > 0 ? (
                                <img src={displayImages[currentImageIndex]} alt={listing.title} />
                            ) : (
                                <div className="bg-gray-200 w-full h-full flex items-center justify-center">No Image</div>
                            )}
                        </div>
                        <div className="thumbnail-list">
                            {displayImages.map((photo, index) => (
                                <button
                                    key={index}
                                    className={`thumbnail ${currentImageIndex === index ? 'active' : ''}`}
                                    onClick={() => setCurrentImageIndex(index)}
                                >
                                    <img src={photo} alt={`${listing.title} ${index + 1}`} />
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Product Info */}
                    <div className="product-info">
                        <div className="product-header">
                            <h1 className="product-title">{listing.title}</h1>
                            <p className="product-price">₹{listing.price}</p>
                        </div>

                        <div className="product-meta">
                            <div className="meta-item">
                                <span className="meta-label">College</span>
                                <span className="meta-value">{listing.college}</span>
                            </div>
                            <div className="meta-item">
                                <span className="meta-label">Seller</span>
                                <span className="meta-value">{listing.seller_name || listing.sellerName}</span>
                            </div>
                        </div>

                        <div className="product-description">
                            <h3>Description</h3>
                            <p>{listing.description}</p>
                        </div>

                        {isLoggedIn && (
                            <div className="product-actions">
                                <Button onClick={handleBuyClick} fullWidth>
                                    Buy Now
                                </Button>
                            </div>
                        )}

                        {!isLoggedIn && (
                            <div className="login-prompt">
                                <p className="text-gray-600">Sign in to contact the seller</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductDetailPage;
