const User = require('../models/user.js');
const jsw = require('jsonwebtoken');
const _ = require('lodash');
//Facebook Login
const fetch = require('node-fetch');
//Google Login
const {OAuth2Client} = require('google-auth-library');
const client = new OAuth2Client("169423175057-s09kigjiinijg7d2suvi7e8r9f1s9n1l.apps.googleusercontent.com"); //same ID in frontend App.js
//Mailgun
const mailgun =require("mailgun-js");
const DOMAIN = 'sandbox4453e9029ffe4681afee491d7ee6b09d.mailgun.org'; //create account in https://login.mailgun.com/login/ to copy-paste domain name 
const mg = mailgun({apiKey: process.env.MAILGUN_APIKEY, domain: DOMAIN});

exports.signup = (req, res) => {
    console.log(req.body);
    const {name, email, password} = req.body;
    User.findOne({email}).exec((err, user) => {
        if(user) {
            return res.status(400).json({error: "User with this email already exist"});
        }

        const token = jws.sign({name, email, password}, process.env.JWT_ACC_ACTIVATE, {expiresIn: '20m'}); 

        const data = {
            from: 'noreply@hello.com', //just need to edit it to put a real email
            to: email,
            subject: 'Account Activation Link',
            html: `
                <h2>Please click on given link to activate your account</h2>
                <p>${process.env.CLIENT_URL}/authentication/activate/${token}</p>
            `
        };
        mg.messages().send(data, function(error, body) {
            if(error) {
                return res.json({
                    error: err.message
                })
            }
            return res.json({message: 'Email has been sent, kindly activate your account'});
            console.log(body);
        });

        let newUser = new User({name, email, password});
        newUser.save((err, success) => {
            if(err) {
                console.log("Error in signup: ", err);
                return res.status(400), json({error: err});
            }
            res.json({
                message: "Singup Success!"
            })
        })
    });
}

exports.activateAccount = (req, res) => {
    const {token} = req.body;
    if(token) {
        jwt.verify(token, process.env.JWT_ACC_ACTIVATE, function(err, decodedToken) {
            if(err) {
                return res.status(400).json({error: "Incorrect or Expired link"})
            }
            const {name, email, password} = decodedToken;
            User.findOne({email}).exec((err, user) => {
                if(user) {
                    return res.status(400).json({error: "User with this email already exist"});
                }
                let newUser = new User({name, email, password});
                newUser.save((err, success) => {
                    if(err) {
                        console.log("Error in signup while account activation: ", err);
                        return res.status(400), json({error: 'Error activating account'});
                    }
                    res.json({
                        message: "Singup Success!"
                    })
                })
            });
        })
    } else {
        return res.json({error: "Something went wrong"});
    }
}

exports.forgotPassword = (req, res) => {
    const{email} = req.body;

    User.findOne({email}, (err, user) => {
        if(err || !user) {
            return res.status(400).json({error: "User with this email does not exists"});
        }
    })

    const token = jws.sign({_id: user._id}, process.env.RESET_PASSWORD_KEY, {expiresIn: '20m'}); 

    const data = {
        from: 'noreply@hello.com', //just need to edit to real email
        to: email,
        subject: 'Account Activation Link',
        html: `
            <h2>Please click on given link to reset your password</h2>
            <p>${process.env.CLIENT_URL}/resetpassword/${token}</p>
        `
    };

    return user.updateOne({resetLink: token}, function(err, success) {
        if(err) {
            return res.status(400).json({error: "Reset password link error"});
        } else {
            mg.messages().send(data, function(error, body) {
                if(error) {
                    return res.json({
                        error: err.message
                    })
                }
                return res.json({message: "Email has been sent, kindly follow the instructions"});
            });
        }
    });
}

