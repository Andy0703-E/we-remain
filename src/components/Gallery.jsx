import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../supabase';
import './Gallery.css';

const Gallery = () => {
    const [studioPhotos, setStudioPhotos] = useState([]);
    const [ketemuPhotos, setKetemuPhotos] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchImages();
    }, []);

    const fetchImages = async () => {
        try {
            const { data, error } = await supabase
                .from('photos')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Split photos by category
            if (data) {
                setStudioPhotos(data.filter(p => p.category === 'studio'));
                setKetemuPhotos(data.filter(p => p.category === 'ketemu'));
            }
        } catch (error) {
            console.error('Error fetching images:', error.message);
        } finally {
            setLoading(false);
        }
    };

    const renderPhotoSection = (photos, title, subtitle) => (
        <div className="gallery-section-block">
            <motion.div
                className="section-header"
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: false, amount: 0.3 }}
                transition={{ duration: 0.8 }}
            >
                <h2 className="section-title">{title}</h2>
                <p className="section-desc">{subtitle}</p>
            </motion.div>

            <div className="gallery-grid">
                {photos.map((img, index) => (
                    <motion.div
                        key={img.id}
                        className="gallery-item"
                        initial={{ opacity: 0, x: index % 2 === 0 ? -100 : 100 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: false, amount: 0.2 }}
                        transition={{ duration: 0.6, type: "spring", bounce: 0.4 }}
                    >
                        <div className="image-wrapper">
                            <img src={img.url} alt={img.caption || `${title} ${img.id}`} loading="lazy" />
                        </div>
                        <div className="gallery-caption">
                            <p>{img.caption || ""}</p>
                        </div>
                    </motion.div>
                ))}
                {photos.length === 0 && (
                    <p className="empty-msg">Belum ada foto di kategori ini.</p>
                )}
            </div>
        </div>
    );

    return (
        <section className="gallery">
            <div className="container">
                {loading ? (
                    <div className="loading-state">Mengambil kenangan...</div>
                ) : (
                    <>
                        {/* Section 1: Studio */}
                        {renderPhotoSection(
                            studioPhotos,
                            "Potret Studio",
                            "Momen yang terabadi dalam cahaya studio."
                        )}

                        {/* Spacer or Divider could go here */}
                        <div style={{ height: '6rem' }}></div>

                        {/* Section 2: Ketemu */}
                        {renderPhotoSection(
                            ketemuPhotos,
                            "Cerita Ketemu",
                            "Setiap detik berharga saat kita bersama."
                        )}
                    </>
                )}
            </div>
        </section>
    );
};

export default Gallery;
