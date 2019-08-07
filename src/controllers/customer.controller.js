/**
 * Customer controller handles all requests that has to do with customer
 * Some methods needs to be implemented from scratch while others may contain one or two bugs
 * - create - allow customers to create a new account
 * - login - allow customers to login to their account
 * - getCustomerProfile - allow customers to view their profile info
 * - updateCustomerProfile - allow customers to update their profile info like name, email, password, day_phone, eve_phone and mob_phone
 * - updateCustomerAddress - allow customers to update their address info
 * - updateCreditCard - allow customers to update their credit card number
 *  NB: Check the BACKEND CHALLENGE TEMPLATE DOCUMENTATION in the readme of this repository to see our recommended
 *  endpoints, request body/param, and response object for each of these method
 */
import { Customer, Sequelize } from '../database/models';
import jwt from '../utils/jwt';

const Op = Sequelize.Op;

/**
 *
 *
 * @class CustomerController
 */
class CustomerController {
  /**
   * create a customer record
   *
   * @static
   * @param {object} req express request object
   * @param {object} res express response object
   * @param {object} next next middleware
   * @returns {json} json object with status, customer data and access token
   * @memberof CustomerController
   */
  // eslint-disable-next-line consistent-return
  static async create(req, res, next) {
    // Implement the function to create the customer account
    const { name, email, password } = req.body;
    if (!email) {
      return next({
        status: 400,
        code: 'USR_02',
        message: 'The field is required',
        field: 'email',
      });
    }
    if (!password) {
      return next({
        status: 400,
        code: 'USR_02',
        message: 'The field is required',
        field: 'password',
      });
    }
    try {
      let customer = await Customer.findOne({ where: { email } });
      if (customer) {
        return next({
          status: 400,
          code: 'USR_04',
          message: 'The email already exists',
          field: 'email',
        });
      }
      customer = Customer.build({ ...req.body });
      const duration = '24h';
      return jwt.sign({ customer_id: customer.customer_id }, duration, (err, token) => {
        if (!err) {
          return customer
            .save()
            .then(() => {
              return res.status(201).json({
                customer: customer.getSafeDataValues(),
                accessToken: token,
                expiresIn: duration,
              });
            })
            .catch(error => {
              return next(error);
            });
        }
        return next(err);
      });
    } catch (err) {
      return next(err);
    }
  }

  /**
   * log in a customer
   *
   * @static
   * @param {object} req express request object
   * @param {object} res express response object
   * @param {object} next next middleware
   * @returns {json} json object with status, and access token
   * @memberof CustomerController
   */
  static async login(req, res, next) {
    // implement function to login to user account
    const { email, password } = req.body;
    if (!email) {
      return next({
        status: 400,
        code: 'USR_02',
        message: 'The field is required',
        field: 'email',
      });
    }
    if (!password) {
      return next({
        status: 400,
        code: 'USR_02',
        message: 'The field is required',
        field: 'password',
      });
    }
    try {
      const customer = await Customer.findOne({ where: { email } });
      if (customer) {
        const match = await customer.validatePassword(password);
        if (match) {
          const duration = '24h';
          return jwt.sign({ customer_id: customer.customer_id }, duration, (err, token) => {
            if (!err) {
              return res.status(200).json({
                customer: customer.getSafeDataValues(),
                accessToken: token,
                expiresIn: duration,
              });
            }
            return next(err);
          });
        }
        return next({
          status: 400,
          code: 'USR_01',
          message: 'Email or Password is invalid',
        });
      }
      return next({
        status: 400,
        code: 'USR_05',
        message: "The email doesn't exist",
        field: 'password',
      });
    } catch (err) {
      return next(err);
    }
  }

  /**
   * get customer profile data
   *
   * @static
   * @param {object} req express request object
   * @param {object} res express response object
   * @param {object} next next middleware
   * @returns {json} json object with status customer profile data
   * @memberof CustomerController
   */
  static async getCustomerProfile(req, res, next) {
    // eslint-disable-next-line camelcase
    const { customer_id } = req;
    try {
      const customer = await Customer.findByPk(customer_id);
      return res.status(200).json({
        customer: customer.getSafeDataValues(),
      });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * update customer profile data such as name, email, password, day_phone, eve_phone and mob_phone
   *
   * @static
   * @param {object} req express request object
   * @param {object} res express response object
   * @param {object} next next middleware
   * @returns {json} json object with status customer profile data
   * @memberof CustomerController
   */
  // eslint-disable-next-line consistent-return
  static async updateCustomerProfile(req, res, next) {
    // Implement function to update customer profile like name, day_phone, eve_phone and mob_phone
    // eslint-disable-next-line camelcase
    const { customer_id } = req;
    const { email } = req.body;
    try {
      const customer = await Customer.findByPk(customer_id);
      if (email === customer.email) {
        return customer
          .update({ ...req.body })
          .then(updatedCustomer => {
            return res.status(200).json(updatedCustomer.getSafeDataValues());
          })
          .catch(error => {
            return next(error);
          });
      }
      const customerWithSameEmail = await Customer.findOne({ where: { email } });
      if (customerWithSameEmail) {
        return next({
          status: 400,
          code: 'USR_04',
          message: 'The email already exists',
          field: 'email',
        });
      } else {
        return customer
          .update({ ...req.body })
          .then(updatedCustomer => {
            return res.status(200).json(updatedCustomer.getSafeDataValues());
          })
          .catch(error => {
            return next(error);
          });
      }
    } catch (err) {
      return next(err);
    }
  }

  /**
   * update customer profile data such as address_1, address_2, city, region, postal_code, country and shipping_region_id
   *
   * @static
   * @param {object} req express request object
   * @param {object} res express response object
   * @param {object} next next middleware
   * @returns {json} json object with status customer profile data
   * @memberof CustomerController
   */
  // eslint-disable-next-line consistent-return
  static async updateCustomerAddress(req, res, next) {
    // write code to update customer address info such as address_1, address_2, city, region, postal_code, country
    // and shipping_region_id
    // eslint-disable-next-line camelcase
    const { customer_id } = req;
    try {
      const customer = await Customer.findByPk(customer_id);
      return customer
        .update({ ...req.body })
        .then(updatedCustomer => {
          return res.status(200).json(updatedCustomer.getSafeDataValues());
        })
        .catch(error => {
          return next(error);
        });
    } catch (err) {
      return next(err);
    }
  }

  /**
   * update customer credit card
   *
   * @static
   * @param {object} req express request object
   * @param {object} res express response object
   * @param {object} next next middleware
   * @returns {json} json object with status customer profile data
   * @memberof CustomerController
   */
  static async updateCreditCard(req, res, next) {
    // write code to update customer credit card number
    // eslint-disable-next-line camelcase
    const { customer_id } = req;
    try {
      const customer = await Customer.findByPk(customer_id);
      return customer
        .update({ credit_card: req.body.credit_card })
        .then(updatedCustomer => {
          const hiddenCreditCard = updatedCustomer.credit_card.replace(/.(?=.{4,}$)/g, 'x');
          return res.status(200).json({
            ...updatedCustomer.getSafeDataValues(),
            credit_card: `${updatedCustomer.credit_card}, (${hiddenCreditCard})`,
          });
        })
        .catch(error => {
          return next(error);
        });
    } catch (err) {
      return next(err);
    }
  }
}

export default CustomerController;
