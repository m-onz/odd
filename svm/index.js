
var fs = require('fs')
var cv = require('opencv4nodejs')
var { grabFrames } = require('../utils')

var trainDataPath = '../train/traindata'
var testDataPath = '../train/testdata'
var outPath = './'

var lccs = ['drone', 'negative']

var SVMFile = 'model.xml'

function saveConfusionMatrix(
  testDataFiles,
  predict,
  numTestImagesPerClass,
  outputFile
) {
  var confusionMat = new cv.Mat(2, 2, cv.CV_64F, 0);
  testDataFiles.forEach((files, label) => {
    files.forEach((file) => {
      var img = cv.imread(file);
      var predictedLabel = predict(img, label === 8 || label === 9);
      confusionMat.set(label, predictedLabel, confusionMat.at(label, predictedLabel) + 1);
    });
  });
  var confusionMatMatrix = [[''].concat(lccs)].concat(
    confusionMat.div(numTestImagesPerClass)
      .getDataAsArray().map((col, l) => [lccs[l]].concat(col.map(v => Math.round(v * 100) / 100)))
  );
  var csvRows = confusionMatMatrix.map(cols => cols.join(';'));
  fs.writeFileSync(outputFile, csvRows.join('\n'));
};

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
    im = im.resize(40, 40);
  }
  return hog.compute(im);
}

var trainSVM = (trainDataFiles, isAuto = false) => {
  console.log('make features');
  var samples = [];
  var labels = [];
  trainDataFiles.forEach((files, label) => {
    console.log(files)
    files.forEach((file) => {
      console.log(file)
      try {
      var img = cv.imread(file);
      var desc = getHog(img);
      if (!desc) {
        return;
      }
      samples.push(desc);
      labels.push(label);
	} catch (e) { console.log(e); }
    });
  });
  console.log('training');
  var trainData = new cv.TrainData(
    new cv.Mat(samples, cv.CV_32F),
    cv.ml.ROW_SAMPLE,
    new cv.Mat([labels], cv.CV_32S)
  );
  svm[isAuto ? 'trainAuto' : 'train'](trainData);
};

var data = lccs.map((letter) => {
  var trainDataDir = `${trainDataPath}/${letter}`;
  var testDataDir = `${testDataPath}/${letter}`;
  var train = fs.readdirSync(trainDataDir).map(file => `${trainDataDir}/${file}`);
  var test = fs.readdirSync(testDataDir).map(file => `${testDataDir}/${file}`);
  return ({ train, test });
});

var trainDataFiles = data.map(classData => classData.train);
var testDataFiles = data.map(classData => classData.test);

var numTrainImagesPerClass = trainDataFiles[0].length;
var numTestImagesPerClass = testDataFiles[0].length;
console.log('train data per class:', numTrainImagesPerClass);
console.log('test data per class:', numTestImagesPerClass);

trainSVM(trainDataFiles, false);
svm.save(`${outPath}/${SVMFile}`);
svm.load(`${outPath}/${SVMFile}`);

var errs = Array(2).fill(0);
testDataFiles.forEach((files, label) => {
  files.forEach((file) => {
    console.log('... ', file)
    var img = cv.imread(file);
    var desc = getHog(img);
    if (!desc) {
      throw new Error(`Computing HOG descriptor failed for file: ${file}`);
    }
    var predictedLabel = svm.predict(desc);
    if (label !== predictedLabel) {
      errs[label] += 1;
    }
  });
});

console.log('prediction result:');
errs.forEach((err, l) => console.log(lccs[l], err, 1 - (err / numTestImagesPerClass)));
console.log('average: ', 1 - (errs.reduce((e1, e2) => e1 + e2) / (lccs.length * numTestImagesPerClass)));

saveConfusionMatrix(
  testDataFiles,
  (img) => svm.predict(getHog(img)),
  numTestImagesPerClass,
  `${outPath}/confusionmatrix.csv`
);

//
