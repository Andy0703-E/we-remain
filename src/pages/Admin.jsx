import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Upload, Image as ImageIcon, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '../supabase';
import './Admin.css';

const Admin = () => {
    const navigate = useNavigate();
    const [selectedFile, setSelectedFile] = useState(null);
    const [category, setCategory] = useState('studio');
    const [caption, setCaption] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [status, setStatus] = useState({ type: '', message: '' });

    useEffect(() => {
        const isLoggedIn = localStorage.getItem('isLoggedIn');
        if (!isLoggedIn) {
            navigate('/login');
        }
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem('isLoggedIn');
        navigate('/');
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0]);
            setStatus({ type: '', message: '' });
        }
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!selectedFile) return;

        setIsUploading(true);
        setStatus({ type: '', message: '' });

        try {
            // 1. Upload image to Supabase Storage
            const fileExt = selectedFile.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const filePath = `photos/${fileName}`;

            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('kita-photos')
                .upload(filePath, selectedFile);

            if (uploadError) throw uploadError;

            // 2. Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('kita-photos')
                .getPublicUrl(filePath);

            // 3. Save metadata to Database
            const { error: dbError } = await supabase
                .from('photos')
                .insert([
                    { url: publicUrl, category, caption }
                ]);

            if (dbError) throw dbError;

            setStatus({ type: 'success', message: 'Momen berhasil disimpan! ✨' });
            setSelectedFile(null);
            setCaption('');

        } catch (error) {
            console.error('Upload error:', error);
            setStatus({ type: 'error', message: `Gagal mengunggah: ${error.message}` });
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="admin-page">
            <nav className="admin-nav">
                <h1 className="serif">Admin Portal</h1>
                <button onClick={handleLogout} className="logout-btn">Keluar</button>
            </nav>

            <main className="admin-content">
                <motion.div
                    className="upload-section"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <h2>Tambah Foto Baru</h2>
                    <p>Bagikan momen atau hasil studio terbaru untuk website kita.</p>

                    <form onSubmit={handleUpload} className="upload-form">
                        <div className={`file-drop-zone ${selectedFile ? 'has-file' : ''}`}>
                            <input type="file" id="file-input" accept="image/*" onChange={handleFileChange} />
                            <label htmlFor="file-input">
                                {selectedFile ? (
                                    <div className="file-info">
                                        <ImageIcon color="var(--accent)" size={48} />
                                        <p>{selectedFile.name}</p>
                                    </div>
                                ) : (
                                    <div className="upload-placeholder">
                                        <Upload size={48} color="var(--text-secondary)" />
                                        <p>Klik atau seret foto ke sini</p>
                                    </div>
                                )}
                            </label>
                        </div>

                        <div className="form-group">
                            <label>Kategori</label>
                            <div className="category-toggle">
                                <button
                                    type="button"
                                    className={category === 'studio' ? 'active' : ''}
                                    onClick={() => setCategory('studio')}
                                >
                                    Studio
                                </button>
                                <button
                                    type="button"
                                    className={category === 'ketemu' ? 'active' : ''}
                                    onClick={() => setCategory('ketemu')}
                                >
                                    Ketemu
                                </button>
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Keterangan (Wajib untuk 'Ketemu')</label>
                            <textarea
                                placeholder="Tulis sedikit rasa di sini..."
                                value={caption}
                                onChange={(e) => setCaption(e.target.value)}
                                required={category === 'ketemu'}
                            />
                        </div>

                        <button type="submit" className="submit-btn" disabled={!selectedFile || isUploading}>
                            {isUploading ? 'Sedang Mengunggah...' : 'Simpan Foto'}
                        </button>

                        {status.message && (
                            <motion.div
                                className={`feedback-msg ${status.type}`}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                            >
                                {status.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                                {status.message}
                            </motion.div>
                        )}
                    </form>
                </motion.div>
            </main>
        </div>
    );
};

export default Admin;
