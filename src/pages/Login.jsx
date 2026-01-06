import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import './Login.css';

const Login = () => {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = (e) => {
        e.preventDefault();
        if (password === '07032022') {
            localStorage.setItem('isLoggedIn', 'true');
            navigate('/admin');
        } else {
            setError('Password salah. Coba lagi.');
        }
    };

    return (
        <div className="login-page">
            <motion.div
                className="login-card"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
            >
                <h2 className="serif">Ruang Berdua</h2>
                <p>Masukkan kata sandi kita.</p>

                <form onSubmit={handleSubmit}>
                    <input
                        type="password"
                        placeholder="Ketik di sini..."
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    {error && <p className="error-msg">{error}</p>}
                    <button type="submit">Masuk</button>
                </form>
            </motion.div>
        </div>
    );
};

export default Login;
