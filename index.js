
var cv = require('opencv4nodejs')
var distance = require('euclidean-distance')
var { grabFrames } = require('./utils.js')
var bgSubtractor = new cv.BackgroundSubtractorMOG2()

var fs = require('fs')

const lccs = ['drone', 'negative']

var hog = new cv.HOGDescriptor({
  winSize: new cv.Size(40, 40),
  blockSize: new cv.Size(16, 16),
  blockStride: new cv.Size(8, 8),
  cellSize: new cv.Size(8, 8),
  L2HysThreshold: 0.2,
  nbins: 9,
  gammaCorrection: true,
  signedGradient: true
})

 var svm = new cv.SVM({
  kernelType: cv.ml.SVM.RBF,
  c: 12.5,
  gamma: 0.50625
})

function getHog (img) {
  let im = img;
  if (im.rows !== 40 || im.cols !== 40) {
    im = im.resize(40, 40)
  }
  return hog.compute(im)
}

svm.load('./svm/model.xml')

function drawRectAroundBlobs (binaryImg, dstImg, minPxSize, fixedRectWidth) {
  const {
    centroids,
    stats
  } = binaryImg.connectedComponentsWithStats();
  var rects = []
  for (let label = 1; label < centroids.rows; label += 1) {
    const [x1, y1] = [stats.at(label, cv.CC_STAT_LEFT), stats.at(label, cv.CC_STAT_TOP)];
    const [x2, y2] = [
      x1 + (fixedRectWidth || stats.at(label, cv.CC_STAT_WIDTH)),
      y1 + (fixedRectWidth || stats.at(label, cv.CC_STAT_HEIGHT))
    ];
    const w = stats.at(label, cv.CC_STAT_WIDTH);
    const h =  stats.at(label, cv.CC_STAT_HEIGHT);
    const size = stats.at(label, cv.CC_STAT_AREA);
    const blue = new cv.Vec(255, 0, 0);
    if (minPxSize < size) {
      // dstImg.drawRectangle(new cv.Point(x1, y1), new cv.Point(x2, y2), new cv.Vec(255, 0, 0), 2, cv.LINE_8);
      rects.push(new cv.Rect(x1, y1, w, h))
    }
    // const indices = cv.NMSBoxes(
  }
  return rects
}

var delay = 50
var once = false

var debounce = true

setInterval(function () {
  debounce = true
}, 1000)

var delay = 50

grabFrames('/dev/video0', delay, (frame) => {
  var foreGroundMask = bgSubtractor.apply(frame)
   var iterations = 2
   var dilated = foreGroundMask.dilate(
     cv.getStructuringElement(cv.MORPH_ELLIPSE, new cv.Size(4, 4)),
     new cv.Point(-1, -1),
     iterations)
   var blurred = dilated.blur(new cv.Size(10, 10))
   var thresholded = blurred.threshold(200, 255, cv.THRESH_BINARY)
   var minPxSize = 100
   var rects = drawRectAroundBlobs(thresholded, frame, minPxSize)
   rects.forEach(function (r, index) {
      var y = frame.copy()
      var x = y.getRegion(r)
      if (!x) return;
      var prediction = svm.predict(getHog(x))
      console.log(':: ', lccs[parseInt(prediction)], prediction)
      if (parseInt(prediction) === 0) {
          console.log('test!', r)
          frame.drawRectangle(new cv.Point(r.x, r.y), new cv.Point(r.x + r.width, r.y + r.height), new cv.Vec(255, 0, 0), 2, cv.LINE_8);
      }
   })
   // tracker.update(frame, rects)
   cv.imshow('frame', frame)
})

// var tracker = new cv.TrackerKCF()
// tracker.update(frame)
// tracker.init(frame, new cv.Rect(r.x-40, r.y-40, 80, 80));
//

// setInterval(function () {
//   console.log('reset')
//   once = false
// }, 5000)
