const Product = require('../models/product');

exports.getProducts = async (req, res) => {
    try {
        const count = await Product.countDocuments();
        if (count === 0) {
            await Product.insertMany([
                { name: 'Fresh Apples', description: 'Crisp and juicy', price: 2.50 },
                { name: 'Whole Milk', description: '1 Gallon, Grade A', price: 3.00 },
                { name: 'Sourdough Bread', description: 'Freshly baked loaf', price: 4.50 },
            ]);
        }
        const products = await Product.find({});
        res.status(200).json(products);
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ message: 'Server Error: Could not fetch products.' });
    }
};