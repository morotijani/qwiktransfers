import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api, { getImageUrl } from '../services/api';

const LandingLayout = ({ children }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [config, setConfig] = useState({
        system_name: 'QwikTransfers',
        system_logo: ''
    });

    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const configRes = await api.get('/system/config/public');
                setConfig({
                    system_name: configRes.data.system_name || 'QwikTransfers',
                    system_logo: configRes.data.system_logo || ''
                });
            } catch (error) {
                console.error('Config fetch error:', error);
            }
        };
        fetchConfig();
    }, []);

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
        // Prevent scroll when menu is open
        if (!isMenuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
    };

    const closeMenu = () => {
        setIsMenuOpen(false);
        document.body.style.overflow = 'unset';
    };

    return (
        <div className={`landing-layout ${isMenuOpen ? 'menu-is-open' : ''}`}>
            {/* Chowdeck Style Segmented Navbar */}
            <nav className="landing-navbar">
                {/* Segment 1: Brand */}
                <div className="nav-segment nav-brand-pill">
                    <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none', color: 'inherit' }}>
                        {config.system_logo ? (
                            <img
                                src={getImageUrl(`/${config.system_logo}`)}
                                alt="Logo"
                                style={{ width: '28px', height: '28px', objectFit: 'contain', borderRadius: '4px' }}
                            />
                        ) : (
                            <div style={{ width: '28px', height: '28px', background: 'white', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', fontWeight: 900, fontSize: '0.9rem' }}>Q</div>
                        )}
                        <span>{config.system_name}</span>
                    </Link>
                </div>

                {/* Segment 2: Links */}
                <div className="nav-segment nav-links-pill">
                    <a href="/#how-it-works" className="nav-link">Movement</a>
                    <Link to="/about-vendor" className="nav-link">Vendors</Link>
                    <Link to="/contact-us" className="nav-link">Help</Link>
                </div>

                {/* Segment 3: Auth/CTAs */}
                <div className="nav-segment nav-auth-pill">
                    <Link to="/login" className="btn-pill-secondary">Log in</Link>
                    <Link to="/register" className="btn-pill-primary">Join Now</Link>
                </div>

                {/* Mobile Trigger */}
                <button className={`nav-mobile-trigger ${isMenuOpen ? 'active' : ''}`} onClick={toggleMenu}>
                    <span className="material-symbols-outlined">{isMenuOpen ? 'close' : 'menu'}</span>
                </button>
            </nav>

            {/* Premium Mobile Menu Overlay (Chowdeck Style) */}
            <div className={`landing-mobile-menu ${isMenuOpen ? 'open' : ''}`}>
                <div className="landing-menu-header">
                    <div className="landing-menu-logo">
                        {config.system_logo ? (
                            <img src={getImageUrl(`/${config.system_logo}`)} alt="Logo" />
                        ) : (
                            <span className="signature-font">Q</span>
                        )}
                    </div>
                    <button className="landing-close-btn" onClick={closeMenu}>
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                <div className="landing-menu-links">
                    <Link to="/" className="landing-nav-item" onClick={closeMenu}>
                        <span className="landing-nav-icon"><span className="material-symbols-outlined">home</span></span>
                        <span className="landing-nav-text">Home</span>
                    </Link>
                    <a href="/#how-it-works" className="landing-nav-item" onClick={closeMenu}>
                        <span className="landing-nav-icon"><span className="material-symbols-outlined">rocket_launch</span></span>
                        <span className="landing-nav-text">Movement</span>
                    </a>
                    <Link to="/about-vendor" className="landing-nav-item" onClick={closeMenu}>
                        <span className="landing-nav-icon"><span className="material-symbols-outlined">handshake</span></span>
                        <span className="landing-nav-text">Vendors</span>
                    </Link>
                    <Link to="/contact-us" className="landing-nav-item" onClick={closeMenu}>
                        <span className="landing-nav-icon"><span className="material-symbols-outlined">call</span></span>
                        <span className="landing-nav-text">Contact</span>
                    </Link>
                    <Link to="/privacy-policy" className="landing-nav-item" onClick={closeMenu}>
                        <span className="landing-nav-icon"><span className="material-symbols-outlined">description</span></span>
                        <span className="landing-nav-text">Privacy</span>
                    </Link>

                    <div className="landing-menu-divider"></div>

                    <Link to="/login" className="landing-nav-item" onClick={closeMenu}>
                        <span className="landing-nav-icon"><span className="material-symbols-outlined">person</span></span>
                        <span className="landing-nav-text">Log in</span>
                    </Link>
                    <Link to="/register" className="landing-nav-item highlight" onClick={closeMenu}>
                        <span className="landing-nav-icon"><span className="material-symbols-outlined">auto_awesome</span></span>
                        <span className="landing-nav-text">Join Qwiktransfers</span>
                    </Link>
                </div>

                <div className="landing-menu-footer">
                    <p>&copy; {new Date().getFullYear()} {config.system_name}</p>
                    <div className="landing-socials">
                        <span>Twitter</span>
                        <span>Instagram</span>
                    </div>
                </div>
            </div>

            <main>
                {children}
            </main>

            {/* Minimalist Giant Text Footer (Image 2 Style) */}
            <footer className="minimal-giant-footer">
                <div className="footer-top-row">
                    <span>&copy; {new Date().getFullYear()} All rights reserved</span>
                    <span>info@qwiktransfers.com</span>
                    <Link to="/privacy-policy">Privacy Policy</Link>
                </div>
                <div className="footer-giant-brand">
                    Qwiktransfers
                </div>
            </footer>

            {/* Global Floating QR Pill */}
            <div className="global-floating-qr">
                <div
                    className="qr-pill"
                    onClick={() => window.location.href = '/download'}
                >
                    <img
                        src="/qwiktransfers_qr.png"
                        alt="QR Code"
                        className="qr-code-img"
                    />
                    <span className="qr-text">Get the app</span>
                </div>
            </div>
        </div>
    );
};

export default LandingLayout;
