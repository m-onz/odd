
var cv = require('opencv4nodejs')
var distance = require('euclidean-distance')
var { grabFrames } = require('./utils.js')
var bgSubtractor = new cv.BackgroundSubtractorMOG2()

var fs = require('fs')

const lccs = [ 'drone', 'negative' ]

const hog = new cv.HOGDescriptor({
  winSize: new cv.Size(40, 40),
  blockSize: new cv.Size(20, 20),
  blockStride: new cv.Size(10, 10),
  cellSize: new cv.Size(10, 10),
  L2HysThreshold: 0.2,
  nbins: 9,
  gammaCorrection: true,
  signedGradient: true
});

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
      //dstImg.drawRectangle(new cv.Point(x1, y1), new cv.Point(x2, y2), new cv.Vec(255, 0, 0), 2, cv.LINE_8);
      rects.push(new cv.Rect(x1, y1, w, h))
    }
  }
  return rects
}

var delay = 50
// var debounce = true
// setInterval(function () {
//   debounce = true
// }, 1000)

function centroidTracker (maxDisappeared) {
  if (! (this instanceof centroidTracker)) return new centroidTracker (maxDisappeared)
  this.maxDisappeared = maxDisappeared
  this.nextObjectId = 0
  this.objects = []
  this.disappeared = []
  this.maxObjects = 11
  this.threshold = 11
  this.centroid_history = []
  var self = this

  self.register = function (centroid) {
    if (!centroid || !typeof centroid === 'object') return;
    centroid.id = self.nextObjectId
    centroid.lifetime = 0
    self.objects.push(centroid)
		self.nextObjectId += 1
  }

  self.deregister = function (objectID) {
    var o = []
    self.objects.forEach(function (i) {
        if (i.id !== objectID) o.push(i)
    })
    self.objects = o
    delete o
  }

  self.check_disappeared = function (objects) {
    if (!self.objects.length) {
      self.objects.forEach(function (d) {
        d.lifetime += 1
        if (d.lifetime > self.maxDisappeared) self.deregister(d.id)
      })
    }
  }

  self.get_centroids = function (centroids) {
    var input = []
    centroids.forEach(function (bound) {
      var x = Math.round((bound.x + (bound.x + bound.width)) / 2.0)
			var y = Math.round((bound.y + (bound.y + bound.height)) / 2.0)
      input.push({ x: x, y: y, bounds: bound })
    })
    return input
  }

  self.check_for_empty = function (input) {
    if (!self.objects.length) {
      input.forEach(function (item) {
        self.register(item)
      })
    }
  }

  self.draw_centroids = function (image) {
    self.objects.forEach(function (i, index) {
      if (i.lifetime < self.threshold) return
      self.centroid_history.push({ index: index, x: i.x, y: i.y })
      if (self.centroid_history.length > 111) self.centroid_history = []
      var alpha = 1;
      cv.drawTextBox(
        image,
        { x: i.x, y: i.y },
        [{ text: '['+index+']', fontSize: 0.3, thickness: 1, color: new cv.Vec(0,0,255) }],
        alpha
      );
      image.drawRectangle(
        new cv.Point(i.x-5, i.y-5),
        new cv.Point(i.x+5, i.y+5),
        { color: new cv.Vec(0, 0, 255), thickness: 1 }
      );
    })
  }

  self.check_limit = function () {
    if (self.objects.length > self.maxObjects) return self.objects = []
  }

  self.find_previous_centroids = function (input, image) {
    if (input.length > 200) return
    var all = []
    self.objects.forEach(function (o, oi) {
      var measurements = []
      input.forEach(function (i, ii) {
        measurements.push({
          object_id: oi,
          input_id: ii ,
          distance: distance([o.x, o.y], [i.x, i.y])
        })
      })
      measurements = measurements.sort(function (a, b) {
        return parseFloat(a.distance) > parseFloat(b.distance)
      })
      all.push(measurements[0])
    })
    all.forEach(function (measurement) {
      if (!measurement || !input[measurement.input_id].x ||
        !input[measurement.input_id].y ||
        !self.objects[measurement.object_id].x ||
        !self.objects[measurement.object_id].y
      ) return

      self.objects[measurement.object_id].x = input[measurement.input_id].x
      self.objects[measurement.object_id].y = input[measurement.input_id].y
      var latest = {
        bounds: input[measurement.input_id].bounds,
        x: self.objects[measurement.object_id].x,
        y: self.objects[measurement.object_id].y
      }
      // get ROI
      // var width = Math.abs(latest.bounds.startX - latest.bounds.endX)
      // var height = Math.abs(latest.bounds.startY - latest.bounds.endY)
      // var x = (self.objects[measurement.object_id].x - (width / 2))
      // var y = (self.objects[measurement.object_id].y - (height /2))
      // var p = './raw/' + Date.now() + '.png'
      // if (debounce) {
      //   cv.imwrite(p, image.getRegion(new cv.Rect(x, y, width, height)))
      // }
      self.objects[measurement.object_id].lifetime += 1
      if (self.objects[measurement.object_id].lifetime > self.maxDisappeared) {
        self.deregister(self.objects[measurement.object_id])
      }
      input[measurement.input_id].used = true
    })
    var unused = []
    input.forEach(function (i) {
      if (!i.used) unused.push(i)
    })
    if (input.length <= self.objects.length) {
      unused.forEach(function (u) {
        self.register(u)
      })
    }
    if (self.objects.length > 11) self.objects.length = []
  }

  self.draw_centroid_history = function (image) {
    if (!self.centroid_history.length) return
    var merged = {}
    self.centroid_history.forEach(function (y) {
      if (!merged[y.index]) merged[y.index] = []
      var exists = false
      merged[y.index].forEach(function (x){
        if (x.x === y.x && x.y === y.y) exists = true
      })
      if (!exists) merged[y.index].push({ x: y.x, y: y.y })
    })
    Object.keys(merged).forEach(function (l) {
      merged[l].forEach(function (line, index) {
        if (index < 1) return
        image.drawLine(
          new cv.Point(merged[l][index].x, merged[l][index].y),
          new cv.Point(merged[l][index-1].x, merged[l][index-1].y),
          new cv.Vec(0, 0, 255),
          2
        );
      })
    })
    // console.log(self.centroid_history)
    // console.log(this.objects)
  }

  self.update = function (image, centroids) {
    self.check_disappeared (centroids)
    var input = self.get_centroids (centroids)
    self.check_for_empty (input)
    self.check_limit ()
    self.find_previous_centroids (input, image)
    self.draw_centroids (image)
    self.draw_centroid_history(image)
  }
}

