import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../supabase';
import './Highlight.css';

const Highlight = () => {
    const [highlights, setHighlights] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchHighlights();
    }, []);

    const fetchHighlights = async () => {
        try {
            const { data, error } = await supabase
                .from('photos')
                .select('*')
                .eq('category', 'ketemu')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setHighlights(data || []);
        } catch (error) {
            console.error('Error fetching highlights:', error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <section className="highlight">
            <div className="container">
                <motion.div
                    className="section-header"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                >
                    <h2 className="section-title">Saat Kita Benar-Benar Bertemu</h2>
                </motion.div>

                {loading ? (
                    <div className="loading-state">Mengingat kembali...</div>
                ) : (
                    <div className="highlight-list">
                        {highlights.map((img, index) => (
                            <motion.div
                                key={img.id}
                                className={`highlight-card ${index % 2 === 0 ? 'left' : 'right'}`}
                                initial={{ opacity: 0, y: 50 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: "-100px" }}
                                transition={{ duration: 1.5, ease: "easeOut" }}
                            >
                                <div className="highlight-image-container">
                                    <img src={img.url} alt="Meeting Moment" />
                                </div>
                                <div className="highlight-text">
                                    <p className="serif">{img.caption}</p>
                                </div>
                            </motion.div>
                        ))}
                        {highlights.length === 0 && (
                            <p className="empty-msg" style={{ textAlign: 'center', opacity: 0.5 }}>Belum ada foto pertemuan yang ditambahkan.</p>
                        )}
                    </div>
                )}
            </div>
        </section>
    );
};

export default Highlight;
