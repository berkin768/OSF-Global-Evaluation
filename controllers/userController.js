const mongoose = require('mongoose')
const MongoClient = require('mongodb').MongoClient;
const categoryDBModel = require('../models/category.js')
const basketDBModel = require('../models/basket.js')
const wishlistDBModel = require('../models/wishlist.js')
const productDBModel = require('../models/product.js')
const userDBModel = require('../models/user.js')
const nodemailer = require('nodemailer');


const file = require('../utils/file')
var categoryModel = new categoryDBModel.Schema(); //mongoose.model('product', Product);
var userModel = new userDBModel.Schema();
var basketModel = new basketDBModel.Schema();
var wishlistModel = new wishlistDBModel.Schema();
var productModel = new productDBModel.Schema();


exports.loginPage = function (req, res) {
    categoryModel.find(function (err, allCategories) { //NOT TO LOSE MENS OR WOMENS FROM NAVBAR !
        res.render('login', {
            allCategories: allCategories
        })
    });
};

exports.registerPage = function (req, res) {
    categoryModel.find(function (err, allCategories) { //NOT TO LOSE MENS OR WOMENS FROM NAVBAR !
        res.render('register', {
            allCategories: allCategories
        })
    });
}

exports.profilePage = function (req, res) {
    var token = req.query.token
    if (token != null) {
        var user = userDBModel.User().methods.verifyJWT(token)
        if (user != null) {
            var username = user.username
            userModel.findOne({
                'username': username
            }, function (err, user) { //QUERIED RESULTS FROM 
                res.render('profile', {
                    user: user
                })
            });
        } else {
            res.sendStatus(401);
        }
    } else {
        res.sendStatus(401);
    }
}

exports.basketPage = function(req,res){
    var token = req.query.token
    if (token != null) {
        var user = userDBModel.User().methods.verifyJWT(token)
        if (user != null) {
            var username = user.username
            userModel.findOne({'username': username}, function (err, user) { //QUERIED RESULTS FROM 
                res.render('basket', {user: user })
            });
        } else {
            res.sendStatus(401);
        }
    } else {
        res.sendStatus(401);
    }
}

exports.wishlistPage = function(req,res){
    var token = req.query.token
    if (token != null) {
        var user = userDBModel.User().methods.verifyJWT(token)
        if (user != null) {
            var username = user.username
            userModel.findOne({'username': username}, function (err, user) { //QUERIED RESULTS FROM 
                res.render('wishlist', {user: user})
            });
        } else {
            res.sendStatus(401);
        }
    } else {
        res.sendStatus(401);
    }
}

exports.login = function (req, res) {
    var username = req.body.user.username
    var password = req.body.user.password
    userModel.find({
        'username': username
    }, function (err, user) { //QUERIED RESULTS FROM 
        if (user[0]) { //USERNAME IS TRUE
            var checkPassword = userDBModel.User().methods.comparePassword(password, user[0].password) //user.password is hashed in DB
            if (checkPassword) { //ALSO PASSWORD IS TRUE
                user = user[0];
                var jwt = userDBModel.User().methods.generateJWT(user.username)
                user.token = jwt
                user.save()
                res.json({
                    success: true,
                    token: jwt
                })
            } else {
                res.json({
                    'error': true
                })
            }
        } else {
            res.json({
                'error': true
            })
        }
    });

}

exports.register = function (req, res) {
    var username = req.body.user.username
    var name = req.body.user.name
    var surname = req.body.user.surname
    var password = req.body.user.password
    var email = req.body.user.email
    var hashedPassword = userDBModel.User().methods.cryptPassword(password)

    var userEntity = new userModel()
    userEntity.name = name
    userEntity.surname = surname
    userEntity.username = username
    userEntity.password = hashedPassword
    userEntity.email = email
    userEntity.emailVerify = false

    userEntity.save((err, data) => {
        if (data) {
            res.sendStatus(200)
        } else {
            var errors = []
            for (error in err.errors) {
                errors.push(error)
            }

            res.json({
                errors: errors
            })
        }
    })
}

exports.logout = function (req, res) {
    res.json({
        success: true
    })
}




exports.getUser = function (req, res) {
    var token = req.body.token
    var user = userDBModel.User().methods.verifyJWT(token)
    var username = user.username
    userModel.findOne({
        'username': username
    }, function (err, user) { //QUERIED RESULTS FROM 
        res.json({
            success:true,
            user: user
        })
    });

}

exports.headerInformation = function (req, res) {
    var token = req.body.token
    var user = userDBModel.User().methods.verifyJWT(token)
    var username = user.username

    basketModel.findOne({'userId':username},function(err,basket){
        wishlistModel.findOne({'userId':username},function(err,wishlist){
            if(basket != null && wishlist != null){
                res.json({
                    username: username,
                    basket : basket,
                    wishlist : wishlist,
                    success: true
                })
            }
            else{
                res.json({
                    username: username,
                    basket : null,
                    wishlist : null,
                    success: true
                })
            }
        })
    })
}

