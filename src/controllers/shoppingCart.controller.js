/**
 * Check each method in the shopping cart controller and add code to implement
 * the functionality or fix any bug.
 * The static methods and their function include:
 * - generateUniqueCart - To generate a unique cart id
 * - addItemToCart - To add new product to the cart
 * - getCart - method to get list of items in a cart
 * - updateCartItem - Update the quantity of a product in the shopping cart
 * - emptyCart - should be able to clear shopping cart
 * - removeItemFromCart - should delete a product from the shopping cart
 * - createOrder - Create an order
 * - getCustomerOrders - get all orders of a customer
 * - getOrderSummary - get the details of an order
 * - processStripePayment - process stripe payment
 *  NB: Check the BACKEND CHALLENGE TEMPLATE DOCUMENTATION in the readme of this repository to see our recommended
 *  endpoints, request body/param, and response object for each of these method
 */
import {
  Product,
  ShoppingCart,
  Shipping,
  Tax,
  Order,
  Customer,
  OrderDetail,
  sequelize,
} from '../database/models';

require('dotenv').config();
const uuid = require('uuid/v4');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const nodemailer = require('nodemailer');
const hbs = require('nodemailer-express-handlebars');

const smtpTransport = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: process.env.MAILER_EMAIL_ID,
    pass: process.env.MAILER_EMAIL_PASSWORD,
  },
});

const handlebarsOptions = {
  viewEngine: {
    extName: '.handlebars',
    partialsDir: `${__dirname}/../views/`,
    layoutsDir: `${__dirname}/../views/layouts/`,
    defaultLayout: 'main',
  },
  viewPath: `${__dirname}/../views/`,
  extName: '.handlebars',
};

smtpTransport.use('compile', hbs(handlebarsOptions));

/**
 *
 *
 * @class shoppingCartController
 */
class ShoppingCartController {
  /**
   * generate random unique id for cart identifier
   *
   * @static
   * @param {obj} req express request object
   * @param {obj} res express response object
   * @returns {json} returns json response with cart_id
   * @memberof shoppingCartController
   */
  static generateUniqueCart(req, res) {
    // implement method to generate unique cart Id
    const card_id = uuid(); //eslint-disable-line
    return res.status(200).json({ card_id: card_id.replace(/-/g, '') });
  }

  /**
   * adds item to a cart with cart_id
   *
   * @static
   * @param {obj} req express request object
   * @param {obj} res express response object
   * @returns {json} returns json response with cart
   * @memberof ShoppingCartController
   */
  static async addItemToCart(req, res, next) {
    // implement function to add item to cart
    const { product_id } = req.body; //eslint-disable-line
    try {
      const product = await Product.findOne({ where: { product_id } });
      if (product) {
        return ShoppingCart.create({ ...req.body })
          .then(savedProduct => {
            const { buy_now, added_on, ...returnedData } = savedProduct.dataValues; //eslint-disable-line
            return res.status(201).json(returnedData);
          })
          .catch(error => {
            return next(error);
          });
      }
      return res.status(404).json({
        error: {
          status: 404,
          message: `Product with id ${product_id} does not exist`, //eslint-disable-line
        },
      });
    } catch (err) {
      return next(err);
    }
  }

  /**
   * get shopping cart using the cart_id
   *
   * @static
   * @param {obj} req express request object
   * @param {obj} res express response object
   * @returns {json} returns json response with cart
   * @memberof ShoppingCartController
   */
  static async getCart(req, res, next) {
    // implement method to get cart items
    const { cart_id } = req.params; //eslint-disable-line
    try {
      const items = await ShoppingCart.findAll({
        include: [
          {
            model: Product,
            attributes: ['name', 'image', 'price', 'discounted_price'],
          },
        ],
        where: {
          cart_id,
        },
        attributes: {
          exclude: ['buy_now', 'added_on'],
        },
      });
      items.forEach(
        // eslint-disable-next-line no-return-assign
        item =>
          // eslint-disable-next-line no-param-reassign
          (item.subtotal = item.discounted_price
            ? item.discounted_price * item.quantity
            : item.price * item.quantity)
      );
      return res.status(200).json(items);
    } catch (err) {
      return next(err);
    }
  }

  /**
   * update cart item quantity using the item_id in the request param
   *
   * @static
   * @param {obj} req express request object
   * @param {obj} res express response object
   * @returns {json} returns json response with cart
   * @memberof ShoppingCartController
   */
  static async updateCartItem(req, res, next) {
    const { item_id } = req.params; // eslint-disable-line
    try {
      const item = await ShoppingCart.findByPk(item_id);
      if (item) {
        const updatedItem = await item.update({ quantity: req.body.quantity });
        const { buy_now, added_on, ...returnedData } = updatedItem.dataValues; //eslint-disable-line
        return res.status(200).json(returnedData);
      }
      return res.status(404).json({
        error: {
          status: 404,
          message: `Item with item id ${item_id} does not exist`, //eslint-disable-line
        },
      });
    } catch (err) {
      return next(err);
    }
  }

  /**
   * removes all items in a cart
   *
   * @static
   * @param {obj} req express request object
   * @param {obj} res express response object
   * @returns {json} returns json response with cart
   * @memberof ShoppingCartController
   */
  static async emptyCart(req, res, next) {
    // implement method to empty cart
    const { cart_id } = req.params; //eslint-disable-line
    try {
      const deletedRows = await ShoppingCart.destroy({
        where: { cart_id },
      });
      if (deletedRows > 0) {
        return res.status(200).json([]);
      }
      return res.status(404).json({
        error: {
          status: 404,
          message: `Cart with id ${cart_id} does not exist`, //eslint-disable-line
        },
      });
    } catch (err) {
      return next(err);
    }
  }

