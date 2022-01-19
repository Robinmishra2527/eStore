const Products = require('../models/productModel')

// Filter, sorting and paginating..
class APIfeatures {
	constructor(query, queryString) {
		this.query = query;
		this.queryString = queryString
	}
	//------------------------filtering the products---------------------------------------------
	filtering() {
		//here we will filter the products by checking greater than equal to(gte) and further.
		// we can check by name, price, page etc 

		const queryObj = {...this.queryString} //this.queryString = req.query
		// console.log({before: queryObj}) //before delete page
		const excludedFields = ['page', 'sort', 'limit']
		excludedFields.forEach(el => delete (queryObj[el]))
		// console.log({after: queryObj}) //after delete page
		let queryStr = JSON.stringify(queryObj)
		queryStr = queryStr.replace(/\b(gte|gt|lt|lte|regex)\b/g, match => '$' + match)
		// console.log({queryStr})
		this.query.find(JSON.parse(queryStr))
		return this;
	}
	//----------------------------sorting of products--------------------------------------------
	sorting() {
		if (this.queryString.sort) {
			const sortBy = this.queryString.sort.split(',').join(' ')
			this.query = this.query.sort(sortBy)
		} else {
			this.query = this.query.sort('-createdAt')
		}
		return this;
	}
	//--------------------------------how much product will be shown at the page-----------------
	paginating() {
		const page = this.queryString.page * 1 || 1
		const limit = this.queryString.limit * 1 || 9
		const skip = (page - 1) * limit
		this.query = this.query.skip(skip).limit(limit)
		return this;
	}
}
// ----------------------------------Product Controller-----------------------------------------
const productController = {
	getProducts: async (req, res) => {
		try {
			const features = new APIfeatures(Products.find(), req.query)
				.filtering()
				.sorting()
				.paginating()

			const products = await features.query
			res.json({
				status: 'success',
				result: products.length,
				products: products
			})

			// res.json('testing routes of get products')
		} catch (err) {
			return res.status(500).json({msg: err.message})
		}
	},

	//-------here we will create product and save it into cloudinery and database..---------------
	createProduct: async (req, res) => {
		try {
			const {product_id, title, price, description, content, images, category} = req.body;
			if (!images) return res.status(400).json({msg: 'No Images Uploades.!'})

			const product = await Products.findOne({product_id})
			if (product)
				return res.status(400).json({msg: 'Product already exists..'})

			const newProducts = new Products({
				product_id,
				title: title.toLowerCase(),
				price,
				description,
				content,
				images,
				category
			})

			await newProducts.save()
			res.json({msg: 'Product Created..'})

		} catch (err) {
			return res.status(500).json({msg: err.message})
		}
	},

	//-------------------------------here we delete the product-----------------------------------
	deleteProduct: async (req, res) => {
		try {
			await Products.findByIdAndDelete(req.params.id)
			res.json({msg: 'Product Deleted..'})
		} catch (err) {
			return res.status(400).json({msg: err.message})
		}
	},

	//------------------here we will updating the product by its id.------------------------------
	updateProduct: async (req, res) => {
		try {
			const {title, price, description, content, images, category} = req.body;
			if (!images) return res.status(400).json({msg: 'No Image Upload..'})
			await Products.findOneAndUpdate({_id: req.params.id}, {
				title: title.toLowerCase(),
				price,
				description,
				content,
				images,
				category
			})
			res.json({msg: 'Product Updated..!'})
		} catch (err) {
			return res.status(500).json({msg: err.message})
		}
	}
}

module.exports = productController