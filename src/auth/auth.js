import jwt from '../utils/jwt';
import { Customer } from '../database/models';

module.exports = (req, res, next) => {
  const header = req.headers['USER-KEY'];
  if (!header) {
    next({
      status: 403,
      code: 'AUT_01',
      message: 'Authorization code is empty',
    });
  } else if (!header.startsWith('Bearer ')) {
    next({
      status: 403,
      code: 'AUT_02',
      message: 'Access Unauthorized',
    });
  } else {
    const token = header.substring(7);
    jwt.verify(token, (err, decoded) => {
      if (!err) {
        // eslint-disable-next-line camelcase
        const { customer_id } = decoded.customer_id;
        return Customer.findOne({ where: { customer_id } })
          .then(customer => {
            if (customer) {
              // eslint-disable-next-line camelcase
              req.customer_id = customer_id;
            } else {
              next({
                status: 403,
                code: 'AUT_02',
                message: 'Access Unauthorized',
              });
            }
          }).catch(error => {
            next(error);
          });
      }
    });
  }
};
