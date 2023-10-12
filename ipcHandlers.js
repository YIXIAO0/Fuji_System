const { ipcRenderer } = require('electron');
const { renderProductTable } = require('./productTableRenderer');
const { renderProductGallery } = require('./productGalleryRenderer');

function handleProductDataError(event, errorMessage) {
    console.error("Error fetching products:", errorMessage);
}

function handleProductData(event, products) {
    // Here, we'd ideally use the table and gallery rendering functions
    renderProductTable(products);
    renderProductGallery(products);
}

ipcRenderer.on('products-data-error', handleProductDataError);
ipcRenderer.on('products-data', handleProductData);

module.exports = { handleProductDataError, handleProductData };
