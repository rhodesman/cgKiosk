'use strict';
//var Curl = require('node-libcurl').Curl;
var unirest = require("unirest");

exports.betamore_events = function (request, response) {
  var req = unirest.get("https://betamore.spaces.nexudus.com/en/events");
  req.headers({
    "Content-Type": "application/json"
  });
  req.end(function (res) {
    if (res.error) throw new Error(res.error);
    response.json(res.body);
  });
};

exports.betamore_event_bookings = function (request, response) {
  var reqDate = request.params.date;
  var reqURL = "https://betamore.spaces.nexudus.com/en/bookings/fullCalendarEvents?start=" + reqDate + "&end=" + reqDate;
  var req = unirest.get(reqURL);
  req.headers({
    "Content-Type": "application/json"
  });
  req.end(function (res) {
    if (res.error) throw new Error(res.error);
    response.json(res.body);
  });
}
