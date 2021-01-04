const express = require("express");
const router = express.Router();

//import controller
const {signup, activateAccount, signin, forgotPassword, resetPassword, googlelogin, facebooklogin} = require("../controllers/auth");

router.post('/signup', signup);
router.post('/email-activate', activateAccount);
router.post('/signin', signin);

//forgot/reset password routes
router.put('/forgot-password', forgotPassword);
router.put('/reset-password', resetPassword);

//google login
router.post('/googlelogin', googlelogin);
//facebook login
router.post('/facebooklogin', facebooklogin);

module.exports = router;