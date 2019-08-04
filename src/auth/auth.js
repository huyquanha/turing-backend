import jwt from '../utils/jwt';
import { Customer } from '../database/models';

// eslint-disable-next-line consistent-return
module.exports = (req, res, next) => {
  const header = req.headers['user-key'];
  if (!header) {
    // return an error response immediately without going to next() middleware
    return res.status(401).json({
      status: 401,
      code: 'AUT_01',
      message: 'Authorization code is empty',
    });
  }
  if (!header.startsWith('Bearer ')) {
    // return an error response immediately without going to next() middleware
    return res.status(401).json({
      status: 401,
      code: 'AUT_02',
      message: 'Access Unauthorized',
    });
  }
  const token = header.substring(7);
  // eslint-disable-next-line consistent-return
  jwt.verify(token, (err, decoded) => {
    if (!err) {
      // eslint-disable-next-line camelcase
      const { customer_id } = decoded;
      return (
        Customer.findOne({ where: { customer_id } })
          // eslint-disable-next-line consistent-return
          .then(customer => {
            if (customer) {
              // eslint-disable-next-line camelcase
              req.customer_id = customer_id;
              next();
            } else {
              return res.status(401).json({
                status: 401,
                code: 'AUT_02',
                message: 'Access Unauthorized',
              });
            }
          })
          .catch(error => {
            return res.status(401).send(error);
          })
      );
    }
    res.status(403).send(err);
  });
};
