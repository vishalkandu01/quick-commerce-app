const Order = require('../models/order');
const User = require('../models/user');

exports.getSystemStats = async (req, res) => {
    try {
        const allOrders = await Order.find({})
            .populate('customer', 'username email')
            .populate('deliveryPartner', 'username email')
            .sort({ createdAt: -1 });

        const deliveryPartners = await User.find({ role: 'delivery_partner' }, '-password'); 
        
        res.status(200).json({
            orders: allOrders,
            deliveryPartners: deliveryPartners, 
        });
    } catch (error) {
        console.error('Error fetching admin stats:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

