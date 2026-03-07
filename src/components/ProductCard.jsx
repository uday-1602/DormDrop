import { Link } from 'react-router-dom';
import './ProductCard.css';

const ProductCard = ({ listing }) => {
    // Check for images (Supabase) or photos (legacy mock)
    const images = listing.images || listing.photos || [];
    const mainImage = images.length > 0 ? images[0] : null;

    return (
        <Link to={`/product/${listing.id}`} className="product-card">
            <div className="product-card-image">
                {mainImage ? (
                    <img src={mainImage} alt={listing.title} />
                ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-500">
                        No Image
                    </div>
                )}
            </div>
            <div className="product-card-content">
                <h3 className="product-card-title">{listing.title}</h3>
                <p className="product-card-college">{listing.college}</p>
                <p className="product-card-price">₹{listing.price}</p>
            </div>
        </Link>
    );
};

export default ProductCard;
