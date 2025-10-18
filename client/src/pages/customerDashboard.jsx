import { useState, useEffect, useContext } from 'react';
import api from '../api/apiService.js';
import { AuthContext } from '../context/auth-context.js';
import { socket, connectSocket, disconnectSocket } from '../api/socketService.js';

const CustomerDashboard = () => {
    const [products, setProducts] = useState([]);
    const [cart, setCart] = useState([]);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const { token } = useContext(AuthContext);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const [productsRes, ordersRes] = await Promise.all([
                    api.get('/products'),
                    api.get('/orders/my-orders')
                ]);
                setProducts(productsRes.data);
                setOrders(ordersRes.data);
            } catch (err) {
                setError('Failed to fetch data.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    useEffect(() => {
        if (token) connectSocket(token);

        if (orders.length > 0) {
            orders.forEach(order => {
                socket.emit('join_order_room', order._id);
            });
        }

        socket.on('order_status_update', (updatedOrder) => {
            setOrders(prevOrders =>
                prevOrders.map(order =>
                    order._id === updatedOrder._id ? updatedOrder : order
                )
            );
        });

        return () => {
            disconnectSocket();
            socket.off('order_status_update');
        };
    }, [token, orders]);

    const handleAddToCart = (product) => {
        const existingItem = cart.find(item => item.productId === product._id);
        if (existingItem) {
            setCart(cart.map(item =>
                item.productId === product._id ? { ...item, quantity: item.quantity + 1 } : item
            ));
        } else {
            setCart([...cart, { productId: product._id, name: product.name, quantity: 1 }]);
        }
    };

    const handlePlaceOrder = async () => {
        if (cart.length === 0) return setError('Your cart is empty.');
        try {
            const orderPayload = { products: cart.map(({ productId, quantity }) => ({ productId, quantity })) };
            const response = await api.post('/orders', orderPayload);
            const newOrder = response.data;
            setOrders(prev => [newOrder, ...prev]);
            setCart([]);
            setError('');
        } catch (err) {
            setError('Failed to place order.');
            console.error(err);
        }
    };

    if (loading) return <p style={styles.loading}>Loading dashboard...</p>;

    return (
        <div style={styles.container}>
            <h2 style={styles.pageTitle}>Customer Dashboard</h2>
            {error && <p style={styles.error}>{error}</p>}

            <section style={styles.section}>
                <h3 style={styles.sectionTitle}>Available Products</h3>
                <div style={styles.productsGrid}>
                    {products.map(product => (
                        <div key={product._id} style={styles.productCard}>
                            <h4 style={styles.productName}>{product.name}</h4>
                            <p style={styles.productPrice}>${product.price.toFixed(2)}</p>
                            <button style={styles.button} onClick={() => handleAddToCart(product)}>Add to Cart</button>
                        </div>
                    ))}
                </div>
            </section>

            <section style={styles.section}>
                <h3 style={styles.sectionTitle}>My Cart</h3>
                {cart.length === 0 ? <p style={styles.infoText}>Your cart is empty.</p> : (
                    <div style={styles.cartBox}>
                        {cart.map(item => (
                            <div key={item.productId} style={styles.cartItem}>
                                <span>{item.name}</span>
                                <span>Qty: {item.quantity}</span>
                            </div>
                        ))}
                        <button style={{...styles.button, marginTop: '1rem'}} onClick={handlePlaceOrder} disabled={cart.length === 0}>Place Order</button>
                    </div>
                )}
            </section>

            <section style={styles.section}>
                <h3 style={styles.sectionTitle}>My Orders</h3>
                {orders.length === 0 ? <p style={styles.infoText}>You have no past orders.</p> : (
                    <div style={styles.ordersBox}>
                        {orders.map(order => (
                            <div key={order._id} style={styles.orderItem}>
                                <span>Order ID: {order._id}</span>
                                <span style={{...styles.statusBadge, ...statusColor(order.status)}}>{order.status}</span>
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
    error: {
        color: 'red',
        textAlign: 'center',
        marginBottom: '1rem',
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
    productsGrid: {
        display: 'flex',
        flexWrap: 'wrap',
        gap: '1rem',
    },
    productCard: {
        border: '1px solid #e5e7eb',
        borderRadius: '10px',
        padding: '1rem',
        width: '200px',
        textAlign: 'center',
        boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
        transition: 'transform 0.2s, box-shadow 0.2s',
        cursor: 'pointer',
    },
    productName: {
        fontWeight: '500',
        marginBottom: '0.5rem',
    },
    productPrice: {
        fontWeight: '600',
        marginBottom: '0.8rem',
        color: '#2563eb',
    },
    button: {
        padding: '0.5rem 1rem',
        border: 'none',
        borderRadius: '8px',
        backgroundColor: '#2563eb',
        color: '#ffffff',
        cursor: 'pointer',
        fontWeight: '600',
        transition: 'background-color 0.2s',
    },
    cartBox: {
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
        border: '1px solid #e5e7eb',
        padding: '1rem',
        borderRadius: '8px',
    },
    cartItem: {
        display: 'flex',
        justifyContent: 'space-between',
    },
    ordersBox: {
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
    },
    orderItem: {
        display: 'flex',
        justifyContent: 'space-between',
        padding: '0.5rem 1rem',
        borderRadius: '8px',
        backgroundColor: '#f3f4f6',
    },
    statusBadge: {
        padding: '0.2rem 0.5rem',
        borderRadius: '6px',
        fontWeight: '600',
        textTransform: 'capitalize',
    },
    infoText: {
        color: '#6b7280',
    },
    loading: {
        textAlign: 'center',
        marginTop: '2rem',
    },
};

export default CustomerDashboard;
