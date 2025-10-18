const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    customer: { 
        type: mongoose.Schema.Types.ObjectId, ref: 'User', 
        required: true 
    },
    deliveryPartner: { 
        type: mongoose.Schema.Types.ObjectId, ref: 'User', 
        default: null 
    },
    products: [{
        product: { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: 'Product' 
        },
        quantity: { 
            type: Number, 
            default: 1 
        }
    }],
    status: {
        type: String,
        enum: ['pending', 'accepted', 'picked_up', 'on_the_way', 'delivered', 'cancelled'],
        default: 'pending'
    },
    totalPrice: { 
        type: Number, 
        required: true 
    }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);