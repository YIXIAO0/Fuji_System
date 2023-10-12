const { ipcRenderer } = require('electron');

const { renderProductTable } = require('./productTableRenderer');
const { renderProductGallery } = require('./productGalleryRenderer');
const uiHandlers = require('./uiHandlers');
const searchHandler = require('./searchHandler');
const ipcHandlers = require('./ipcHandlers');  // Assuming you also exported the functions

// Now use the functions as needed:
document.getElementById('tableToggle').addEventListener('click', uiHandlers.toggleTableView);
document.getElementById('galleryToggle').addEventListener('click', uiHandlers.toggleGalleryView);

ipcRenderer.on('products-data', (event, products) => {
    renderProductTable(products);  // Render products in table format
    renderProductGallery(products);  // Render products in gallery format
});

ipcRenderer.on('products-data-error', (event, error) => {
    console.error('Error received from main process:', error);
    // Optionally handle the error in the UI, e.g., show an error message to the user
});


document.getElementById('productSearchBar').addEventListener('input', () => {
    const searchQuery = document.getElementById('productSearchBar').value;
    if (searchQuery.trim() === '') {
        // If search bar is empty, request all products
        ipcRenderer.send('request-all-products');
    } else {
        ipcRenderer.send('perform-product-search', searchQuery);
    }
});

document.addEventListener('click', (event) => {
    if (event.target.classList.contains('product-id-link') || event.target.classList.contains('product-details-button')) {
        event.preventDefault();
        // Fetching the product data (or just the product ID) from the clicked element
        const productData = JSON.parse(event.target.getAttribute('data-product'));
        // Sending the product data to the main process to open the product details page
        ipcRenderer.send('open-product-details', productData);
    }
});

