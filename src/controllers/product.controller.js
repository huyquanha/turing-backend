/**
 * The Product controller contains all static methods that handles product request
 * Some methods work fine, some needs to be implemented from scratch while others may contain one or two bugs
 * The static methods and their function include:
 * - getAllProducts - Return a paginated list of products
 * - searchProducts - Returns a list of product that matches the search query string
 * - getProductsByCategory - Returns all products in a product category
 * - getProductsByDepartment - Returns a list of products in a particular department
 * - getProduct - Returns a single product with a matched id in the request params
 * - getAllDepartments - Returns a list of all product departments
 * - getDepartment - Returns a single department
 * - getAllCategories - Returns all categories
 * - getSingleCategory - Returns a single category
 * - getDepartmentCategories - Returns all categories in a department
 *
 *  NB: Check the BACKEND CHALLENGE TEMPLATE DOCUMENTATION in the readme of this repository to see our recommended
 *  endpoints, request body/param, and response object for each of these method
 */
import {
  Product,
  Department,
  // AttributeValue,
  // Attribute,
  Category,
  Sequelize,
} from '../database/models';

const { Op } = Sequelize;

/**
 * @param page
 * @param limit
 * @param description_length
 * @returns {{offset: *, limit: *, page: *, description_length: *}}
 */
const paginate = ({ page, limit, ...query }) => {
  if (!page) {
    page = 1; // eslint-disable-line
  } else if (typeof page !== 'number') {
    page = parseInt(page); // eslint-disable-line
  }
  if (!limit) {
    limit = 20; // eslint-disable-line
  } else if (typeof limit !== 'number') {
    limit = parseInt(limit); // eslint-disable-line
  }
  const offset = (page - 1) * limit;
  return {
    page,
    limit,
    ...query,
    offset,
  };
};

/**
 * @param description
 * @param description_length
 * @returns a shorten description with maximum length = description_length
 */
const shortenDesc = (description, description_length) => { // eslint-disable-line
  if (!description_length) { // eslint-disable-line
    // eslint-disable-next-line
    description_length = 200;
  } else if (typeof description_length !== 'number') { // eslint-disable-line
    description_length = parseInt(description_length); // eslint-disable-line
  }
  return description.substring(0, description_length);
};

/**
 *
 *
 * @class ProductController
 */
