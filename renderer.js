const { ipcRenderer } = require('electron');

const { renderProductTable } = require('./productTableRenderer');
const { renderProductGallery } = require('./productGalleryRenderer');
const {renderCustomerTable} = require('./customerTableRenderer');
const uiHandlers = require('./uiHandlers');
const ipcHandlers = require('./ipcHandlers');  // TODO:
const { eventNames } = require('process');
const tableToggle = document.getElementById('tableToggle');
const galleryToggle = document.getElementById('galleryToggle');
const productSearchBar = document.getElementById('productSearchBar');
const customerSearchBar = document.getElementById('customerSearchBar');
const productsTableBody = document.getElementById('productsTableBody');
const customersTableBody = document.getElementById('customersTableBody');

if (tableToggle) {
    tableToggle.addEventListener('click', uiHandlers.toggleTableView);
}

if (galleryToggle) {
    galleryToggle.addEventListener('click', uiHandlers.toggleGalleryView);
}

ipcRenderer.on('products-data', (event, products) => {
    if (productsTableBody) {
        renderProductTable(products);
        renderProductGallery(products);
        console.log("Received products data");
    }
});

ipcRenderer.on('customers-data', (event, customers) => {
    if (customersTableBody) {
        renderCustomerTable(customers);
        console.log("Received customers data");
    }
});

ipcRenderer.on('products-data-error', (event, error) => {
    console.error('Error received from main process:', error);
    // Optionally handle the error in the UI, e.g., show an error message to the user
});

ipcRenderer.on('customers-data-error', (event, error) => {
    console.error('Error received from main process:', error);
    // Optionally handle the error in the UI, e.g., show an error message to the user
});


if (productSearchBar) {
    productSearchBar.addEventListener('input', () => {
        const searchQuery = productSearchBar.value;
        if (searchQuery.trim() === '') {
            // If search bar is empty, request all products
            ipcRenderer.send('request-all-products');
        } else {
            ipcRenderer.send('perform-product-search', searchQuery);
        }
    });
}

if (customerSearchBar) {
    customerSearchBar.addEventListener('input', () => {
        const searchQuery = customerSearchBar.value;
        if (searchQuery.trim() === '') {
            // If search bar is empty, request all products
            ipcRenderer.send('request-all-customers');
        } else {
            ipcRenderer.send('perform-customer-search', searchQuery);
        }
    });
}

document.addEventListener('click', (event) => {
    if (event.target.classList.contains('product-id-link') || event.target.classList.contains('product-details-button')) {
        event.preventDefault();
        // Fetching the product data (or just the product ID) from the clicked element
        const productData = JSON.parse(event.target.getAttribute('data-product'));
        // Sending the product data to the main process to open the product details page
        ipcRenderer.send('open-product-details', productData);
    }
});

// Navigation logic for the left panel buttons
document.addEventListener('DOMContentLoaded', function() {
    const buttons = document.querySelectorAll(".left-panel .panel-button");
    // Event listener to adjust the 'active' class
    ipcRenderer.send('request-all-customers');
    buttons.forEach(button => {
        button.addEventListener('click', function() {
            // Remove 'active' class from all buttons
            buttons.forEach(innerButton => {
                innerButton.classList.remove('active');
            });
            // Add 'active' class to the clicked button
            button.classList.add('active');
            // Navigation logic
            if (button.textContent.trim() === "Product Info") {
                ipcRenderer.send('navigate', 'productSearchPage.html');
            } else if (button.textContent.trim() === "Customer Info") {
                ipcRenderer.send('navigate', 'customerSearchPage.html'); 
            }
        });
    });
});