exports.updateUser = function (req, res) {
    var token = req.body.token
    var user = userDBModel.User().methods.verifyJWT(token) //GET USERNAME
    var username = user.username

    //INPUT FIELD
    var name = req.body.user.name
    var surname = req.body.user.surname
    var email = req.body.user.email

    var query = userModel.findOne({
        'email': email
    }) //QUERIED RESULTS FROM 

    var isEmailUnique = query.then(function (query) {
        if (query) {
            return false
        } else {
            return true
        }
    })

    isEmailUnique.then(function (isEmailUnique) {
        if (isEmailUnique) {
            userModel.find({
                'username': username
            }, function (err, user) { //QUERIED RESULTS FROM 
                var user = user[0]
                user.set({
                    name: name,
                    surname: surname,
                    email: email
                })
                user.save(function (err, updatedUser) {
                    if (err) {
                        res.json({
                            success: false
                        })
                    } else {
                        res.json({
                            success: true
                        })
                    }
                });
            });
        } else {
            res.json({
                success: false
            })
        }
    })
}

exports.verification = function (req, res) {
    var token = req.query.token
    if (token != null) {
        var user = userDBModel.User().methods.verifyJWT(token) //GET USERNAME
        if (user != null) {
            var username = user.username
            userModel.findOne({
                'username': username
            }, function (err, user) {
                user.emailVerify = true
                user.save()
                res.render('verify')
            })
        } else {
            res.sendStatus(401)
        }
    } else {
        res.sendStatus(401)
    }
}

exports.emailVerify = function (req, res, next) {
    var token = req.body.token
    var user = userDBModel.User().methods.verifyJWT(token) //GET USERNAME
    var username = user.username
    userModel.findOne({
        'username': username
    }, function (err, user) {
        var transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'osfmailer@gmail.com',
                pass: 'osfmailer123'
            }
        });

        var mailOptions = {
            from: 'osfmailer@gmail.com',
            to: user.email,
            subject: 'OSF E-Commerce Verification',
            text: 'Please click this following link to verify your email \n ' + 'http://localhost/verification?token=' + user.token + '\n This link can be used once 24 hours'
        };

        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                console.log(error);
                res.json({
                    success: false
                })
            } else {
                console.log('Email sent: ' + info.response);
                res.json({
                    success: true
                })
            }
        });

    })
}

exports.addBasket = function (req, res, next) {
    var token = req.body.token
    var user = userDBModel.User().methods.verifyJWT(token)
    var username = user.username

    var userId = username
    var itemId = req.body.itemId


    var query = basketModel.findOne({
        'userId': userId
    }) //QUERIED RESULTS FROM 

    var isBasketExist = query.then(function (query) {
        if (query == null) {
            return false
        } else {
            return true
        }
    })

    isBasketExist.then(function (isBasketExist) {
        if (isBasketExist) {
            basketModel.findOne({
                'userId': userId
            }, function (err, basket) {

                productModel.findOne({
                    'id': itemId
                }, function (err, product) {

                    if (!basket.products.filter(function (e) {
                            return e.id === product.id;
                        }).length > 0) {
                        basket.products.push(product)
                        basket.save(function (err, result) {
                            if (result) {
                                res.json({
                                    success: true,
                                    basket: basket.products
                                })
                            }
                        })

                    } else {
                        res.json({
                            success: true,
                            basket: basket.products,
                            info: true
                        })
                    }
                })
            })

        } else {
            var basketEntity = new basketModel();
            basketEntity.userId = username
            basketEntity.products = []
            productModel.findOne({
                'id': itemId
            }, function (err, product) {
                basketEntity.products.push(product)
                basketEntity.save(function (err, result) {
                    if (result)
                        res.json({
                            success: true,
                            basket: basketEntity.products
                        })
                })
            })

        }
    })
}

exports.addWishlist = function (req, res) {
    var token = req.body.token
    var user = userDBModel.User().methods.verifyJWT(token)
    var username = user.username


    var userId = username
    var itemId = req.body.itemId

    var query = wishlistModel.findOne({
        'userId': userId
    }) //QUERIED RESULTS FROM 

    var isWishlistExist = query.then(function (query) {
        if (query == null) {
            return false
        } else {
            return true
        }
    })

    isWishlistExist.then(function (isWishlistExist) {
        if (isWishlistExist) {
            wishlistModel.findOne({
                'userId': userId
            }, function (err, wishlist) {
                productModel.findOne({
                    'id': itemId
                }, function (err, product) {

                    if (!wishlist.products.filter(function (e) {
                            return e.id === product.id;
                        }).length > 0) {
                        wishlist.products.push(product)
                        wishlist.save(function (err, result) {
                            if (result) {
                                res.json({
                                    success: true,
                                    wishlist: wishlist.products
                                })
                            }
                        })
                    } else {
                        res.json({
                            success: true,
                            wishlist: wishlist.products,
                            info: true
                        })
                    }
                })
            })
        } else {
            var wishlistEntity = new wishlistModel();
            wishlistEntity.userId = username
            wishlistEntity.products = []
            productModel.findOne({
                'id': itemId
            }, function (err, product) {
                wishlistEntity.products.push(product)
                wishlistEntity.save(function (err, result) {
                    if (result)
                        res.json({
                            success: true,
                            wishlist: wishlistEntity.products
                        })
                })
            })

        }
    })
}

exports.authenticate = function (req, res, next) {
    var token = req.body.token
    if (token != null) { //To know that user logged in
        var user = userDBModel.User().methods.verifyJWT(token)
        if (user) {
            return next()
        } else {
            return res.json({
                success: false
            })
        }
    } else {
        return res.json({
            success: false
        })

    }
}