var weatherJson = [];
var trafficJson = [];
var eventJson = [];
var buisnessJson = [];
var autoClose = null;
var currentAction;
var dateNow = new Date();
var todayDate = dateNow.getDate();

$(document).ready(function() {
  var eventSettings = {
    url: "/api/events",
    method: "GET"
  }

  getWeather();
  getTraffic();
  getBusinesses();
  adjustMap();
  $.ajax(eventSettings).done(function (response) {
    getEvents(response);
  });
  $('section .list').on('scroll', function(e) {
    if(reset != null) {
      clearTimeout(reset);
    }
    var bottPos = $(this).find('ul').outerHeight() - $(this).height();
    if($(this).scrollTop() > 40) {
      $(this).addClass('top');
    }else if($(this).scrollTop() <= 40) {
      $(this).removeClass('top');
    }
    if(bottPos < ($(this).scrollTop() + 40)) {
      $(this).removeClass('bottom');
    }else if(bottPos > $(this).scrollTop()) {
      $(this).addClass('bottom');
    }
    reset = setTimeout(function(){
      $('section .list').each(function() {
        $(this).scrollTop(0);
      });
    }, 30000);
  });
  window.setInterval(function(){
    getTraffic();
    getWeather();
    $.ajax(eventSettings).done(function (response) {
      getEvents(response);
    });
  }, 60000);
  registerUI();
});

function searchArray(idKey, myArray, _callback){
  for (var n=0; n < myArray.length; n++) {
    if (myArray[n].id === idKey || myArray[n].Id === idKey) {
      return _callback(myArray[n]);
    }
  }
  return _callback(0);
}

function adjustMap() {
  var mapHeight = $('#cgMap').height();
  $('.city-garage').css('width', mapHeight);
}

/****
  Functions for Displaying Businesses
****/
function getBusinesses() {
  var csvData = '/dist/businesses.csv';
  $.ajax({
        type: "GET",
        url: csvData,
        dataType: "text",
        success: function(data) {
          var bizData = processData(data);
          displayBusinesses(bizData);
        }
     });

   function processData(allText) {
     var allTextLines = allText.split(/\r\n|\n/);
     var headers = allTextLines[0].split(',');
     var lines = [];
     for (var i=1; i<allTextLines.length; i++) {
         var data = allTextLines[i].split(',');
         if (data.length == headers.length) {

             var tarr = [];
             for (var j=0; j<headers.length; j++) {
               //console.log(headers[j]);
                 //tarr.push(headers[j]+":"+data[j]);
                 tarr.push(data[j]);
             }
             lines.push(tarr);
         }
     }
     return lines;
   }
}
function displayBusinesses(data) {
  buisnessJson = data;
  $('#directory .list ul').empty();
  for (i = 0; i < data.length; i++) {
    var thisData = data[i];
    var logoPath;
    if(thisData[3] != "") {
      logoPath = "<img src='/img/logos/" + thisData[3] + "' alt='" + thisData[1] + "'>";
      if(thisData[4] != "") {
        logoPath = logoPath + "<img src='/img/logos/" + thisData[4] + "' alt='" + thisData[2] + "'>";
      }
    }else {
      if(thisData[1] != "") {
        logoPath = "<h3>" + thisData[1] + "</h3>";
      }else {
        logoPath = "<h3>Space Available!</h3>" ;
      }
    }
    var dirStart = "<li id='" + thisData[0] + "'>";
    var dirLogo = "<div class='logo'>" + logoPath + "</div>";
    var dirSuite = "<div class='location'><span class='type'>Suite</span><span class='num'>" + thisData[0] + "</span></div>";
    var dirEnd = "</li>";
    $('#directory .list ul').append(dirStart + dirLogo + dirSuite + dirEnd);
  }
  checkHeight();
}

