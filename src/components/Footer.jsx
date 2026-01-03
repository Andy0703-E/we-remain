import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import './Footer.css';

const Footer = () => {
    return (
        <footer className="footer">
            <div className="container">
                <motion.div
                    className="footer-content"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 2 }}
                >
                    <div className="footer-message">
                        <p>“Aku tidak tahu kapan kita bertemu lagi.”</p>
                        <p className="highlight-text-footer">Tapi aku tahu, aku ingin tetap di sini.</p>
                    </div>

                    <div className="footer-credits">
                        <p className="serif">still-us &bull; we remain</p>
                        <Link to="/login" className="login-link-footer">Masuk</Link>
                    </div>
                </motion.div>
            </div>
        </footer>
    );
};

export default Footer;
