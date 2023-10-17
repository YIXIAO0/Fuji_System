const { app, BrowserWindow, ipcMain } = require('electron');
const connection = require('./database'); // Connect the database
const productSearchHandler = require('./productSearchHandler'); // Product Search Handler
const customerSearchHandler = require('./customerSearchHandler'); // Customer Search Handler
const { eventNames } = require('process');
let mainWindow;

app.on('ready', () => {
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 1050,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            enableRemoteModule: true
        }
    });

    // Set up the event listener to catch loading failures
    mainWindow.webContents.once('did-fail-load', (event, errorCode, errorDescription) => {
        console.error("Failed to load:", errorCode, errorDescription);
    });
    
    mainWindow.loadFile('productSearchPage.html');

    mainWindow.webContents.on('did-finish-load', () => {
        connection.query('SELECT * FROM Products', (err, results) => {
            if (err) {
                mainWindow.webContents.send('products-data-error', err.message);
            } else {
                mainWindow.webContents.send('products-data', results);
            }
        });
    });

});

ipcMain.on('navigate', (event, page) => {
    mainWindow.loadFile(page);
});


// Listen for the product search request from the renderer
ipcMain.on('perform-product-search', (event, searchQuery) => {
    productSearchHandler.handleSearch(searchQuery, connection)
    .then(results => {
        mainWindow.webContents.send('products-data', results);
    })
    .catch(error => {
        console.error('Error fetching products:', error);
        mainWindow.webContents.send('products-data-error', error.message);
    });
});

ipcMain.on('request-all-products', (event) => {
    connection.query('SELECT * FROM Products', (err, results) => {
        if (err) {
            mainWindow.webContents.send('products-data-error', err.message);
        } else {
            mainWindow.webContents.send('products-data', results);
        }
    });
});

ipcMain.on('open-product-details', (event, productData) => {
    mainWindow.webContents.once('did-fail-load', (event, errorCode, errorDescription) => {
        console.error("Failed to load:", errorCode, errorDescription);
    });
    
    mainWindow.webContents.once('did-finish-load', () => {
        // Once the file is loaded, send the product data to the renderer
        mainWindow.webContents.send('product-details', productData);
    });

    mainWindow.loadFile('productDetails.html');
});

ipcMain.on('open-customer-details', (event, customerData) => {
    mainWindow.webContents.once('did-fail-load', (event, errorCode, errorDescription) => {
        console.error("Failed to load:", errorCode, errorDescription);
    });

    mainWindow.webContents.once('did-finish-load', () => {
        // Once the file is loaded, send the customer data to the renderer
        mainWindow.webContents.send('customer-details', customerData);
    });

    mainWindow.loadFile('customerDetails.html');
});


// Listen for the customer search request from the renderer
ipcMain.on('perform-customer-search', (event, searchQuery) => {
    customerSearchHandler.handleSearch(searchQuery, connection)
    .then(results => {
        mainWindow.webContents.send('customers-data', results);
    })
    .catch(error => {
        console.error('Error fetching customers:', error);
        mainWindow.webContents.send('customers-data-error', error.message);
    });
});

ipcMain.on('request-all-customers', (event) => {

    connection.query('SELECT * FROM Customers', (err, results) => {
        if (err) {
            mainWindow.webContents.send('customers-data-error', err.message);
        } else {
            mainWindow.webContents.send('customers-data', results);
        }
    });
});

ipcMain.on('navigate-back-to-product-search', () => {
    mainWindow.loadFile('productSearchPage.html');
});

ipcMain.on('navigate-back-to-customer-search', () => {
    mainWindow.loadFile('customerSearchPage.html');
})

ipcMain.on('fetch-sales-data', (event, data) => {
    const { productID, fromDate, toDate } = data;

    const query = `
    SELECT o.orderDate, SUM(op.productQuantity) AS totalSales
    FROM OrderProducts AS op
    JOIN Orders As o ON op.orderID = o.orderID
    WHERE op.productID = ? 
    AND o.orderDate BETWEEN ? AND ?
    GROUP BY o.orderDate
    ORDER BY o.orderDate;
    `;

    connection.query(query, [productID, fromDate, toDate], (err, rows) => {
        if (err) {
            event.reply('fetch-sales-data-error', err.message);
        } else {
            event.reply('fetch-sales-data-success', rows);
        }
    });
});

ipcMain.on('fetch-customer-distribution-data', (event, data) => {
    const { productID, fromDate, toDate } = data;

    const query = `
    SELECT c.customerCategory_0 AS category, SUM(op.productQuantity) AS totalSales
    FROM OrderProducts AS op
    JOIN Orders AS o ON op.orderID = o.orderID
    JOIN Customers AS c ON o.customerID = c.customerID
    WHERE op.productID = ?  
    AND o.orderDate BETWEEN ? AND ?
    GROUP BY c.customerCategory_0
    ORDER BY totalSales DESC;
    `;

    connection.query(query, [productID, fromDate, toDate], (err, rows) => {
        if (err) {
            event.reply('fetch-customer-distribution-data-error', err.message);
        } else {
            event.reply('fetch-customer-distribution-data-success', rows);
        }
    });
});


ipcMain.on('fetch-product-sales-history-data', (event, data) => {
    const { productID, fromDate, toDate } = data;

    const query = `
    SELECT 
        o.orderID, 
        o.orderDate,
        o.customerID,
        c.customerName,
        op.productQuantity,
        (op.productQuantity * p.productUnitPrice) AS totalPrice
    FROM 
        Orders o
    JOIN 
        OrderProducts op ON o.orderID = op.orderID
    JOIN 
        Products p ON op.productID = p.productID
    JOIN 
        Customers c ON o.customerID = c.customerID
    WHERE 
        p.productID = ?
    AND
        o.orderDate BETWEEN ? AND ?
    `;

    connection.query(query, [productID, fromDate, toDate], (err, rows) => {
        if (err) {
            event.reply('fetch-product-sales-history-data-error', err.message);
        } else {
            event.reply('fetch-product-sales-history-data-success', rows);
        }
    });
});

ipcMain.on('get-contacts-for-company', (event, data) => {
    const customerID = data;
    const query = `
    SELECT  c.contactID, 
            c.contactFirstName, 
            c.contactLastName, 
            c.contactPhone, 
            c.contactEmail, c.
            contactNotes
    FROM Contacts c
    JOIN CustomerContacts cc ON c.contactID = cc.contactID
    WHERE cc.customerID = ${customerID};`

    connection.query(query, customerID, (err, rows) => {
        if (err) {
            event.reply('get-contacts-for-company-error', err.message);
        } else {
            event.reply('get-contacts-for-company-success', rows);
        }
    });
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createMainWindow();  // Assuming you move your mainWindow creation logic to a function
    }
});