/****
  Functions for Displaying Events
****/
function getEvents(eventData) {
  $('#events .list ul').empty();
  eventData = eventData.CalendarEvents;
  eventJson = eventData;

  for (i = 0; i < eventData.length; i++) {
    /**
      First we parse the Date and Time of the Event
    **/
    const MONTHS = [
          {label: 'January', abbr: 'Jan', value: '00'},
          {label: 'February', abbr: 'Feb', value: '01'},
          {label: 'March', abbr: 'Mar', value: '02'},
          {label: 'April', abbr: 'Apr', value: '03'},
          {label: 'May', abbr: 'May', value: '04'},
          {label: 'June', abbr: 'Jun', value: '05'},
          {label: 'July', abbr: 'Jul', value: '06'},
          {label: 'August', abbr: 'Aug', value: '07'},
          {label: 'September', abbr: 'Sep', value: '08'},
          {label: 'October', abbr: 'Oct', value: '09'},
          {label: 'November', abbr: 'Nov', value: '10'},
          {label: 'December', abbr: 'Dec', value: '11'}
      ];
    function parseMonth(digit) {
        return Object.values(MONTHS).filter((month) => {
            if (month.value == digit) {
                return month;
            }
        }, {});
    }
    var thisDate = new Date(eventData[i].StartDate);
    var thisMonth = parseMonth(thisDate.getMonth());
    var thisDay = thisDate.getDate();
    var thisHour = thisDate.getHours();
    var thisMinute = thisDate.getMinutes();
    var thisTime;
    if(thisMinute === 0) {
      thisMinute = "00";
    }
    if(thisHour > 12) {
      thisHour = thisHour - 12;
      thisTime = thisHour + ":" + thisMinute + " PM";
    }else {
      thisTime = thisHour + ":" + thisMinute + " AM";
    }
    var eventStart = "<li id='" + eventData[i].Id + "'>";
    var eventDate = "<div class='date'><span class='to'>" + thisMonth[0].abbr + " " + thisDay + "</span><span class='from'>" + thisTime + "</span></div>";
    var eventTitle = "<div class='title'>" + eventData[i].Name + "</div>";
    var eventEnd = "</li>";
    $('#events .list ul').append(eventStart + eventDate + eventTitle + eventEnd);
    if(thisDay == todayDate) {
      drawMap(eventData[i])
    }
  }
  checkHeight();
  /*if($('#events').height() < $('.list ul').height()) {
    $('#events').addClass("shadow bottom");
  }*/
}

function drawMap(data) {
  var getEventData = "/api/space/";

  var queryDate = new Date(data.StartDate);
  var month = queryDate.getUTCMonth(); //months from 1-12
  var day = queryDate.getUTCDate();
  var year = queryDate.getUTCFullYear();

  getEventData = getEventData + year + "-" + month + "-" + day;

  $.ajax({
    url: getEventData,
    type: 'GET',
    success: function(res) {
      if(res.length > 0) {
        var locSpace = [];
        for(j=0;j < res.length; j++) {
          locSpace.push(res[j].resourceName);
          if(res[j].resourceName == "Classroom") {
            $('.conf.classroom').addClass('show');
          }else if(res[j].resourceName == "Classroom") {
            $('.conf.classroom').addClass('show');
          }
        }
        console.log(locSpace);
      }

    }
  });

}

