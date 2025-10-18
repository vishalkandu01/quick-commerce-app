const express = require('express');
const { createOrder, getUnassignedOrders, acceptOrder, getMyOrders } = require('../controllers/orderController');
const { authMiddleware, roleMiddleware } = require('../middleware/authMiddleware');
const router = express.Router();


router.get('/my-orders', authMiddleware, getMyOrders);
router.post('/', authMiddleware, roleMiddleware(['customer']), createOrder);
router.get('/unassigned', authMiddleware, roleMiddleware(['delivery_partner']), getUnassignedOrders);
router.patch('/:orderId/accept', authMiddleware, roleMiddleware(['delivery_partner']), acceptOrder);

module.exports = router;