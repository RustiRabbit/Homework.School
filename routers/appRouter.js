var express = require('express')
var router = express.Router()
var path = require('path');
var passport = require('passport');
require('dotenv').load()
const { Pool, Client } = require('pg')
const bodyParser = require("body-parser");

//Hashing
var bcrypt = require('bcrypt');
const saltRounds = process.env.SALTROUNDS;

//Middleware
router.use(passport.initialize());
router.use(passport.session());
router.use(bodyParser.urlencoded({
    extended: true
}));
router.use(bodyParser.json());

//Serve Home Page
router.get('/', isLoggedIn, function(req, res){
    res.render('app/app', { user: req.user});
});

//Signup Page
router.get('/signup', function(req, res){
    res.render('app/signup', { user: req.user});
});

//Post Signup
router.post('/signup', function(req, res, next){
    const client = new Client({
        connectionString: process.env.DATAURI,
        ssl: true,
    });
    client.connect();
    var hashPassword = "";
    bcrypt.hash(req.body.password, 10, function(err, hash) {
        hashPassword = hash;
        console.log(hashPassword)
        client.query("INSERT INTO users (firstname, lastname, password, username, email, type) VALUES($1, $2, $3, $4, $5, 'user') RETURNING id", [req.body.firstname, req.body.lastname, hashPassword, req.body.username, req.body.email], function(err, result) {
            if (err) {
                console.log(err);
            } else {
                console.log('row inserted with id: ' + result.rows[0].id);
            }
            client.end();
            res.redirect('/app/login');
        })
    });
    

});
  
//Serve Duework Page
router.get('/duework', isLoggedIn, function(req, res){
    res.render('app/duework');
});

//Serve Subjects Page
router.get('/subjects', isLoggedIn, function(req, res){
    data = Query("SELECT id, subjectName FROM subjects WHERE userID=" + req.user.id)
    res.render('app/subjects');
});

//Serve Login Page
router.get('/login', function(req, res){
    var message = req.query.error;
    res.render('app/login', {infomation: message});
 });

//Login
router.post('/login', function (req, res, next) {
    passport.authenticate('local', function (err, user, info) {
        if (err) {
            res.status(200).send("ERROR 200. " + res);
        } else if (info) {
            res.status(401).send("401 Unauthorized")
        } else {
            req.login(user, function(err) {
                if (err) {
                    res.status(500).send("REQ.LOGIN ERROR");
                } else {
                    res.redirect('/app')
                }
            })
        }
    })(req, res, next);
});

//Serve Login Page
router.get('/logout', function(req, res){
    req.logout();
    res.redirect('/');
 });

//Test if the app logged in
function isLoggedIn(req, res, next) {
    if(req.isAuthenticated()) {
      return next();
    }
    return res.redirect('/app/login');
  }

//Database
  
function Query(query) {
    const client = new Client({
        connectionString: process.env.DATAURI,
        ssl: true,
    });
    client.connect();
    client.query(query, (err, res) => {
        if (err) {
            console.log(err);
        } else {
            client.end();
            console.log(res.rows);
            return res;
        }
    })

}

module.exports = router