/****
  Functions for Displaying Weather
****/
function getWeather() {
  var weatherAPIurl = "//api.openweathermap.org/data/2.5/forecast?id=4347820&units=imperial&APPID=710db604a964e2f52caed6f5217cb301";
  $.ajax({
    url: weatherAPIurl,
    type: 'GET',
    success: function(res) {
      if(res.cod == "200") {
        const forecast = {
          today:{type:'',temp:0},
          tomorrow:{type:'',temp:0},
          weekend:{type:'',temp:0}
        };
        weatherJson = res.list;
        const tempWeather = {
          today:[],
          tomorrow:[],
          weekend:[]
        }
        //console.log(weatherJson);


        for (i = 0; i < weatherJson.length; i++) {
          var thisTime = new Date(weatherJson[i].dt * 1000);
          if(i == 0){
            //capture current temperature
            forecast.today.temp = weatherJson[i].main.temp;
          }
          if(thisTime.getDate() == todayDate) {
            //capture today's weather data
            tempWeather.today.push({
              clouds:weatherJson[i].clouds.all,
              type:weatherJson[0].weather[0].id,
              desc:weatherJson[i].weather[0].main,
              temp:weatherJson[i].main.temp
            });
          }
          if(thisTime.getDate() > todayDate || thisTime.getDate() < todayDate ){
            //capture future days weather
            if(thisTime.getDate() == (todayDate + 1)) {
              tempWeather.tomorrow.push({
                clouds:weatherJson[i].clouds.all,
                type:weatherJson[i].weather[0].id,
                desc:weatherJson[i].weather[0].main,
                temp:weatherJson[i].main.temp
              });
            }
            if(thisTime.getDay() == 6 || thisTime.getDay() == 7) {
              tempWeather.weekend.push({
                clouds:weatherJson[i].clouds.all,
                type:weatherJson[i].weather[0].id,
                desc:weatherJson[i].weather[0].main,
                temp:weatherJson[i].main.temp
              });
            }
          }
        }// end for loop
        //console.log(tempWeather);
        processWeather(tempWeather);
      }//end if success api data
    }//end ajax success
  });//end ajax
}
function processWeather(rawWeather) {
  const weatherCalc = {
    today:{temp:0,clouds:0},
    tomorrow:{temp:0,clouds:0},
    weekend:{temp:0,clouds:0}
  };
  calcMean(rawWeather.today, weatherCalc.today, '#weather .today.forcast');
  calcMean(rawWeather.tomorrow, weatherCalc.tomorrow, '#weather .tomorrow.forcast');
  calcMean(rawWeather.weekend, weatherCalc.weekend, '#weather .weekend.forcast');
  function calcMean(thisArray, thisDay, thisClass) {
    for (n = 0; n < thisArray.length; n++) {
      thisDay.temp = thisDay.temp + thisArray[n].temp;
      thisDay.clouds = thisDay.clouds + thisArray[n].clouds;
      if(thisArray[n].type >= 600 && thisArray[n].type < 700) {
        var tomSnow = thisArray[n].type;
      }
      if(thisArray[n].type >= 500 && thisArray[n].type < 600) {
        var tomRain = thisArray[n].type;
      }
      var precip = thisArray[n].type;

      if(n == (thisArray.length - 1)) {
        var x = n + 1;
        thisDay.temp = thisDay.temp / x;
        thisDay.temp = Number((thisDay.temp).toFixed(0));
        thisDay.clouds = thisDay.clouds / x;
        thisDay.clouds = Number((thisDay.clouds).toFixed(0));
        $(thisClass).empty();
        var clouds;
        if(thisDay.clouds < 10) {
          clouds = 0;
        }else if(thisDay.clouds >= 10 && thisDay.clouds < 50) {
          clouds = 1;
        }if(thisDay.clouds >= 50) {
          clouds = 2;
        }
        if(tomSnow != undefined) {
          precip = tomSnow;
        }else if(tomRain != undefined) {
          precip = tomRain;
        }
        var weather = "<i class='precip-" + precip + "'></i> <span>" + thisDay.temp + "  &deg;F</span>";
        $(thisClass).append(weather);
      }
    }
  };
}

/****
  Functions for Displaying Traffic
****/
function getTraffic() {
  var restAPIurl = "//www.mapquestapi.com/traffic/v2/incidents?key=8XgDkfPDnbnIAJIRX95HAQnBnyVB89dP&boundingBox=39.082695,-76.778641,39.413972,-76.415405&filters=congestion,incidents,event";
  //var restAPIurl = "http://www.mapquestapi.com/traffic/v2/incidents?key=8XgDkfPDnbnIAJIRX95HAQnBnyVB89dP&boundingBox=39.082695,-76.778641,39.413972,-76.415405";
  //var restAPIurl = "http://localhost:8080/dist/traffic_response2.json";
  $.ajax({
    url: restAPIurl,
    type: 'GET',
    success: function(res) {
      const roads = [];
      function search(nameKey, myArray, _callback){
        for (var n=0; n < myArray.length; n++) {
          if (myArray[n].name === nameKey) {
            myArray[n].tally = myArray[n].tally + 1;
            return _callback(myArray[n]);
          }
        }
        return _callback(0);
      }
      trafficJson = res.incidents;
      if(trafficJson.length == 0) {
        console.log("No Traffic!");
      }else {
        for (i = 0; i < trafficJson.length; i++) {
          var thisName = trafficJson[i].parameterizedDescription.roadName;
          var thisType = trafficJson[i].type;
          var thisSevere = trafficJson[i].severity;
          roads.push({id:trafficJson[i].id ,name:thisName, tally:1, type:thisType, severity:thisSevere});

          /*search(thisName, roads, function(e) {
            if(e == 0) {
              roads.push({id:trafficJson[i].id ,name:thisName, tally:1, type:thisType, severity:thisSevere});
            }
          });*/
        }
      }
      displayTraffic(roads);
    }
  });
}
function displayTraffic(incidents) {
  var trafficDOM = '#traffic .list ul';
  $(trafficDOM).empty();
  if(incidents.length > 0) {
    for(var i=0; i < incidents.length; i++) {
      var thisName = incidents[i].name;
      if(incidents[i].name.length > 7) {
        if(thisName == "Baltimore Washington Pkwy") {
          thisName = "MD-295";
        }else {
          thisName = thisName.substring(0, 5) + "...";
        }
      }
      var listItem = "<li id='" + incidents[i].id + "' class='type-"+ incidents[i].type + " severity-"+ incidents[i].severity + " tally-"+ incidents[i].tally +"'><i></i><span>"+ thisName +"</span></li>";
      $(trafficDOM).append(listItem);
    }
    /*if($('#traffic').height() < ($('#traffic .traffic-list').height() + 82)) {
      var trafficHeight = $('#traffic').height() - $('#traffic h2').height() - 82;
      $('#traffic .traffic-list').height(trafficHeight);
      $('#traffic').addClass("shadow bottom");
    }*/
  }else {
    var listItem = "<li class='type-0 severity-0 tally-0'><i></i><span>No Traffic!</span></li>";
    $(trafficDOM).append(listItem);
  }
}

