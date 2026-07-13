// app.js

'use strict';

const express = require("express");
const bodyParser = require("body-parser");
const path = require('path');
const app = express();

const port = process.env.PORT || 8089;

app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(express.static('site'));

var routes = require('./controls/routes'); //importing route
routes(app); //register the route

app.use(function (req, res) {
    res.status(404).send({
        url: req.originalUrl + ' not found'
    });
});

//app.use('/refresh', proxy(process.env.BROWSER_REFRESH_URL) );

app.listen(port, () => {
    console.log(`Server running`);

    if (process.send) {
      process.send({ event:'online', url:'http://localhost:8089/' });
      //console.log(process.env);
    };
});