  /**
   * remove single item from cart
   * cart id is obtained from current session
   *
   * @static
   * @param {obj} req express request object
   * @param {obj} res express response object
   * @returns {json} returns json response with message
   * @memberof ShoppingCartController
   */
  static async removeItemFromCart(req, res, next) {
    const { item_id } = req.params; //eslint-disable-line
    try {
      // eslint-disable-next-line no-unused-vars
      const result = await ShoppingCart.destroy({
        where: { item_id },
      });
      if (result === 1) {
        return res.status(200).json({
          message: `Successfully deleted item with id ${item_id} from shopping cart`, //eslint-disable-line
        });
      }
      return res.status(404).json({
        error: {
          status: 404,
          message: `Item with id ${item_id} does not exist`, //eslint-disable-line
        },
      });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * create an order from a cart
   *
   * @static
   * @param {obj} req express request object
   * @param {obj} res express response object
   * @returns {json} returns json response with created order
   * @memberof ShoppingCartController
   */
  static async createOrder(req, res, next) {
    try {
      // implement code for creating order here
      const { customer_id } = req; //eslint-disable-line
      const { cart_id, shipping_id, tax_id } = req.body; //eslint-disable-line
      const cart = await ShoppingCart.findOne({
        where: { cart_id },
      });
      if (!cart) {
        return res.status(404).json({
          error: {
            status: 404,
            message: `Shopping cart with id ${cart_id} does not exist`, //eslint-disable-line
          },
        });
      }
      const shipping = Shipping.findByPk(shipping_id);
      if (!shipping) {
        return res.status(404).json({
          error: {
            status: 404,
            message: `Shipping with id ${shipping_id} does not exist`, //eslint-disable-line
          },
        });
      }
      const tax = Tax.findByPk(tax_id);
      if (!tax) {
        return res.status(404).json({
          error: {
            status: 404,
            message: `Tax with id ${tax_id} does not exist`, //eslint-disable-line
          },
        });
      }
      const order = await sequelize.query(
        'CALL shopping_cart_create_order (:cart_id, :customer_id, :shipping_id, :tax_id)',
        {
          replacements: { cart_id, customer_id, shipping_id, tax_id },
        }
      );
      if (order && order.length === 1) {
        return res.status(201).json({ order_id: order[0].orderId });
      }
      return res.status(500).json({
        error: {
          status: 500,
          message: `Cannot create a new order`,
        },
      });
    } catch (error) {
      return next(error);
    }
  }

  /**
   *
   *
   * @static
   * @param {obj} req express request object
   * @param {obj} res express response object
   * @returns {json} returns json response with customer's orders
   * @memberof ShoppingCartController
   */
  static async getCustomerOrders(req, res, next) {
    const { customer_id } = req;  // eslint-disable-line
    try {
      // implement code to get customer order
      const orders = await sequelize.query('CALL orders_get_by_customer_id (:customer_id)', {
        replacements: { customer_id },
      });
      return res.status(200).json(orders);
    } catch (error) {
      return next(error);
    }
  }

  /**
   *
   *
   * @static
   * @param {obj} req express request object
   * @param {obj} res express response object
   * @returns {json} returns json response with order summary
   * @memberof ShoppingCartController
   */
  static async getOrderSummary(req, res, next) {
    const { order_id } = req.params;  // eslint-disable-line
    try {
      // write code to get order summary
      const order = await sequelize.query('CALL orders_get_order_short_details(:order_id)', {
        replacements: { order_id },
      });
      if (order) {
        return res.status(200).json(order);
      }
      return res.status(404).json({
        error: {
          status: 404,
          message: `Order with id ${order_id} does not exist`, //eslint-disable-line
        },
      });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * @static
   * @param {*} req
   * @param {*} res
   * @param {*} next
   */
  static async processStripePayment(req, res, next) {
    const { email, stripeToken, order_id } = req.body; // eslint-disable-line
    const { customer_id } = req;  // eslint-disable-line
    try {
      // implement code to process payment and send order confirmation email here
      const order = await Order.findByPk(order_id, {
        include: [
          {
            model: OrderDetail,
            as: 'orderItems',
            attributes: ['product_name', 'quantity', 'unit_cost'],
          },
        ],
      });
      if (!order) {
        return res.status(404).json({
          error: {
            status: 404,
            message: `Order with id ${order_id} does not exist`, //eslint-disable-line
          },
        });
      }
      order.dataValues.orderItems.forEach(item => item.subtotal = item.unit_cost * item.quantity); //eslint-disable-line
      const customer = await Customer.findByPk(customer_id);
      const stripeEmail = email || customer.email;
      const charge = await stripe.charges.create({
        amount: order.total_amount * 100, // conversion to cent
        currency: 'aud',
        source: stripeToken,
        description: `Charge for ${customer.name} at ${stripeEmail} for order ${order_id}`, //eslint-disable-line
      });
      const mailOptions = {
        to: stripeEmail,
        subject: 'Order Confirmation',
        template: 'confirmation',
        context: {
          name: customer.name,
          order: order.dataValues,
        },
      };
      return smtpTransport
        .sendMail(mailOptions)
        .then(() => {
          charge.billing_details = {
            address: {
              city: customer.city,
              country: customer.country,
              line1: customer.address_1,
              line2: customer.address_2,
              postal_code: customer.postal_code,
              state: customer.region,
            },
            email: customer.email,
            name: customer.name,
            phone: customer.day_phone,
          };
          // eslint-disable-next-line camelcase
          charge.order = order_id;
          return res.status(200).json(charge);
        })
        .catch(err => {
          console.log(err);
          return next(err);
        });
    } catch (error) {
      return next(error);
    }
  }
}

export default ShoppingCartController;