exports.resetPassword = (req, res) => {
    const {resetLink, newPass} = req.body;
    if(resetLink) {
        jwt.verify(resetLink, process.env.RESET_PASSWORD_KEY, function(error, decodedData) {
            if(error) {
                return res.status(401).json({
                    error: "Incorrect token or it is expired"
                })
            }
            User.findOne({resetLink}, (err, user) => {
                if(err || !user) {
                    return res.status(400).json({error: "User with this token does not exist"});
                }
                const obj = {
                    password: newPass,
                    resetLink: ''
                }
                user = _.extend(user, obj);
                user.save((err, result) => {
                    if(err) {
                        return res.status(400).json({error: "Reset password error"});
                    } else {
                            return res.status(200).json({message: "Your password has been change"});
                    }
                })
            })
        })
    } else {
        return res.status(401).json({error: "Authentication error"});
    }

}

exports.signin = (req, res) => {
    const {email, password} = req.body;
    User.findOne({email}).exec((err, user) => {
        if(err) {
            return res.status(400).json({
                error : "This user does not exist, signup first"
            })
        }
        //validate password exist in database
        if(user.password !== password) {
            return res.status(400).json({
                error: "Email or password incorrect"
            })
        }
        //generate token
        const token = jwt.sign({_id: user._id, name: user.name}, process.env.JWT_SIGNIN_KEY, {expiresIn: '7d'});
        const {_id, name, email} = user;
        
        res.json({
            token,
            user: {_id, name, email}
        })
    })
}

//Verify if the token that was generated by login with google is the same or not
exports.googlelogin = (req, res) => {
    const {tokenId} = req.body;

    client.verifyIdToken({idToken: tokenId, audience: "169423175057-s09kigjiinijg7d2suvi7e8r9f1s9n1l.apps.googleusercontent.com"}) //same ID in frontend App.js
.then(response => {
        const {email_verified, name, email} = response.payload;

        if(email_verified) {
            User.findOne({email}).exec((err, user) => {
                if(err) {
                    return res.status(400).json({
                        error: "Something went wrong..."
                    })
                } else {
                    if(user) {
                        const token = jwt.sign({_id: user._id}, process.env.JWT_SIGNIN_KEY, {expiresIn: '7d'});
                        const {_id, name, email} = user;
                        res.json({
                            token,
                            user: {_id, name, email}
                        })
                    } else {
                        let password = email+process.env.JWT_SIGNIN_KEY;
                        let newUser = new User({name, email, password});
                        newUser.save((err, data) => {
                            if(err) {
                                return res.status(400).json({
                                    error: "Something went wrong..."
                                })
                            }
                            const token = jwt.sign({_id: data._id}, process.env.JWT_SIGNIN_KEY, {expiresIn: '7d'});
                            const {_id, name, email} = newUser;
                            res.json({
                                token,
                                user: {_id, name, email}
                            })
                        })
                    }
                }
            })
        }

        console.log(response.payload);
    }) 
    console.log()
}

exports.facebooklogin = (req, res) => {
    const {userID, accesToken} = req.body;

    let urlGraphFacebook = `http://graph.facebook.com/v2.11/${userID}/?fields=id,name,email&access_token=${accessToken}`
    fetch(urlGraphFacebook, {
        method: 'GET'
    })
    .then(response => response.json())
    .then(response => {
        const {email, name} = response;
        User.findOne({email}).exec((err, user) => {
            if(err) {
                return res.status(400).json({
                    error: "Something went wrong..."
                })
            } else {
                if(user) {
                    const token = jwt.sign({_id: user._id}, process.env.JWT_SIGNIN_KEY, {expiresIn: '7d'});
                    const {_id, name, email} = user;
                    res.json({
                        token,
                        user: {_id, name, email}
                    })
                } else {
                    let password = email+process.env.JWT_SIGNIN_KEY;
                    let newUser = new User({name, email, password});
                    newUser.save((err, data) => {
                        if(err) {
                            return res.status(400).json({
                                error: "Something went wrong..."
                            })
                        }
                        const token = jwt.sign({_id: data._id}, process.env.JWT_SIGNIN_KEY, {expiresIn: '7d'});
                        const {_id, name, email} = newUser;
                        res.json({
                            token,
                            user: {_id, name, email}
                        })
                    })
                }
            }
        })
    });
}