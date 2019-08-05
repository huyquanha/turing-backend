import { Router } from 'express';
import CustomerController from '../../controllers/customer.controller';
import auth from '../../auth/auth';

// These are valid routes but they may contain a bug, please try to define and fix them

const router = Router();
router.post('/customers', CustomerController.create);
router.post('/customers/login', CustomerController.login);
router.get('/customer', auth, CustomerController.getCustomerProfile);
router.put('/customer', auth, CustomerController.updateCustomerProfile);
router.put('/customer/creditCard', auth, CustomerController.updateCreditCard);
router.put('/customer/address', auth, CustomerController.updateCustomerAddress);

export default router;
