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
const productsGallery = document.getElementById('content-product-gallery-page');
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
    }
    if (productsGallery) {
        renderProductGallery(products);
    }
});

ipcRenderer.on('customers-data', (event, customers) => {
    if (customersTableBody) {
        renderCustomerTable(customers);
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
    // Check if the clicked element is within a product row with class "product-table-row"
    let row = event.target.closest('tr.product-table-row');
    if (row) {
        event.preventDefault();
        // Extract the product data from the row's data-product attribute
        const productData = JSON.parse(row.getAttribute('data-product'));
        // Sending the product data to the main process to open the product details page
        ipcRenderer.send('open-product-details', productData);
    }
});

document.addEventListener('click', (event) => {
    // Check if the clicked element is within a customer row with class "customer-table-row"
    let row = event.target.closest('tr.customer-table-row');
    if (row) {
        event.preventDefault();
        // Extract the customer data from the row's data-customer attribute
        const customerData = JSON.parse(row.getAttribute('data-customer'));
        // Sending the customer data to the main process to open the product details page
        ipcRenderer.send('open-customer-details', customerData);
    }
});


// Event delegation case: needs to deal with events on complex elements. (ensures that no matter 
// where you click within the confines of the button, the event is always correctly detected and handled.)
document.addEventListener('click', (event) => {
    let targetElement = event.target; // start with the target element itself

    // traverse up the DOM tree until we find an element with the 'product-button' class
    // or until we reach the document body
    while (targetElement != null && !targetElement.classList.contains('product-button')) {
        targetElement = targetElement.parentElement;
    }

    // if we found an element with the 'product-button' class, handle the click event
    if (targetElement && targetElement.classList.contains('product-button')) {
        event.preventDefault();

        const productData = JSON.parse(targetElement.getAttribute('data-product'));
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
            console.log(buttons);
            buttons.forEach(innerButton => {
                innerButton.classList.remove('active');
            });
            // Add 'active' class to the clicked button
            button.classList.add('active');
            // Navigation logic
            if (button.textContent.trim() === "Products") {
                ipcRenderer.send('navigate', 'productSearchPage.html');
            } else if (button.textContent.trim() === "Customers") {
                ipcRenderer.send('navigate', 'customerSearchPage.html'); 
            } else if (button.textContent.trim() === "Order Entry") {
                ipcRenderer.send('navigate', 'orderEntryPage.html');
            }  else if (button.textContent.trim() === "Master Board") {
                ipcRenderer.send('navigate', 'masterBoardPage.html'); 
            }
        });
    });
});
