/**
 * Background Images Data
 *
 * Lists all available background images for the hero background slider
 * Images from /images folder - catalog pages
 */

// Helper function to properly encode special characters in filenames
const getImagePath = (filename) => {
  return `/images/${filename.replace('[', '%5B').replace(']', '%5D')}`;
};

export const BACKGROUND_IMAGES = [
  getImagePath('Wardrobe_Catalogue_Nirmanbook_20260408_170333[1]_page-0001.jpg'),
  getImagePath('Wardrobe_Catalogue_Nirmanbook_20260408_170333[1]_page-0002.jpg'),
  getImagePath('Wardrobe_Catalogue_Nirmanbook_20260408_170333[1]_page-0003.jpg'),
  getImagePath('Wardrobe_Catalogue_Nirmanbook_20260408_170333[1]_page-0004.jpg'),
  getImagePath('Wardrobe_Catalogue_Nirmanbook_20260408_170333[1]_page-0005.jpg'),
];

export default BACKGROUND_IMAGES;
