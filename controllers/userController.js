const Users = require('../models/userModel')
const Payments = require('../models/paymentModel')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

const userController = {

// -------------------------------------Registration components-------------------------

    register: async (req, res) => {
        try {
            const {name, email, password} = req.body;
            const user = await Users.findOne({email})
            if (user) return res.status(400).json({msg: "User already exists.."})

            if (password.length < 6)
                return res.status(400).json({msg: "Password length should be greater then 6 charecters"})

            // Password Encryption
            const passwordHash = await bcrypt.hash(password, 10)
            const newUser = new Users({
                name, email, password: passwordHash
            })

            // Saving data to mongodb
            await newUser.save()

            // Then create jsonwebtoken to authentication
            const accesstoken = createAccessToken({id: newUser._id})
            const refreshtoken = createRefreshToken({id: newUser._id})

            res.cookie('refreshtoken', refreshtoken, {
                httpOnly: true,
                path: '/user/refresh_token',
                maxAge: 7*24*60*60*1000 //7 day
            })

            res.json({accesstoken})

        } catch (err) {
            return res.status(500).json({msg: err.message})
        }
    },

// -------------------------------------Login components---------------------------------

    login: async (req, res) => {
        try {
            const {email, password} = req.body;
            const user = await Users.findOne({email});
            if (!user) {
                return res.status(400).json({msg: "User Not Found"})
            }
            const isMatch = await bcrypt.compare(password, user.password)
            if (!isMatch) {
                return res.status(400).json({msg: "Incorrect Password"})
            }
            //if login suuccess then create access token and refresh token
            const accesstoken = createAccessToken({id: user._id})
            const refreshtoken = createRefreshToken({id: user._id})

            res.cookie('refreshtoken', refreshtoken, {
                httpOnly: true,
                path: '/user/refresh_token',
                maxAge: 7*24*60*60*1000 //7 day
            })

            res.json({accesstoken})
        } catch (err) {
            return res.status(500).json({msg: err.message})
        }
    },

// -------------------------------------Logout components--------------------------------

    logout: async (req, res) => {
        try {
            res.clearCookie('refreshtoken', {path: '/user/refresh_token'})
            return res.json({msg: "Logged Out Successfully..!!"})
        } catch (err) {
            return res.status(500).json({msg: err.message})
        }
    },

// -------------------------------------Refresh Token------------------------------------

    refreshToken: (req, res) => {
        try {
            const rf_token = req.cookies.refreshtoken;
            if (!rf_token) return res.status(400).json({msg: "Please Login or Register"})

            jwt.verify(rf_token, process.env.REFRESH_TOKEN_SECRET, (err, user) => {

                if (err) return res.status(400).json({msg: "Please Login or Register"})

                const accesstoken = createAccessToken({id: user.id})

                res.json({accesstoken})
            })
        } catch {
            return res.status(500).json({msg: err.msg})
        }
    },

// -------------------------------------User Authentication------------------------------

    getUser: async (req, res) => {
        try {
            const user = await Users.findById(req.user.id).select('-password')
            if (!user) return res.status(400).json({msg: "User not Found"})

            res.json(user)
        } catch (err) {
            return res.status(500).json({msg: err.message})
        }
    },

// -------------------------------------Adding to Cart-----------------------------------

    addCart: async (req, res) => {
        try {

            const user = await Users.findById(req.user.id)
            if (!user) return res.status(400).json({msg: 'User does not exist.'})

            await Users.findOneAndUpdate({_id: req.user.id}, {
                cart: req.body.cart
            })

            return res.json({msg: "Added to cart"})
        } catch (err) {
            return res.status(500).json({msg: err.msg})
        }
    },

// -------------------------------------History to Payment ------------------------------

    history: async (req, res) => {
        try {
            const history = await Payments.find({user_id : req.user.id})

            res.json(history)
        } catch (err) {
            return res.status(500).json({msg: err.msg})
        }
    }
}

const createAccessToken = (user) => {
    return jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '11m'})
}
const createRefreshToken = (user) => {
    return jwt.sign(user, process.env.REFRESH_TOKEN_SECRET, {expiresIn: '7d'})
}

module.exports = userController;
