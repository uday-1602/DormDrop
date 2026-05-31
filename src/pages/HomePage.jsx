
import { useState, useEffect } from 'react';
import { CATEGORIES } from '../constants';
import CollegeSelector from '../components/CollegeSelector';
import CategorySelector from '../components/CategorySelector';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import ProductCard from '../components/ProductCard';
import { ProductSkeletonGrid } from '../components/Skeleton';
import './HomePage.css';

const HomePage = () => {
    const { user } = useAuth();
    const [listings, setListings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCollege, setSelectedCollege] = useState('');
    const [maxPrice, setMaxPrice] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 20;

    useEffect(() => {
        const fetchListings = async () => {
            setLoading(true);
            try {
                let query = supabase
                    .from('listings')
                    .select('*')
                    .eq('status', 'active')
                    .order('created_at', { ascending: false });

                // If user is logged in, don't show their own listings
                if (user) {
                    query = query.neq('seller_id', user.uid || user.id);
                }

                const { data, error } = await query;

                if (error) throw error;
                setListings(data || []);
            } catch (error) {
                console.error('Error fetching listings:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchListings();
    }, [user]);

    // Reset pagination when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, selectedCollege, maxPrice, selectedCategory]);

    // Save scroll position when user scrolls the homepage
    useEffect(() => {
        const handleScroll = () => {
            sessionStorage.setItem('homepage_scroll_pos', window.scrollY);
        };
        
        window.addEventListener('scroll', handleScroll);
        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, []);

    // Restore scroll position once loading is complete
    useEffect(() => {
        if (!loading) {
            const savedScrollPos = sessionStorage.getItem('homepage_scroll_pos');
            if (savedScrollPos) {
                const timer = setTimeout(() => {
                    window.scrollTo(0, parseInt(savedScrollPos, 10));
                }, 50);
                return () => clearTimeout(timer);
            } else {
                window.scrollTo(0, 0);
            }
        }
    }, [loading]);

    // Scroll to top when filters or page changes (excluding initial load)
    useEffect(() => {
        if (!loading) {
            window.scrollTo(0, 0);
        }
    }, [currentPage, searchTerm, selectedCollege, maxPrice, selectedCategory]);

    // Categories imported from constants

    // Filter listings based on search and filters
    const filteredListings = listings.filter(listing => {
        // Search Logic
        const matchesSearch =
            (listing.title?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
            (listing.description?.toLowerCase() || '').includes(searchTerm.toLowerCase());

        // Filter Logic
        const matchesCollege = !selectedCollege || listing.college === selectedCollege;
        const matchesPrice = !maxPrice || listing.price <= parseInt(maxPrice);
        const matchesCategory = !selectedCategory || listing.category === selectedCategory;

        return matchesSearch && matchesCollege && matchesPrice && matchesCategory;
    });

    // Pagination Logic
    const totalPages = Math.ceil(filteredListings.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const paginatedListings = filteredListings.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    return (
        <div className="page">
            <div className="container">
                {/* Hero Section */}
                <div className="hero">
                    <h1 className="hero-title">College Marketplace</h1>
                    <p className="hero-subtitle">
                        Buy and sell with students from top universities
                    </p>

                    {/* Search Filters - 60-20-20 Layout */}
                    <div className="hero-filters">
                        <input
                            type="text"
                            className="hero-search-input"
                            placeholder="Search products..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <CollegeSelector
                            value={selectedCollege}
                            onChange={(value) => setSelectedCollege(value)}
                            placeholder="All Colleges"
                            hideLabel
                        />
                        <input
                            type="number"
                            className="hero-filter-input"
                            placeholder="Max Price"
                            value={maxPrice}
                            onChange={(e) => {
                                const val = e.target.value;
                                if (val === '' || parseInt(val) >= 0) {
                                    setMaxPrice(val);
                                }
                            }}
                            min="0"
                            step="1"
                            onWheel={(e) => e.target.blur()}
                            onKeyDown={(e) => ['e', 'E', '+', '-', '.'].includes(e.key) && e.preventDefault()}
                        />
                    </div>
                </div>

                {/* Category Filters & Clear Filters */}
                <div className="categories-section">
                    <div className="categories-filter-wrapper">
                        <div className="categories-dropdown-container">
                            <CategorySelector
                                value={selectedCategory}
                                onChange={(value) => setSelectedCategory(value)}
                            />
                        </div>
                        {(searchTerm || selectedCollege || maxPrice || selectedCategory) && (
                            <button
                                className="filter-clear-inline"
                                onClick={() => {
                                    setSearchTerm('');
                                    setSelectedCollege('');
                                    setMaxPrice('');
                                    setSelectedCategory('');
                                }}
                            >
                                Clear
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Results Count */}
            {searchTerm && (
                <div className="results-info" style={{ padding: '0 var(--space-6)' }}>
                    <p className="text-gray-600">
                        {filteredListings.length} {filteredListings.length === 1 ? 'item' : 'items'} found
                    </p>
                </div>
            )}

            {/* Products Grid */}
            {loading ? (
                <ProductSkeletonGrid count={8} />
            ) : (
                <div className="products-grid">
                    {paginatedListings.length > 0 ? (
                        paginatedListings.map(listing => (
                            <ProductCard key={listing.id} listing={listing} />
                        ))
                    ) : (
                        <div className="empty-state">
                            <p className="text-gray-600">No products found. Try adjusting your filters.</p>
                        </div>
                    )}
                </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="pagination-container">
                    <button
                        className="pagination-btn"
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                    >
                        Previous
                    </button>
                    <span className="pagination-info">
                        Page {currentPage} of {totalPages}
                    </span>
                    <button
                        className="pagination-btn"
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    );
};

export default HomePage;
