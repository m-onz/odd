
var fs = require('fs')
var cv = require('opencv4nodejs')

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
  //console.log(img.getDataAsArray())
  return hog.compute(im)
}

svm.load('./model.xml')


//var img = cv.imread('.,/train/testdata/cat/cat2.jpg')
var img = cv.imread('./test3.jpg')
//var img = cv.imread('/home/xt53/Desktop/odd/train/testdata/negative/00001156.png')


// var prediction = svm.predict(getHog(img))
//
// console.log(lccs[parseInt(prediction)])








console.log(cv.HOGDescriptor.getDefaultPeopleDetector())








//