class ProductController {
  /**
   * get all products
   *
   * @static
   * @param {object} req express request object
   * @param {object} res express response object
   * @param {object} next next middleware
   * @returns {json} json object with status and product data
   * @memberof ProductController
   */
  static async getAllProducts(req, res, next) {
    const { query } = req;
    const { page, limit, description_length, offset } = paginate(query); // eslint-disable-line
    try {
      const totalRecords = await Product.count();
      const totalPages =
        totalRecords % limit === 0 ? totalRecords / limit : Math.floor(totalRecords / limit) + 1;
      const products = await Product.findAndCountAll({
        offset,
        limit,
        attributes: {
          exclude: ['image', 'image_2', 'display'],
        },
      });
      products.rows.forEach(p => (p.description = shortenDesc(p.description, description_length))); //eslint-disable-line
      return res.status(200).json({
        paginationMeta: {
          currentPage: page,
          currentPageSize: limit,
          totalPages,
          totalRecords,
        },
        rows: products.rows,
      });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * search all products
   *
   * @static
   * @param {object} req express request object
   * @param {object} res express response object
   * @param {object} next next middleware
   * @returns {json} json object with status and product data
   * @memberof ProductController
   */
  static async searchProduct(req, res, next) {
    const { limit, description_length, query_string, all_words, offset } = paginate(req.query);  // eslint-disable-line
    try {
      // all_words should either be on or off
      // eslint-disable-next-line camelcase
      if (all_words === 'on') {
        const products = await Product.findAll({
          offset,
          limit,
          attributes: {
            exclude: ['image', 'image_2', 'display'],
          },
          where: {
            [Op.or]: [{ name: query_string }, { description: query_string }],
          },
        });
        products.forEach(p => (p.description = shortenDesc(p.description, description_length))); //eslint-disable-line
        return res.status(200).json({ rows: products.rows });
      } else if (all_words === 'off') { // eslint-disable-line
        const products = await Product.findAll({
          offset,
          limit,
          attributes: {
            exclude: ['image', 'image_2', 'display'],
          },
          where: {
            [Op.or]: [
              {
                name: {
                  [Op.like]: `%${ query_string  }%` // eslint-disable-line
                },
              },
              {
                description: {
                  [Op.like]: `%${ query_string  }%` // eslint-disable-line
                },
              },
            ],
          },
        });
        products.forEach(p => (p.description = shortenDesc(p.description, description_length))); //eslint-disable-line
        return res.status(200).json({ rows: products.rows });
      }
      return res.status(400).json({
        error: {
          status: 400,
          message: `Query value ${all_words} not supported`, // eslint-disable-line
        },
      });
    } catch (err) {
      return next(err);
    }
  }

  /**
   * get all products by caetgory
   *
   * @static
   * @param {object} req express request object
   * @param {object} res express response object
   * @param {object} next next middleware
   * @returns {json} json object with status and product data
   * @memberof ProductController
   */
  static async getProductsByCategory(req, res, next) {
    try {
      const { category_id } = req.params; // eslint-disable-line
      const { limit, description_length, offset } = paginate(req.query); //eslint-disable-line
      const products = await Product.findAll({
        include: [
          {
            model: Category,
            where: {
              category_id,
            },
            attributes: [],
          },
        ],
        attributes: {
          exclude: ['image', 'image_2', 'display'],
        },
        limit,
        offset,
      });
      products.forEach(p => (p.description = shortenDesc(p.description, description_length))); //eslint-disable-line
      return res.status(200).json({ rows: products });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * get all products by department
   *
   * @static
   * @param {object} req express request object
   * @param {object} res express response object
   * @param {object} next next middleware
   * @returns {json} json object with status and product data
   * @memberof ProductController
   */
  static async getProductsByDepartment(req, res, next) {
    // implement the method to get products by department
    const { department_id } = req.params; // eslint-disable-line
    const { limit, description_length, offset } = paginate(req.query); // eslint-disable-line
    try {
      const products = await Product.findAll({
        include: [
          {
            model: Category,
            attributes: [],
            include: [
              {
                model: Department,
                where: {
                  department_id,
                },
                attributes: [],
              },
            ],
          },
        ],
        attributes: {
          exclude: ['image', 'image_2', 'display'],
        },
        offset,
        limit,
      });
      products.forEach(p => (p.description = shortenDesc(p.description, description_length))); //eslint-disable-line
      return res.status(200).json({ rows: products });
    } catch (err) {
      return next(err);
    }
  }

  /**
   * get single product details
   *
   * @static
   * @param {object} req express request object
   * @param {object} res express response object
   * @param {object} next next middleware
   * @returns {json} json object with status and product details
   * @memberof ProductController
   */
  static async getProduct(req, res, next) {
    const { product_id } = req.params;  // eslint-disable-line
    const { description_length } = req.query; // eslint-disable-line
    try {
      const product = await Product.findByPk(product_id);
      if (product) {
        return res.status(200).json({
          ...product.dataValues,
          description: shortenDesc(product.description, description_length),
        });
      }
      return res.status(404).json({
        error: {
          status: 404,
          message: `Product with id ${product_id} does not exist`,  // eslint-disable-line
        },
      });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * get all departments
   *
   * @static
   * @param {object} req express request object
   * @param {object} res express response object
   * @param {object} next next middleware
   * @returns {json} json object with status and department list
   * @memberof ProductController
   */
  static async getAllDepartments(req, res, next) {
    try {
      const departments = await Department.findAll();
      return res.status(200).json(departments);
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Get a single department
   * @param {*} req
   * @param {*} res
   * @param {*} next
   */
  static async getDepartment(req, res, next) {
    const { department_id } = req.params; // eslint-disable-line
    try {
      const department = await Department.findByPk(department_id);
      if (department) {
        return res.status(200).json(department);
      }
      return res.status(404).json({
        error: {
          status: 404,
          message: `Department with id ${department_id} does not exist`,  // eslint-disable-line
        },
      });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * This method should get all categories
   * @param {*} req
   * @param {*} res
   * @param {*} next
   */
  static async getAllCategories(req, res, next) {
    // Implement code to get all categories here
    try {
      const categories = await Category.findAll();
      return res.status(200).json(categories);
    } catch (err) {
      return next(err);
    }
  }

  /**
   * This method should get a single category using the categoryId
   * @param {*} req
   * @param {*} res
   * @param {*} next
   */
  static async getSingleCategory(req, res, next) {
    const { category_id } = req.params;  // eslint-disable-line
    try {
      const category = await Category.findByPk(category_id);
      if (category) {
        return res.status(200).json(category);
      }
      return res.status(404).json({
        error: {
          status: 404,
          message: `Category with id ${category_id} does not exist`,  // eslint-disable-line
        },
      });
    } catch (err) {
      return next(err);
    }
  }

  /**
   * This method should get the categories of a particular product
   * @param {*} req
   * @param {*} res
   * @param {*} next
   */
  static async getProductCategories(req, res, next) {
    // Note: one product may have more than 1 category
    const { product_id } = req.params;  // eslint-disable-line
    try {
      const categories = await Category.findAll({
        include: [
          {
            model: Product,
            where: {
              product_id,
            },
            attributes: [],
          },
        ],
        attributes: {
          exclude: ['description'],
        },
      });
      return res.status(200).json(categories);
    } catch (err) {
      return next(err);
    }
  }

  /**
   * This method should get list of categories in a department
   * @param {*} req
   * @param {*} res
   * @param {*} next
   */
  static async getDepartmentCategories(req, res, next) {
    const { department_id } = req.params;  // eslint-disable-line
    try {
      const department = await Department.findByPk(department_id, {
        include: [Category],
      });
      if (department) {
        return res.status(200).json({
          rows: department.categories,
        });
      }
      return res.status(404).json({
        error: {
          status: 404,
          message: `Department with id ${department_id} does not exist`,  // eslint-disable-line
        },
      });
    } catch (err) {
      return next(err);
    }
  }
}

export default ProductController;
