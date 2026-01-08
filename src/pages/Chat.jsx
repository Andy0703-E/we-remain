import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, ArrowLeft, User, Heart, Image as ImageIcon, X, Camera, RefreshCw } from 'lucide-react';

import { supabase } from '../supabase';
import './Chat.css';

const Chat = () => {
    const navigate = useNavigate();
    const [identity, setIdentity] = useState(localStorage.getItem('chatIdentity') || null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [selectedImage, setSelectedImage] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [isUploading, setIsUploading] = useState(false);

    // Camera State
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [facingMode, setFacingMode] = useState('user');

    // Camera State
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [facingMode, setFacingMode] = useState('user');

    const fileInputRef = useRef(null);
    const messagesEndRef = useRef(null);
    const videoRef = useRef(null);
    const cameraStreamRef = useRef(null);

    // Stream Ref for Camera (fix missing ref usage in previous code if any, checking...)
    // Actually in the original code 'streamRef' was used but not declared? 
    // Wait, let me check the file content again.
    // Line 135: streamRef.current = stream; 
    // But streamRef was NOT declared in the snippets I saw!
    // Ah, lines 30-41 in previous `view_file` (Step 270):
    // 33: const videoRef = useRef(null);
    // 34: const cameraStreamRef = useRef(null);
    // 36: // WebRTC Refs ... 
    // 
    // In startCamera (Line 145):
    // 151: streamRef.current = stream; 
    // Wait, looking at file content Step 270:
    // Line 135 (in startCamera logic, effectively line 151): streamRef.current = stream;
    // BUT 'streamRef' is NOT defined in lines 9-41. 
    // 'cameraStreamRef' is defined at line 34.
    // This implies there was a bug in the photo feature too? Or did I miss it?
    // Let's check line 34: const cameraStreamRef = useRef(null);
    // Let's check line 151: streamRef.current = stream;
    // YES! 'streamRef' is undefined. It should be 'cameraStreamRef'.
    // I will fix this BUG while I am at it to ensure photo works.

    // So replacement for lines 22-51 (removing video call states/refs/config):

    useEffect(() => {
        // Protect route
        const isLoggedIn = localStorage.getItem('isLoggedIn');
        if (!isLoggedIn) {
            navigate('/login');
        }

        fetchMessages();

        // Request notification permission
        if (Notification.permission === 'default') {
            Notification.requestPermission();
        }

        // Subscribe to real-time changes
        // Subscribe to real-time changes
        const subscription = supabase
            .channel('public:messages')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
                const newMessage = payload.new;
                setMessages((prev) => [...prev, newMessage]);
                scrollToBottom();

                // Notification logic
                if (newMessage.sender !== identity && document.visibilityState === 'hidden') {
                    if (Notification.permission === 'granted') {
                        new Notification(`Pesan baru dari ${newMessage.sender}`, {
                            body: newMessage.content,
                            icon: '/src/assets/heart-cursor.svg'
                        });
                    }
                }
            })
            .subscribe();

        return () => {
            supabase.removeChannel(subscription);
        };
    }, [navigate, identity]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const fetchMessages = async () => {
        const { data, error } = await supabase
            .from('messages')
            .select('*')
            .order('created_at', { ascending: true });

        if (error) console.error('Error fetching messages:', error);
        else setMessages(data || []);
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleSetIdentity = (who) => {
        localStorage.setItem('chatIdentity', who);
        setIdentity(who);
    };

    const handleImageSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedImage(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const cancelImage = () => {
        setSelectedImage(null);
        setPreviewUrl(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const startCamera = async () => {
        setIsCameraOpen(true);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: facingMode }
            });
            cameraStreamRef.current = stream; // Fixed: was streamRef
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        } catch (err) {
            console.error("Error accessing camera:", err);
            alert("Gagal mengakses kamera. Pastikan izin diberikan.");
            setIsCameraOpen(false);
        }
    };

    const stopCamera = () => {
        if (cameraStreamRef.current) { // Fixed: was streamRef
            cameraStreamRef.current.getTracks().forEach(track => track.stop());
            cameraStreamRef.current = null;
        }
        setIsCameraOpen(false);
    };

    const switchCamera = () => {
        setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
        if (cameraStreamRef.current) { // Fixed
            cameraStreamRef.current.getTracks().forEach(track => track.stop());
        }
        setTimeout(() => {
            navigator.mediaDevices.getUserMedia({
                video: { facingMode: facingMode === 'user' ? 'environment' : 'user' }
            }).then(stream => {
                cameraStreamRef.current = stream; // Fixed
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }
            });
        }, 200);
    };

    const capturePhoto = () => {
        if (videoRef.current) {
            const canvas = document.createElement('canvas');
            canvas.width = videoRef.current.videoWidth;
            canvas.height = videoRef.current.videoHeight;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

            canvas.toBlob(blob => {
                const file = new File([blob], `capture-${Date.now()}.png`, { type: 'image/png' });
                setSelectedImage(file);
                setPreviewUrl(URL.createObjectURL(file));
                stopCamera();
            }, 'image/png');
        }
    };

    // --- Video Call Logic Removed ---





    const handleSendMessage = async (e) => {
        e.preventDefault();
        if ((!newMessage.trim() && !selectedImage) || !identity || isUploading) return;

        setIsUploading(true);
        let imageUrl = null;

        try {
            // Upload image if selected
            if (selectedImage) {
                const fileExt = selectedImage.name.split('.').pop();
                const fileName = `${Date.now()}-${Math.random()}.${fileExt}`;
                const filePath = `public/${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('chat-images')
                    .upload(filePath, selectedImage);

                if (uploadError) throw uploadError;

                const { data } = supabase.storage
                    .from('chat-images')
                    .getPublicUrl(filePath);

                imageUrl = data.publicUrl;
            }

            const { error } = await supabase
                .from('messages')
                .insert([{
                    sender: identity,
                    content: newMessage,
                    image_url: imageUrl
                }]);

            if (error) {
                console.error('Error sending message:', error);
                alert('Gagal mengirim pesan');
            } else {
                setNewMessage('');
                cancelImage();
            }
        } catch (error) {
            console.error('Error uploading/sending:', error);
            alert('Gagal mengirim gambar: ' + error.message);
        } finally {
            setIsUploading(false);
        }
    };

    if (!identity) {
        return (
            <div className="chat-identity-page">
                <motion.div
                    className="identity-card"
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                >
                    <h2 className="serif">Siapa kamu?</h2>
                    <div className="identity-options">
                        <button onClick={() => handleSetIdentity('Agung')} className="identity-btn">
                            <User size={24} />
                            <span>Agung</span>
                        </button>
                        <button onClick={() => handleSetIdentity('Esthy')} className="identity-btn">
                            <Heart size={24} fill="currentColor" />
                            <span>Esthy</span>
                        </button>
                    </div>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="chat-page">
            <header className="chat-header">
                <button onClick={() => navigate('/admin')} className="back-btn">
                    <ArrowLeft size={24} />
                </button>
                <div className="header-info">
                    <h2 className="serif">Ruang Berdua</h2>
                    <p className="status">Online</p>
                </div>

            </header>

            <div className="messages-container">
                {messages.map((msg) => (
                    <motion.div
                        key={msg.id}
                        className={`message-bubble ${msg.sender === identity ? 'sent' : 'received'}`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        {msg.image_url && (
                            <div className="message-image">
                                <img src={msg.image_url} alt="Sent attachment" onClick={() => window.open(msg.image_url, '_blank')} />
                            </div>
                        )}
                        {msg.content && <p>{msg.content}</p>}
                        <span className="timestamp">
                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                    </motion.div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSendMessage} className="message-input-area">
                {previewUrl && (
                    <div className="image-preview-container">
                        <img src={previewUrl} alt="Preview" />
                        <button type="button" onClick={cancelImage} className="cancel-image-btn">
                            <X size={16} />
                        </button>
                    </div>
                )}

                <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                />

                <button
                    type="button"
                    className="attach-btn"
                    onClick={() => fileInputRef.current?.click()}
                >
                    <ImageIcon size={20} />
                </button>

                <button
                    type="button"
                    className="attach-btn"
                    onClick={startCamera}
                >
                    <Camera size={20} />
                </button>

                <input
                    type="text"
                    placeholder="Tulis pesan..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    disabled={isUploading}
                />
                <button type="submit" disabled={(!newMessage.trim() && !selectedImage) || isUploading}>
                    <Send size={20} />
                </button>
            </form>

            <AnimatePresence>
                {/* Camera Modal */}
                {isCameraOpen && (
                    <motion.div
                        className="camera-modal"
                        initial={{ opacity: 0, y: 100 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 100 }}
                    >
                        <div className="camera-view">
                            <video ref={videoRef} autoPlay playsInline muted />
                            <div className="camera-controls">
                                <button type="button" onClick={stopCamera} className="camera-btn close">
                                    <X size={24} />
                                </button>
                                <button type="button" onClick={capturePhoto} className="camera-btn capture">
                                    <div className="capture-inner"></div>
                                </button>
                                <button type="button" onClick={switchCamera} className="camera-btn switch">
                                    <RefreshCw size={24} />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}


            </AnimatePresence>
        </div>
    );
};

export default Chat;