var tracker = centroidTracker (11000)

grabFrames('/dev/video0', 1, (frame) => {
  var foreGroundMask = bgSubtractor.apply(frame)
   var iterations = 2
   var dilated = foreGroundMask.dilate(
     cv.getStructuringElement(cv.MORPH_ELLIPSE, new cv.Size(4, 4)),
     new cv.Point(-1, -1),
     iterations)
   var blurred = dilated.blur(new cv.Size(10, 10))
   var thresholded = blurred.threshold(200, 255, cv.THRESH_BINARY)
   var minPxSize = 1
   var rects = drawRectAroundBlobs(thresholded, frame, minPxSize)
   var detections = []
   rects.forEach(function (r, index) {
      var y = frame.copy()
      if ((r.x - 20) < 0 || r.y -20 < 0 || r.x+r.width + 20 > 640 || r.y+r.height+20 > 480) return
      var x = y.getRegion(new cv.Rect(r.x-20, r.y-20, 40, 40))
      if (!x) return;
      var prediction = svm.predict(getHog(x))
      // console.log(':: ', lccs[parseInt(prediction)], prediction)
      // return
      if (parseInt(prediction) === 0 && (r.y < (480/2)+40)) {
          frame.drawRectangle(
            new cv.Point(r.x, r.y),
            new cv.Point(r.x + r.width,
            r.y + r.height),
            new cv.Vec(0, 0, 255),
            2, cv.LINE_8);
            // cv.imwrite('./gather/'+new Date().toISOString()+'.jpg', x)
            detections.push(r)
      }
   })
   tracker.update(frame, detections)
   cv.imshow('frame', frame)
})
