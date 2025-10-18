import { useState, useEffect, useContext } from 'react';
import api from '../api/apiService.js';
import { AuthContext } from '../context/auth-context.js';
import { socket, connectSocket, disconnectSocket } from '../api/socketService.js';

const AdminDashboard = () => {
    const { token } = useContext(AuthContext);
    const [orders, setOrders] = useState([]);
    const [deliveryPartners, setDeliveryPartners] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (token) connectSocket(token);

        socket.on('new_order', (newOrder) => {
            setOrders(prev => [newOrder, ...prev]);
        });
        socket.on('order_status_update', (updatedOrder) => {
            setOrders(prev =>
                prev.map(order => order._id === updatedOrder._id ? updatedOrder : order)
            );
        });

        return () => {
            disconnectSocket();
            socket.off('new_order');
            socket.off('order_status_update');
        };
    }, [token]);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                setLoading(true);
                const response = await api.get('/admin/stats');
                setOrders(response.data.orders);
                setDeliveryPartners(response.data.deliveryPartners);
            } catch (err) {
                setError('Failed to fetch system stats. You may not have admin privileges.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading) return <p style={{ textAlign: 'center' }}>Loading system statistics...</p>;
    if (error) return <p style={{ textAlign: 'center', color: 'red' }}>{error}</p>;

    return (
        <div style={styles.container}>
            <h2 style={styles.pageTitle}>Admin Dashboard</h2>

            <section style={styles.section}>
                <h3 style={styles.sectionTitle}>All Orders ({orders.length})</h3>
                <div style={styles.tableContainer}>
                    <table style={styles.table}>
                        <thead>
                            <tr>
                                <th style={styles.tableHeader}>Order ID</th>
                                <th style={styles.tableHeader}>Customer</th>
                                <th style={styles.tableHeader}>Delivery Partner</th>
                                <th style={styles.tableHeader}>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.map(order => (
                                <tr key={order._id} style={styles.tableRow}>
                                    <td style={styles.tableCell}>{order._id}</td>
                                    <td style={styles.tableCell}>{order.customer?.username || 'N/A'}</td>
                                    <td style={styles.tableCell}>{order.deliveryPartner?.username || 'Not Assigned'}</td>
                                    <td style={styles.tableCell}>{order.status}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>

            <section style={styles.section}>
                <h3 style={styles.sectionTitle}>All Delivery Partners ({deliveryPartners.length})</h3>
                <div style={styles.tableContainer}>
                    <table style={styles.table}>
                        <thead>
                            <tr>
                                <th style={styles.tableHeader}>User ID</th>
                                <th style={styles.tableHeader}>Username</th>
                                <th style={styles.tableHeader}>Email</th>
                                <th style={styles.tableHeader}>Role</th>
                            </tr>
                        </thead>
                        <tbody>
                            {deliveryPartners.map(partner => (
                                <tr key={partner._id} style={styles.tableRow}>
                                    <td style={styles.tableCell}>{partner._id}</td>
                                    <td style={styles.tableCell}>{partner.username}</td>
                                    <td style={styles.tableCell}>{partner.email}</td>
                                    <td style={styles.tableCell}>{partner.role}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
};

const styles = {
    container: {
        padding: '2rem',
        fontFamily: "'Inter', sans-serif",
        backgroundColor: '#f9fafb',
        minHeight: '100vh',
    },
    pageTitle: {
        fontSize: '2rem',
        fontWeight: '600',
        color: '#111827',
        marginBottom: '2rem',
        textAlign: 'center',
    },
    section: {
        marginBottom: '3rem',
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        padding: '1.5rem',
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
    },
    sectionTitle: {
        fontSize: '1.2rem',
        fontWeight: '500',
        marginBottom: '1rem',
        color: '#1f2937',
    },
    tableContainer: {
        overflowX: 'auto',
    },
    table: {
        width: '100%',
        borderCollapse: 'collapse',
    },
    tableHeader: {
        borderBottom: '2px solid #e5e7eb',
        padding: '0.75rem 1rem',
        textAlign: 'left',
        backgroundColor: '#f3f4f6',
        color: '#374151',
        fontWeight: '600',
    },
    tableCell: {
        padding: '0.75rem 1rem',
        borderBottom: '1px solid #e5e7eb',
        color: '#1f2937',
    },
    tableRow: {
        transition: 'background-color 0.2s',
        cursor: 'default',
    },
};

export default AdminDashboard;