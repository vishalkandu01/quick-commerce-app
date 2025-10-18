import { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../context/auth-context.js';
import api from '../api/apiService.js';
import { socket, connectSocket, disconnectSocket } from '../api/socketService.js';

const DeliveryDashboard = () => {
    const [unassignedOrders, setUnassignedOrders] = useState([]);
    const [myOrders, setMyOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const { token } = useContext(AuthContext);

    useEffect(() => {
        if (token) connectSocket(token);

        const fetchOrders = async () => {
            try {
                setLoading(true);
                const [unassignedRes, myOrdersRes] = await Promise.all([
                    api.get('/orders/unassigned'),
                    api.get('/orders/my-orders')
                ]);

                setUnassignedOrders(unassignedRes.data);
                setMyOrders(myOrdersRes.data);
                setError('');
            } catch (err) {
                setError('Failed to fetch orders.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchOrders();

        socket.on('new_order', (newOrder) => {
            setUnassignedOrders(prev => [newOrder, ...prev]);
        });

        socket.on('order_accepted', (acceptedOrder) => {
            setUnassignedOrders(prev => prev.filter(o => o._id !== acceptedOrder._id));
        });

        return () => {
            disconnectSocket();
            socket.off('new_order');
            socket.off('order_accepted');
        };
    }, [token]);

    const handleAcceptOrder = async (orderId) => {
        try {
            const response = await api.patch(`/orders/${orderId}/accept`);
            const acceptedOrder = response.data;
            setUnassignedOrders(prev => prev.filter(o => o._id !== orderId));
            setMyOrders(prev => [...prev, acceptedOrder]);
        } catch (err) {
            setError('Failed to accept order. It might have already been taken.');
            console.error(err);
        }
    };

    if (loading) return <p style={styles.loading}>Loading orders...</p>;
    if (error) return <p style={styles.error}>{error}</p>;

    return (
        <div style={styles.container}>
            <h2 style={styles.pageTitle}>Delivery Partner Dashboard</h2>

            <section style={styles.section}>
                <h3 style={styles.sectionTitle}>My Active Orders</h3>
                {myOrders.length === 0 ? (
                    <p style={styles.infoText}>You have no active orders.</p>
                ) : (
                    <div style={styles.orderList}>
                        {myOrders.map(order => (
                            <div key={order._id} style={styles.orderCard}>
                                <span>Order ID: {order._id}</span>
                                <span style={{...styles.statusBadge, ...statusColor(order.status)}}>{order.status}</span>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            <section style={styles.section}>
                <h3 style={styles.sectionTitle}>Available Orders</h3>
                {unassignedOrders.length === 0 ? (
                    <p style={styles.infoText}>No available orders at the moment.</p>
                ) : (
                    <div style={styles.orderList}>
                        {unassignedOrders.map(order => (
                            <div key={order._id} style={styles.orderCard}>
                                <div>
                                    Order ID: {order._id} - Placed by: {order.customer?.username || 'N/A'}
                                </div>
                                <button style={styles.button} onClick={() => handleAcceptOrder(order._id)}>
                                    Accept Order
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
};

// Status badge colors
const statusColor = (status) => {
    switch (status.toLowerCase()) {
        case 'delivered': return { backgroundColor: '#10b981', color: 'white' };
        case 'pending': return { backgroundColor: '#facc15', color: '#1f2937' };
        case 'canceled': return { backgroundColor: '#ef4444', color: 'white' };
        default: return { backgroundColor: '#6b7280', color: 'white' };
    }
};

const styles = {
    container: {
        padding: '2rem',
        fontFamily: "'Inter', sans-serif",
        backgroundColor: '#f9fafb',
        minHeight: '100vh',
    },
    pageTitle: {
        textAlign: 'center',
        fontSize: '2rem',
        fontWeight: '600',
        marginBottom: '2rem',
        color: '#111827',
    },
    section: {
        marginBottom: '2rem',
        backgroundColor: '#ffffff',
        padding: '1.5rem',
        borderRadius: '12px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
    },
    sectionTitle: {
        fontSize: '1.2rem',
        fontWeight: '500',
        marginBottom: '1rem',
        color: '#1f2937',
    },
    orderList: {
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
    },
    orderCard: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0.75rem 1rem',
        borderRadius: '8px',
        backgroundColor: '#f3f4f6',
        boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
    },
    button: {
        padding: '0.4rem 0.8rem',
        border: 'none',
        borderRadius: '6px',
        backgroundColor: '#2563eb',
        color: 'white',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'background-color 0.2s',
    },
    statusBadge: {
        padding: '0.2rem 0.5rem',
        borderRadius: '6px',
        fontWeight: '600',
        textTransform: 'capitalize',
    },
    error: {
        color: 'red',
        textAlign: 'center',
        marginBottom: '1rem',
    },
    infoText: {
        color: '#6b7280',
    },
    loading: {
        textAlign: 'center',
        marginTop: '2rem',
    },
};

export default DeliveryDashboard;