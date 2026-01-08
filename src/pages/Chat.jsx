import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, ArrowLeft, User, Heart, Image as ImageIcon, X, Camera, RefreshCw, Video, Phone, Mic, MicOff, VideoOff, PhoneOff } from 'lucide-react';

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

    // Video Call State
    const [callStatus, setCallStatus] = useState('idle'); // idle, calling, receiving, connected
    const [incomingCall, setIncomingCall] = useState(null);
    const [localStream, setLocalStream] = useState(null);
    const [remoteStream, setRemoteStream] = useState(null);
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);

    const fileInputRef = useRef(null);
    const messagesEndRef = useRef(null);
    const videoRef = useRef(null);
    const cameraStreamRef = useRef(null);

    // WebRTC Refs
    const peerConnectionRef = useRef(null);
    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);

    const rtcConfig = {
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' }
        ]
    };

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
            // Signaling for Video Call
            .on('broadcast', { event: 'call-signal' }, ({ payload }) => {
                if (payload.target === identity && payload.from !== identity) {
                    handleSignalingData(payload);
                }
            })
            .subscribe();

        return () => {
            supabase.removeChannel(subscription);
        };
    }, [navigate]);

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
            streamRef.current = stream;
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
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        setIsCameraOpen(false);
    };

    const switchCamera = () => {
        setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
        // Effect will re-trigger stream update if we add facingMode dependency or restart manually
        // For simplicity, let's stop and restart
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
        }
        setTimeout(() => {
            navigator.mediaDevices.getUserMedia({
                video: { facingMode: facingMode === 'user' ? 'environment' : 'user' }
            }).then(stream => {
                streamRef.current = stream;
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

    // --- Video Call Logic ---
    const sendSignal = async (type, data, targetUser) => {
        await supabase.channel('public:messages').send({
            type: 'broadcast',
            event: 'call-signal',
            payload: { type, data, from: identity, target: targetUser }
        });
    };

    const handleSignalingData = async (payload) => {
        const { type, data, from } = payload;

        switch (type) {
            case 'offer':
                setIncomingCall({ from, offer: data });
                setCallStatus('receiving');
                break;
            case 'answer':
                if (peerConnectionRef.current) {
                    await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(data));
                }
                break;
            case 'ice-candidate':
                if (peerConnectionRef.current) {
                    try {
                        await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(data));
                    } catch (e) {
                        console.error('Error adding received ice candidate', e);
                    }
                }
                break;
            case 'end-call':
                endCall(false);
                break;
            default:
                break;
        }
    };

    const startCall = async () => {
        const targetUser = identity === 'Agung' ? 'Esthy' : 'Agung';
        setCallStatus('calling');

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            setLocalStream(stream);

            const pc = new RTCPeerConnection(rtcConfig);
            peerConnectionRef.current = pc;

            stream.getTracks().forEach(track => pc.addTrack(track, stream));

            pc.onicecandidate = (event) => {
                if (event.candidate) {
                    sendSignal('ice-candidate', event.candidate, targetUser);
                }
            };

            pc.ontrack = (event) => {
                setRemoteStream(event.streams[0]);
            };

            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);

            sendSignal('offer', offer, targetUser);
        } catch (err) {
            console.error("Error starting call:", err);
            alert("Gagal memulai panggilan video.");
            setCallStatus('idle');
        }
    };

    const acceptCall = async () => {
        if (!incomingCall) return;
        setCallStatus('connected');

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            setLocalStream(stream);

            const pc = new RTCPeerConnection(rtcConfig);
            peerConnectionRef.current = pc;

            stream.getTracks().forEach(track => pc.addTrack(track, stream));

            pc.onicecandidate = (event) => {
                if (event.candidate) {
                    sendSignal('ice-candidate', event.candidate, incomingCall.from);
                }
            };

            pc.ontrack = (event) => {
                setRemoteStream(event.streams[0]);
            };

            await pc.setRemoteDescription(new RTCSessionDescription(incomingCall.offer));

            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);

            sendSignal('answer', answer, incomingCall.from);
        } catch (err) {
            console.error("Error accepting call:", err);
            endCall();
        }
    };

    const endCall = (signal = true) => {
        if (signal && (callStatus === 'connected' || callStatus === 'calling' || callStatus === 'receiving')) {
            const target = incomingCall ? incomingCall.from : (identity === 'Agung' ? 'Esthy' : 'Agung');
            sendSignal('end-call', null, target);
        }

        if (localStream) {
            localStream.getTracks().forEach(track => track.stop());
            setLocalStream(null);
        }
        if (peerConnectionRef.current) {
            peerConnectionRef.current.close();
            peerConnectionRef.current = null;
        }
        setRemoteStream(null);
        setCallStatus('idle');
        setIncomingCall(null);
        setIsMuted(false);
        setIsVideoOff(false);
    };

    const toggleAudio = () => {
        if (localStream) {
            localStream.getAudioTracks().forEach(track => track.enabled = !track.enabled);
            setIsMuted(!isMuted);
        }
    };

    const toggleVideo = () => {
        if (localStream) {
            localStream.getVideoTracks().forEach(track => track.enabled = !track.enabled);
            setIsVideoOff(!isVideoOff);
        }
    };

    useEffect(() => {
        if (localVideoRef.current && localStream) {
            localVideoRef.current.srcObject = localStream;
        }
    }, [localStream, callStatus]);

    useEffect(() => {
        if (remoteVideoRef.current && remoteStream) {
            remoteVideoRef.current.srcObject = remoteStream;
        }
    }, [remoteStream, callStatus]);

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
                <button
                    className="video-call-btn"
                    onClick={startCall}
                    disabled={callStatus !== 'idle'}
                    style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent)' }}
                >
                    <Video size={24} />
                </button>
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

                {/* Incoming Call Modal */}
                {callStatus === 'receiving' && incomingCall && (
                    <motion.div
                        className="call-modal incoming"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                    >
                        <div className="call-avatar">
                            <User size={64} />
                        </div>
                        <h3>Masuk Panggilan Video...</h3>
                        <p>{incomingCall.from}</p>
                        <div className="call-actions">
                            <button onClick={() => endCall(true)} className="call-btn reject">
                                <PhoneOff size={24} />
                            </button>
                            <button onClick={acceptCall} className="call-btn accept">
                                <Phone size={24} />
                            </button>
                        </div>
                    </motion.div>
                )}

                {/* Active Call Modal */}
                {callStatus === 'connected' && (
                    <motion.div
                        className="call-modal active"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <div className="remote-video-container">
                            <video ref={remoteVideoRef} autoPlay playsInline className="remote-video" />
                        </div>
                        <div className="local-video-container">
                            <video ref={localVideoRef} autoPlay playsInline muted className="local-video" />
                        </div>

                        <div className="call-controls">
                            <button onClick={toggleAudio} className={`control-btn ${isMuted ? 'off' : ''}`}>
                                {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
                            </button>
                            <button onClick={() => endCall(true)} className="control-btn end">
                                <PhoneOff size={24} />
                            </button>
                            <button onClick={toggleVideo} className={`control-btn ${isVideoOff ? 'off' : ''}`}>
                                {isVideoOff ? <VideoOff size={24} /> : <Video size={24} />}
                            </button>
                        </div>
                    </motion.div>
                )}

                {/* Calling State */}
                {callStatus === 'calling' && (
                    <motion.div
                        className="call-modal calling"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <div className="call-avatar pulsing">
                            <User size={64} />
                        </div>
                        <h3>Memanggil...</h3>
                        <button onClick={() => endCall(true)} className="call-btn reject">
                            <PhoneOff size={24} />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Chat;
