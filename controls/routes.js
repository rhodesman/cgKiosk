module.exports = function (app) {
  const path = require('path');
    var proxy = require('express-http-proxy');
    var dataStream = require('./controller');

    app.route('/')
      .get(function (req, res) {
          res.render('index');
      });

    app.route('/api/events/')
        .get(dataStream.betamore_events);

    app.route('/api/space/:date')
        .get(dataStream.betamore_event_bookings);

    app.route('/fw/:name')
      .get(function (req, res) {
        var fwName = req.params.name;
        var options = {
          root: path.join(__dirname, '../node_modules'),
          dotfiles: 'deny',
          headers: {
            'x-timestamp': Date.now(),
            'x-sent': true
          }
        };
        if(fwName == 'jquery') {
          res.sendFile('/jquery/dist/jquery.min.js', options, function (err) {
            if (err) {
              console.log(err);
            }
          });
        }else if(fwName == 'bootsjs') {
          res.sendFile('/bootstrap/dist/js/bootstrap.js', options, function (err) {
            if (err) {
              console.log(err);
            }
          });
        }else if(fwName == 'bootscss') {
          res.sendFile('/bootstrap/dist/css/bootstrap.css', options, function (err) {
            if (err) {
              console.log(err);
            }
          });
        }else if(fwName == 'popper') {
          res.sendFile('/popper.js/dist/umd/popper.min.js', options, function (err) {
            if (err) {
              console.log(err);
            }
          });
        }else if(fwName == 'refresh') {
          var refresh = process.env.BROWSER_REFRESH_URL;
          //function getSecondPart(str) {
          //  return str.split('host')[1];
          //}
          //refresh = getSecondPart(refresh);
          //console.log(refresh);
          res.redirect(refresh);

        }
      });
};
