const Order = require('../models/order');
const Product = require('../models/product');
const User = require('../models/user');



exports.getMyOrders = async (req, res) => {
    try {
        const { userId, role } = req.userData;
        let orders;

        if (role === 'customer') {
            orders = await Order.find({ customer: userId }).sort({ createdAt: -1 });
        } else if (role === 'delivery_partner') {
            orders = await Order.find({ deliveryPartner: userId }).sort({ createdAt: -1 });
        } else {
            orders = [];
        }
        
        res.status(200).json(orders);
    } catch (error) {
        console.error('Error fetching my-orders:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.createOrder = async (req, res) => {
    try {
        const { products } = req.body; // Expects an array of { productId, quantity }
        const customerId = req.userData.userId;

        if (!products || products.length === 0) {
            return res.status(400).json({ message: 'Your cart is empty.' });
        }
        
        const productDetails = [];
        let totalPrice = 0;

        // --- FIX: Re-implementing the reliable validation and price calculation loop ---
        for (const item of products) {
            const product = await Product.findById(item.productId);
            if (!product) {
                // If any product is not found, stop immediately.
                return res.status(404).json({ message: `Product with ID ${item.productId} not found.` });
            }
            totalPrice += product.price * item.quantity;
            productDetails.push({ product: item.productId, quantity: item.quantity });
        }

        const newOrder = new Order({
            customer: customerId,
            products: productDetails,
            totalPrice: totalPrice, // Include the calculated total price
        });

        // Save the new order
        await newOrder.save();
        
        // --- FIX: Chain both populate calls to get all necessary data ---
        // 1. Populate customer details for the real-time event.
        // 2. Populate product details for the HTTP response.
        const populatedOrder = await newOrder.populate([
            { path: 'customer', select: 'username email' },
            { path: 'products.product', select: 'name price' }
        ]);

        // Emit the real-time event with the fully populated order
        const io = req.app.get('socketio');
        io.emit('new_order', populatedOrder);

        res.status(201).json(populatedOrder);
    } catch (error) {
        console.error('Error creating order:', error);
        res.status(500).json({ message: 'Server error while creating order.' });
    }
};

exports.getUnassignedOrders = async (req, res) => {
    try {
        const orders = await Order.find({ status: 'pending' })
            .populate('customer', 'username email')
            .populate('products.product', 'name price');
        res.status(200).json(orders);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch unassigned orders.', error: error.message });
    }
};

exports.acceptOrder = async (req, res) => {
    try {
        const { orderId } = req.params;
        const deliveryPartnerId = req.userData.userId;

        const updatedOrder = await Order.findOneAndUpdate(
            { _id: orderId, status: 'pending' },
            { deliveryPartner: deliveryPartnerId, status: 'accepted' },
            { new: true }
        ).populate('customer', 'username').populate('deliveryPartner', 'username');

        if (!updatedOrder) {
            return res.status(404).json({ message: 'Order not found or has already been accepted.' });
        }

        const io = req.app.get('socketio');
        
        io.emit('order_status_update', updatedOrder);
        
        io.emit('order_accepted', { orderId: updatedOrder._id });

        res.status(200).json(updatedOrder);
    } catch (error) {
        console.error('Error in acceptOrder:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.updateOrderStatus = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { status } = req.body;
        const deliveryPartnerId = req.userData.userId;

        const validStatuses = ['picked_up', 'on_the_way', 'delivered'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: 'Invalid status provided.' });
        }

        const updatedOrder = await Order.findOneAndUpdate(
            { _id: orderId, deliveryPartner: deliveryPartnerId },
            { status: status },
            { new: true }
        ).populate('customer', 'username').populate('deliveryPartner', 'username');

        if (!updatedOrder) {
            return res.status(404).json({ message: 'Order not found or you are not assigned to it.' });
        }
        
        const io = req.app.get('socketio');

        io.emit('order_status_update', updatedOrder);
        
        res.status(200).json(updatedOrder);
    } catch (error) {
        console.error('Error in updateOrderStatus:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.getCustomerOrders = async (req, res) => {
    try {
        const customerId = req.userData.userId;
        const orders = await Order.find({ customer: customerId })
            .populate('deliveryPartner', 'username')
            .populate('products.product')
            .sort({ createdAt: -1 });
        res.status(200).json(orders);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch customer orders.', error: error.message });
    }
};

exports.getDeliveryPartnerOrders = async (req, res) => {
    try {
        const deliveryPartnerId = req.userData.userId;
        const orders = await Order.find({ deliveryPartner: deliveryPartnerId })
            .populate('customer', 'username')
            .populate('products.product')
            .sort({ createdAt: -1 });
        res.status(200).json(orders);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch deliveries.', error: error.message });
    }
};

exports.getOrderById = async (req, res) => {
    try {
        const { orderId } = req.params;
        const order = await Order.findById(orderId)
            .populate('customer', 'username email')
            .populate('deliveryPartner', 'username email')
            .populate('products.product');

        if (!order) {
            return res.status(404).json({ message: 'Order not found.' });
        }
    
        res.status(200).json(order);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch order.', error: error.message });
    }
};

exports.getAllOrders = async (req, res) => {
    try {
        const orders = await Order.find({})
            .populate('customer', 'username email')
            .populate('deliveryPartner', 'username email')
            .sort({ createdAt: -1 });
        res.status(200).json(orders);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch all orders.', error: error.message });
    }
};