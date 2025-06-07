const paystack = require("paystack-api")("sk_test_549091b01c339aacb7327a4b7225f5df25ed4fa3"); // Ensure you have Paystack secret key
const Order = require("../../models/Order");
const Cart = require("../../models/Cart");
const Product = require("../../models/Product");

const createOrder = async (req, res) => {
  try {
    const {
      userId,
      cartItems,
      addressInfo,
      orderStatus,
      paymentMethod,
      paymentStatus,
      totalAmount,
      orderDate,
      orderUpdateDate,
      cartId,
    } = req.body;

    // Prepare metadata for Paystack
    const metadata = {
      cartItems: cartItems.map((item) => ({
        productId: item.productId,
        title: item.title,
        price: item.price,
        quantity: item.quantity,
      })),
      addressInfo,
    };

    const order = new Order({
      userId,
      cartId,
      cartItems,
      addressInfo,
      orderStatus,
      paymentMethod,
      paymentStatus,
      totalAmount,
      orderDate,
      orderUpdateDate,
    });

    // Save the new order
    await order.save();

    // Paystack payment initialization
    const paystackData = {
      email: req.user.email, // Assuming user's email is available
      amount: totalAmount * 100, // Paystack requires amount in kobo
      metadata: metadata,
      callback_url: `https://ecommerce-orcin-alpha-94.vercel.app/shop/paystack-return`, // Update with your Paystack return URL
    };

    paystack.transaction.initialize(paystackData, (error, body) => {
      if (error) {
        return res.status(500).json({
          success: false,
          message: "Error initializing Paystack payment",
        });
      }

      const { authorization_url } = body.data;

      res.status(201).json({
        success: true,
        approvalURL: authorization_url,
        orderId: order._id,
      });
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      message: "Some error occurred!",
    });
  }
};

const capturePayment = async (req, res) => {
  try {
    const { orderId, reference } = req.body;

    let order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Verify Paystack transaction using the reference
    paystack.transaction.verify(reference, async (error, body) => {
      if (error) {
        return res.status(500).json({
          success: false,
          message: "Payment verification failed",
        });
      }

      const { status, amount } = body.data;

      // Check if payment was successful and amount matches
      if (status === "success" && amount / 100 === order.totalAmount) {
        order.paymentStatus = "paid";
        order.orderStatus = "confirmed";

        // Update product stock
        for (let item of order.cartItems) {
          let product = await Product.findById(item.productId);

          if (!product) {
            return res.status(404).json({
              success: false,
              message: `Not enough stock for this product ${product?.title}`,
            });
          }

          product.totalStock -= item.quantity;
          await product.save();
        }

        const getCartId = order.cartId;
        await Cart.findByIdAndDelete(getCartId); // Delete cart after order is confirmed

        await order.save();

        res.status(200).json({
          success: true,
          message: "Order confirmed",
          data: order,
        });
      } else {
        res.status(400).json({
          success: false,
          message: "Payment failed or amount mismatch",
        });
      }
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      message: "Some error occurred!",
    });
  }
};

const getAllOrdersByUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const orders = await Order.find({ userId });

    if (!orders.length) {
      return res.status(404).json({
        success: false,
        message: "No orders found!",
      });
    }

    res.status(200).json({
      success: true,
      data: orders,
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      message: "Some error occurred!",
    });
  }
};

const getOrderDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found!",
      });
    }

    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      message: "Some error occurred!",
    });
  }
};

// Export all functions in the same file
module.exports = {
  createOrder,
  capturePayment,
  getAllOrdersByUser,
  getOrderDetails,
};
