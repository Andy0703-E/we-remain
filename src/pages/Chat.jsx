import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, ArrowLeft, User, Heart } from 'lucide-react';
import { supabase } from '../supabase';
import './Chat.css';

const Chat = () => {
    const navigate = useNavigate();
    const [identity, setIdentity] = useState(localStorage.getItem('chatIdentity') || null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef(null);

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
                            icon: '/src/assets/heart-cursor.svg' // Revert to using the heart icon for notification
                        });
                    }
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

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !identity) return;

        const { error } = await supabase
            .from('messages')
            .insert([{ sender: identity, content: newMessage }]);

        if (error) {
            console.error('Error sending message:', error);
        } else {
            setNewMessage('');
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
                        <p>{msg.content}</p>
                        <span className="timestamp">
                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                    </motion.div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSendMessage} className="message-input-area">
                <input
                    type="text"
                    placeholder="Tulis pesan..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                />
                <button type="submit" disabled={!newMessage.trim()}>
                    <Send size={20} />
                </button>
            </form>
        </div>
    );
};

export default Chat;
