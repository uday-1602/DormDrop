import './Skeleton.css';

// Base Skeleton shape component
export const Skeleton = ({
    variant = 'text', // 'text', 'rect', 'circle'
    width,
    height,
    className = '',
    style = {},
    ...props
}) => {
    const classNames = `skeleton ${variant} ${className}`.trim();
    const customStyle = {
        width: width || (variant === 'text' ? '100%' : undefined),
        height: height || (variant === 'text' ? '1em' : undefined),
        ...style
    };

    return <div className={classNames} style={customStyle} {...props} />;
};

// 1. Product Card Skeleton Grid
export const ProductCardSkeleton = () => {
    return (
        <div className="product-card-skeleton">
            <Skeleton variant="rect" className="product-card-skeleton-image" />
            <div className="product-card-skeleton-content">
                <Skeleton variant="text" width="80%" className="product-card-skeleton-title" />
                <Skeleton variant="text" width="60%" className="product-card-skeleton-college" />
                <Skeleton variant="text" width="40%" className="product-card-skeleton-price" />
            </div>
        </div>
    );
};

// Helper for generating multiple skeletons
export const ProductSkeletonGrid = ({ count = 8 }) => {
    return (
        <div className="products-grid">
            {Array.from({ length: count }).map((_, index) => (
                <ProductCardSkeleton key={index} />
            ))}
        </div>
    );
};

// 2. Product Detail Page Skeleton
export const ProductDetailSkeleton = () => {
    return (
        <div className="product-detail-skeleton">
            <div className="product-detail-skeleton-left">
                <Skeleton variant="rect" className="product-detail-skeleton-image-gallery" />
            </div>
            <div className="product-detail-skeleton-right">
                <div className="product-detail-skeleton-header">
                    <Skeleton variant="text" width="40%" height="2rem" className="mb-4" />
                    <Skeleton variant="text" width="90%" height="2.5rem" className="mb-4" />
                    <Skeleton variant="text" width="30%" height="2rem" className="mb-4" />
                </div>
                <div className="product-detail-skeleton-info">
                    <Skeleton variant="text" width="50%" className="mb-2" />
                    <Skeleton variant="text" width="70%" className="mb-2" />
                </div>
                <hr className="skeleton-divider" />
                <div className="product-detail-skeleton-desc">
                    <Skeleton variant="text" width="100%" className="mb-2" />
                    <Skeleton variant="text" width="95%" className="mb-2" />
                    <Skeleton variant="text" width="80%" className="mb-2" />
                </div>
                <Skeleton variant="rect" width="100%" height="45px" className="product-detail-skeleton-btn" />
            </div>
        </div>
    );
};

// 3. Inbox Row (List item) Skeleton
export const InboxRowSkeleton = () => {
    return (
        <div className="inbox-row-skeleton">
            <Skeleton variant="rect" className="inbox-row-skeleton-avatar" />
            <div className="inbox-row-skeleton-content">
                <div className="inbox-row-skeleton-header">
                    <Skeleton variant="text" width="50%" height="1.1rem" />
                    <Skeleton variant="text" width="20%" height="0.8rem" />
                </div>
                <Skeleton variant="text" width="85%" height="0.9rem" className="mt-2" />
                <Skeleton variant="text" width="30%" height="0.9rem" className="mt-2" />
            </div>
        </div>
    );
};

export const InboxSkeletonList = ({ count = 5 }) => {
    return (
        <div className="conversations-list">
            {Array.from({ length: count }).map((_, index) => (
                <InboxRowSkeleton key={index} />
            ))}
        </div>
    );
};

// 4. Chat Thread (Messages area) Skeleton
export const ChatThreadSkeleton = () => {
    return (
        <div className="chat-thread-skeleton">
            {/* Mock Chat Header */}
            <div className="chat-header">
                <div className="chat-header-content">
                    <Skeleton variant="circle" width="32px" height="32px" className="mr-3" />
                    <Skeleton variant="rect" width="36px" height="36px" className="mr-3" />
                    <div>
                        <Skeleton variant="text" width="120px" height="1.1rem" className="mb-2" />
                        <Skeleton variant="text" width="60px" height="0.9rem" />
                    </div>
                </div>
                <div>
                    <Skeleton variant="text" width="80px" height="0.9rem" className="mb-2" />
                    <Skeleton variant="text" width="100px" height="1rem" />
                </div>
            </div>

            {/* Mock Message Bubbles */}
            <div className="messages-area p-4">
                <div className="message-skeleton message-skeleton-received">
                    <Skeleton variant="rect" width="60%" height="45px" />
                </div>
                <div className="message-skeleton message-skeleton-sent">
                    <Skeleton variant="rect" width="45%" height="45px" />
                </div>
                <div className="message-skeleton message-skeleton-received">
                    <Skeleton variant="rect" width="70%" height="55px" />
                </div>
                <div className="message-skeleton message-skeleton-sent">
                    <Skeleton variant="rect" width="35%" height="45px" />
                </div>
                <div className="message-skeleton message-skeleton-received">
                    <Skeleton variant="rect" width="50%" height="45px" />
                </div>
            </div>
        </div>
    );
};
