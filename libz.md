
#todo.

Image classifcation.

(future: hog + net)

====> get dataset.
====> training + test.

video

motion detection => image classifiction on bounding boxes.


# convolutional neural nets
https://cs.stanford.edu/people/karpathy/convnetjs/docs.html

# svm
https://www.npmjs.com/package/svm

# random forest
https://github.com/mljs/random-forest
https://github.com/jessfraz/random-forest-classifier

# online random forest
https://github.com/brendonboshell/node-olearn
https://www.npmjs.com/package/irf

# decision tree
https://www.npmjs.com/package/ml-cart

# util

# download images from web.. python script.

https://github.com/ostrolucky/Bulk-Bing-Image-downloader

# feature extraction 

Some algorithms to consider for filter techniques are the Pearson and 
Spearman correlation coefficients, the chi-squared test, and 
information gain algorithms such as the Kullback–Leibler divergence.

Approaches to consider for wrapper techniques are optimization techniques 
such as genetic algorithms, tree-search algorithms such as best-first search,
 stochastic techniques such as random hill-climb algorithms, and heuristic 
techniques such as recursive feature elimination and simulated annealing. 
All of these techniques aim to select the best set of features that optimize
 the output of your model, so any optimization technique can be a candidate,
 however, genetic algorithms are quite effective and popular.

Feature extraction has many algorithms to consider, and generally focuses
 on cross-correlation of features in order to determine new features that
 minimize some error function; that is, how can two or more features be
 combined such that a minimum amount of data is lost. Relevant algorithms 
include PCA, partial least squares, and autoencoding. In NLP, latent semantic
 analysis is popular. Image processing has many specialized feature extraction
 algorithms, such as edge detection, corner detection, and thresholding, and
 further specializations based on problem domain such as face identification 
or motion detection.

# notes

moving average
binning / histogram
remove outliers with standard deviation

calcuate absolute max

```js
const absolute_max = Math.max.apply(null, measurements.map(Math.abs));
```

normalize to -1 - 1
```js
const normalized = measurements.map(value => value / absolute_max);
```

filter on prop
```js
const english_lang_users = users.filter(user => user.locale.language === 'en_US');
```

# clustering

    k-means, and variants such as k-medians
    Gaussian mixture models
    Mean-shift

# reduce dimensionality

    Various types of regressions
    PCA
    Image transformations (for example, converting an image to grayscale)
    Stemming and lemmatization (in natural language processing)


