import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Upload, Image as ImageIcon, CheckCircle, AlertCircle, Trash2, X, BarChart3, Camera, Users, LogOut, MessageCircle } from 'lucide-react';
import { supabase } from '../supabase';
import './Admin.css';

const Admin = () => {
    const navigate = useNavigate();
    const [selectedFile, setSelectedFile] = useState(null);
    const [category, setCategory] = useState('studio');
    const [caption, setCaption] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [status, setStatus] = useState({ type: '', message: '' });
    const [photos, setPhotos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [deleteModal, setDeleteModal] = useState({ show: false, photo: null });

    useEffect(() => {
        const isLoggedIn = localStorage.getItem('isLoggedIn');
        if (!isLoggedIn) {
            navigate('/login');
        }
        fetchPhotos();
    }, [navigate]);

    const fetchPhotos = async () => {
        try {
            const { data, error } = await supabase
                .from('photos')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setPhotos(data || []);
        } catch (error) {
            console.error('Error fetching photos:', error.message);
        } finally {
            setLoading(false);
        }
    };

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

            // Refresh photos list
            fetchPhotos();

        } catch (error) {
            console.error('Upload error:', error);
            setStatus({ type: 'error', message: `Gagal mengunggah: ${error.message}` });
        } finally {
            setIsUploading(false);
        }
    };

    const handleDeleteClick = (photo) => {
        setDeleteModal({ show: true, photo });
    };

    const confirmDelete = async () => {
        const photo = deleteModal.photo;
        if (!photo) return;

        try {
            // Extract file path from URL
            const urlParts = photo.url.split('/');
            const fileName = urlParts[urlParts.length - 1];
            const filePath = `photos/${fileName}`;

            // Delete from storage
            const { error: storageError } = await supabase.storage
                .from('kita-photos')
                .remove([filePath]);

            if (storageError) throw storageError;

            // Delete from database
            const { error: dbError } = await supabase
                .from('photos')
                .delete()
                .eq('id', photo.id);

            if (dbError) throw dbError;

            setStatus({ type: 'success', message: 'Foto berhasil dihapus! 🗑️' });
            fetchPhotos();
        } catch (error) {
            console.error('Delete error:', error);
            setStatus({ type: 'error', message: `Gagal menghapus: ${error.message}` });
        } finally {
            setDeleteModal({ show: false, photo: null });
        }
    };

    const cancelDelete = () => {
        setDeleteModal({ show: false, photo: null });
    };

    // Calculate stats
    const totalPhotos = photos.length;
    const studioPhotos = photos.filter(p => p.category === 'studio').length;
    const ketemuPhotos = photos.filter(p => p.category === 'ketemu').length;

    return (
        <div className="admin-page">
            {/* Modern Header */}
            <nav className="admin-nav">
                <div className="nav-left">
                    <BarChart3 size={28} color="var(--accent)" />
                    <div>
                        <h1 className="serif">Dashboard Admin</h1>
                        <p className="nav-subtitle">We Remain - Photo Management</p>
                    </div>
                </div>
                <div className="nav-right" style={{ display: 'flex', gap: '1rem' }}>
                    <button onClick={() => navigate('/chat')} className="chat-nav-btn" style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.5rem 1rem',
                        border: 'none',
                        borderRadius: '20px',
                        backgroundColor: 'var(--accent-light)',
                        color: 'var(--accent)',
                        cursor: 'pointer',
                        fontWeight: '500',
                        fontFamily: 'var(--font-sans)'
                    }}>
                        <MessageCircle size={18} />
                        Chat
                    </button>
                    <button onClick={handleLogout} className="logout-btn">
                        <LogOut size={18} />
                        Keluar
                    </button>
                </div>
            </nav>

            <main className="admin-content">
                {/* Stats Cards */}
                <motion.div
                    className="stats-grid"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <div className="stat-card">
                        <div className="stat-icon total">
                            <ImageIcon size={24} />
                        </div>
                        <div className="stat-info">
                            <h3>{totalPhotos}</h3>
                            <p>Total Foto</p>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-icon studio">
                            <Camera size={24} />
                        </div>
                        <div className="stat-info">
                            <h3>{studioPhotos}</h3>
                            <p>Foto Studio</p>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-icon ketemu">
                            <Users size={24} />
                        </div>
                        <div className="stat-info">
                            <h3>{ketemuPhotos}</h3>
                            <p>Foto Ketemu</p>
                        </div>
                    </div>
                </motion.div>

                {/* Upload Section */}
                <motion.div
                    className="upload-section"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <div className="section-header">
                        <div>
                            <h2>Tambah Foto Baru</h2>
                            <p>Bagikan momen atau hasil studio terbaru untuk website kita.</p>
                        </div>
                        <Upload size={32} color="var(--accent)" />
                    </div>

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
                                    <Camera size={16} />
                                    Studio
                                </button>
                                <button
                                    type="button"
                                    className={category === 'ketemu' ? 'active' : ''}
                                    onClick={() => setCategory('ketemu')}
                                >
                                    <Users size={16} />
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

                <motion.div
                    className="photo-management"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <h2>Kelola Foto</h2>
                    <p>Semua foto yang sudah diupload. Klik ikon hapus untuk menghapus.</p>

                    {loading ? (
                        <div className="loading-state">Memuat foto...</div>
                    ) : (
                        <div className="photo-grid">
                            {photos.map((photo) => (
                                <div key={photo.id} className="photo-card">
                                    <img src={photo.url} alt={photo.caption || 'Photo'} />
                                    <div className="photo-info">
                                        <span className="photo-category">{photo.category}</span>
                                        {photo.caption && <p className="photo-caption">{photo.caption}</p>}
                                    </div>
                                    <button
                                        className="delete-btn"
                                        onClick={() => handleDeleteClick(photo)}
                                        title="Hapus foto"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                            {photos.length === 0 && (
                                <p className="empty-msg">Belum ada foto yang diupload.</p>
                            )}
                        </div>
                    )}
                </motion.div>
            </main>

            {deleteModal.show && (
                <div className="modal-overlay" onClick={cancelDelete}>
                    <motion.div
                        className="modal-content"
                        onClick={(e) => e.stopPropagation()}
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                    >
                        <button className="modal-close" onClick={cancelDelete}>
                            <X size={20} />
                        </button>
                        <h3>Hapus Foto?</h3>
                        <p>Foto ini akan dihapus permanen dari website dan tidak bisa dikembalikan.</p>
                        {deleteModal.photo && (
                            <img src={deleteModal.photo.url} alt="Preview" className="modal-preview" />
                        )}
                        <div className="modal-actions">
                            <button className="btn-cancel" onClick={cancelDelete}>Batal</button>
                            <button className="btn-confirm" onClick={confirmDelete}>Hapus</button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
};

export default Admin;
