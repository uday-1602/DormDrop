import { Link } from 'react-router-dom';
import './Footer.css';

const Footer = () => {
    return (
        <footer className="footer">
            <div className="footer-container">
                <div className="footer-grid">
                    <div className="footer-brand">
                        <span className="footer-logo">DormDrop</span>
                        <p className="footer-desc">
                            India's campus-exclusive student marketplace. Buy and sell textbooks, electronics, clothes, furniture, and more with students at your college.
                        </p>
                    </div>
                    <div className="footer-links-group">
                        <div className="footer-links">
                            <h4>Marketplace</h4>
                            <Link to="/">Browse Listings</Link>
                            <Link to="/create">Sell an Item</Link>
                        </div>
                        <div className="footer-links">
                            <h4>Support</h4>
                            <a href="mailto:support@dormdrop.co.in">Contact Us</a>
                            <Link to="/account">My Account</Link>
                        </div>
                        <div className="footer-links">
                            <h4>Trust & Safety</h4>
                            <span className="footer-link-static">Verified Campuses</span>
                            <span className="footer-link-static">Secure Messaging</span>
                        </div>
                    </div>
                </div>
                <div className="footer-bottom">
                    <p className="copyright">
                        &copy; {new Date().getFullYear()} DormDrop. All Rights Reserved.
                    </p>
                    <p className="footer-tagline">Built for students, by students.</p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
