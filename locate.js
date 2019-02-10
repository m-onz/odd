
function distanceBetweenCoords(lat1, lon1, lat2, lon2) {
  var p = 0.017453292519943295;    // Math.PI / 180
  var c = Math.cos;
  var a = 0.5 - c((lat2 - lat1) * p)/2 +
          c(lat1 * p) * c(lat2 * p) *
          (1 - c((lon2 - lon1) * p))/2;
  return 12742 * Math.asin(Math.sqrt(a)); // 2 * R; R = 6371 km
}

function distanceToObject (width) {
  // calculate with regression from calibration step
  var d = (width / 958.657682) ** (-1.204914734707)
  return d
}

var EARTH_RADIUS = 6378.1

// camera lat, lon
var LAT = 52.20472
var LON = 0.14056

var OBJECT_WIDTH_CM = 30 // 30cm
var IMAGE_WIDTH = 640
var HEADING = 0
var POSX = 0
var POSY = 0

function calculatePosition (tx, ty, twidth) {
  var r = distanceToObject(twidth)
  var midX = (POSX + (r * Math.cos(HEADING)))
  var midY = (POSY + (r * Math.sin(HEADING)))
  var cmPerPx = OBJECT_WIDTH_CM / twidth
  var pxFromMidpoint = (IMAGE_WIDTH / 2) - (tx + (twidth / 2))
  var cmFromMidpoint = pxFromMidpoint * cmPerPx
  var tOffsetHeading = Math.atan(cmFromMidpoint / r) // theta
  var rPrime = cmFromMidpoint / Math.sin(tOffsetHeading)
  var trackedX = POSX + (rPrime + Math.cos(HEADING + tOffsetHeading))
  var trackedY = POSY + (rPrime + Math.sin(HEADING + tOffsetHeading))
  return { x: trackedX, y: trackedY, distance: r, offset: tOffsetHeading }
}

function toRadians (val) {
  return radians = val * (Math.PI / 180)
}

function toDegrees (val) {
  return degrees = val * (180 / Math.PI)
}

function plotLocation (distance, offset) {
  var bearing = toRadians(offset) // in radians
  var lat = toRadians(LAT)
  var lon = toRadians(LON)
  console.log(lat, lon)
  var tlat = Math.asin(Math.sin(lat) * Math.cos(distance / EARTH_RADIUS) +
    Math.cos(lat) * Math.sin(distance / EARTH_RADIUS) * Math.cos(bearing))
  var tlon = lon + Math.atan2(Math.sin(bearing) * Math.sin(distance / EARTH_RADIUS)
  * Math.cos(lat), Math.cos(distance / EARTH_RADIUS) - Math.sin(lat) * Math.sin(tlat))
  console.log(lat, lon, tlat, tlon)
  var tdistance = distanceBetweenCoords(LAT, LON, tlat, tlon)
  console.log('::', distance)
  console.log('::', tdistance)
  // compare measurements.
  // compare with ground truth
  return { lat: tlat, lon: tlon, distance: tdistance }
}

setInterval(function () {
  var {distance, offset} = calculatePosition(Math.floor(Math.random()*300),
  Math.floor(Math.random()*300), Math.floor(Math.random()*300))
  console.log(plotLocation(distance, offset))
}, 500)