/****
  Functions for User Interactions and Displays
****/
function registerUI() {
  $("ul").on("click", "li", function(event){
    var clickID = $(this).attr('id');
    var thisCat = $(this).closest("section").attr('id');
    //console.log(thisCat + " " + clickID);
    if(thisCat == "traffic" && clickID != undefined) {
      searchArray(clickID, trafficJson, function(data) {
        displayAlert('traffic', data);
      });
    }else if(thisCat == "events" && clickID != undefined) {
      searchArray(+clickID, eventJson, function(data) {
        displayAlert('event', data);
      });
    }else if(thisCat == "directory" && clickID != undefined) {
      if(autoClose != null) {
        clearTimeout(autoClose);
        autoClose = null;
      }
      $( "#cgMap .city-garage" ).find( ".show" ).removeClass('show');
      var display;
      if(clickID > 100 && clickID < 200) {
        display = ".suite.o-" + clickID;
      }else {
        display = ".suite.s-" + clickID;
      }
      highlightMap(display, 5000);
    }
  });
}
function displayAlert(type, data) {
  $('#alertDetails .details').empty();
  if(type == 'traffic') {
    var thisTitle = "<h3 class='type-"+ data.type + " severity-"+ data.severity +"'><i></i>"+ data.parameterizedDescription.roadName +"</h3>";
    var thisDesc = "<p>"+ data.fullDesc +"</p>";
    var thisCrossRoad = "<p>Between: "+ data.parameterizedDescription.crossRoad1+"</p>";
    $('#alertDetails .details').append(thisTitle + thisDesc + thisCrossRoad);
  }else if(type == 'event') {
    var startDate = new Date(data.StartDate);
    var endDate = new Date(data.EndDate);
    var startTime = parseDate(startDate);
    var endTime = parseDate(endDate);
    function parseDate(theDate) {
      if(theDate.getHours() > 12) {
        if(theDate.getMinutes() === 0) {
          return (theDate.getHours() - 12) + ":00" + " PM";
        }
        return (theDate.getHours() - 12) + ":" + theDate.getMinutes() + " PM";
      }else {
        if(theDate.getMinutes() === 0) {
          return theDate.getHours() + ":00" + " AM";
        }
        return theDate.getHours() + ":" + theDate.getMinutes() + " AM";
      };
    };
    startDate = (startDate.getMonth() + 1) + "/" + startDate.getDate() + "/" + startDate.getFullYear() + " " + startTime;
    endDate = (endDate.getMonth() + 1) + "/" + endDate.getDate() + "/" + endDate.getFullYear() + " " + endTime;
    var thisTitle = "<h3>"+ data.Name +"</h3>";
    var thisTime = "<div><span class='time-start'>" + startDate + "</span><span class='time-end'>" + endDate + "</span></div>";
    var thisDesc = '';
    if(data.LongDescription != null) {
      thisDesc = "<div>"+ data.LongDescription +"</div>";
    }
    if(data.VenueAddress != null) {
      var _temp = data.VenueAddress;
      var arr = _temp.split(',');
      var _loctmp = arr[1];
      var loc = _loctmp.split(' ');
      var eventLoc = ".suite.s-" + loc[2];
      highlightMap(eventLoc, 5000);
    }
    $('#alertDetails .details').append(thisTitle + thisTime + thisDesc);
  }
  $('#alertDetails').modal('show');
  autoClose = setTimeout(function(){$('#alertDetails').modal('hide');}, 30000);
}
function highlightMap(domElm, setTimer) {
  $(domElm).addClass("show");
  autoClose = setTimeout(function(){$(domElm).removeClass("show");}, setTimer);
}
function checkHeight() {
  $('section').each(function(index, value) {
    if($(this).height() < $(this).find('.list ul').height() ) {
      $(this).find('.list').addClass("shadow bottom");
    }
  });
}
