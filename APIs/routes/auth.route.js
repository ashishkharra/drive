const express = require('express');
const { OAuth,validateUser,signOut } = require('../controllers/auth.controller.js');
const router = express.Router();

router.post('/OAuth',OAuth);
router.get('/validate', validateUser);
router.get('/sign-out',signOut);

module.exports = router