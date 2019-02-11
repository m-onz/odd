import os
import random
from scipy import ndarray, ndimage

# image processing library
import skimage as sk
from skimage import transform
from skimage import util
from skimage import io

def blur (image_array: ndarray):
    return ndimage.uniform_filter(image_array, size=(5, 5, 1))

def random_rotation(image_array: ndarray):
    # pick a random degree of rotation between 25% on the left and 25% on the right
    random_degree = random.uniform(-80, 80)
    return sk.transform.rotate(image_array, random_degree)

def random_noise(image_array: ndarray):
    # add random noise to the image
    return sk.util.random_noise(image_array)

def horizontal_flip(image_array: ndarray):
    # horizontal flip doesn't need skimage, it's easy as flipping the image array of pixels !
    return image_array[:, ::-1]

def vertical_flip(image_array: ndarray):
    return image_array[::-1, :]

# dictionary of the transformations we defined earlier
available_transformations = {
    'blur': blur,
    'rotate': random_rotation,
    'noise': random_noise,
    'horizontal_flip': horizontal_flip,
    'vertical_flip': vertical_flip
}

folder_path = './drone'
num_files_desired = 1000

# find all files paths from the folder
images = [os.path.join(folder_path, f) for f in os.listdir(folder_path) if os.path.isfile(os.path.join(folder_path, f))]

num_generated_files = 0
while num_generated_files <= num_files_desired:
    # random image from the folder
    image_path = random.choice(images)
    # read image as an two dimensional array of pixels
    image_to_transform = sk.io.imread(image_path)
    # random num of transformation to apply
    num_transformations_to_apply = random.randint(1, len(available_transformations))

    num_transformations = 0
    transformed_image = None
    while num_transformations <= num_transformations_to_apply:
        # random transformation to apply for a single image
        key = random.choice(list(available_transformations))
        transformed_image = available_transformations[key](image_to_transform)
        num_transformations += 1
        print('saving%s', folder_path)
        new_file_path = '%s/augmented_image_%s.jpg' % (folder_path, num_generated_files)
        # write image to the disk
        io.imsave(new_file_path, transformed_image)
        num_generated_files += 1
