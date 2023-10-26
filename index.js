const { app, BrowserWindow, ipcMain } = require('electron');
const connection = require('./database'); // Connect the database
const productSearchHandler = require('./productSearchHandler'); // Product Search Handler
const customerSearchHandler = require('./customerSearchHandler'); // Customer Search Handler
const { eventNames } = require('process');
const ElectronStore = require('electron-store');
ElectronStore.initRenderer();

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
    
    // mainWindow.loadFile('productSearchPage.html');
    mainWindow.loadFile('masterBoardPage.html');

    mainWindow.webContents.on('did-finish-load', () => {
        connection.query('SELECT * FROM Products', (err, results) => {
            if (err) {
                mainWindow.webContents.send('products-data-error', err.message);
            } else {
                mainWindow.webContents.send('products-data', results);
            }
        });
    });

    

    // IPC listeners for managing orderEntryPage windows:

    ipcMain.on('open-order-entry-page', (event, orderEntryCount) => {
        let win = new BrowserWindow({ width: 800, height: 600 });
        win.loadFile('path_to_orderEntryPage.html');
        
        windows[orderEntryCount] = win;

        win.on('closed', () => {
            delete windows[orderEntryCount];
        });
    });

    ipcMain.on('close-order-entry-page', (event, orderEntryCount) => {
        if (windows[orderEntryCount]) {
            windows[orderEntryCount].close();
        }
    });

    ipcMain.on('navigate-order-entry-page', (event, orderEntryCount) => {
        // Logic for navigating to the respective orderEntryPage, if needed
        if (windows[orderEntryCount]) {
            windows[orderEntryCount].focus();
        }
    });

});

ipcMain.on('navigate', (event, page) => {
    mainWindow.loadFile(page)
    .then(() => {
        console.log('Success loading HTML file');
    })
    .catch((error) => {
        console.error('Error loading HTML file:', error);
    })
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

ipcMain.on('open-display-row', (event, data) => {
    mainWindow.webContents.once('did-fail-load', (event, errorCode, errorDescription) => {
        console.error("Failed to load:", errorCode, errorDescription);
    });
    
    mainWindow.webContents.once('did-finish-load', () => {
        // Once the file is loaded, send the product data to the renderer
        mainWindow.webContents.send('display-row-data', data);
    });

    mainWindow.loadFile('orderEntryPage.html');
});

ipcMain.on('modify-display-row', (event, data) => {
    mainWindow.webContents.once('did-fail-load', (event, errorCode, errorDescription) => {
        console.error("Failed to load:", errorCode, errorDescription);
    });

    mainWindow.webContents.once('did-finish-load', () => {
        mainWindow.webContents.send('display-modify-row-data', data);
    });

    mainWindow.loadFile('orderEntryPage.html');
});

// Listen for the customer search request from the renderer
ipcMain.on('perform-customer-search', (event, searchQuery, count) => {
    customerSearchHandler.handleSearch(searchQuery, connection)
    .then(results => {
        mainWindow.webContents.send('customers-data', results, count);
    })
    .catch(error => {
        console.error('Error fetching customers:', error);
        mainWindow.webContents.send('customers-data-error', error.message);
    });
});

// Listen for the customer search request from the renderer
ipcMain.on('perform-order-customer-search', (event, searchQuery, count) => {
    customerSearchHandler.handleSearch(searchQuery, connection)
    .then(results => {
        mainWindow.webContents.send('order-customer-data', results, count);
    })
    .catch(error => {
        console.error('Error fetching customers:', error);
        mainWindow.webContents.send('order-customer-data-error', error.message);
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


function fetchProductSalesHistory(event, data, returnType, orderClause='', successEvent, errorEvent) {
    let productID;

    if (typeof data === 'number') {
        productID = data;
    } else {
        productID = data.productID;
    }
    
    let queryParams = [productID];

    let additionalCondition = '';
    if (typeof returnType === 'number') {
        additionalCondition = 'AND o.orderIsReturn = ?';
        queryParams.push(returnType);
    }

    const query = `
    SELECT 
        o.orderID, 
        o.orderDate,
        o.customerID,
        o.invoiceID,
        o.orderChannel,
        o.orderPO,
        o.orderStatus,
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
    ${additionalCondition}
    ${orderClause};`;
    connection.query(query, queryParams, (err, rows) => {
        if (err) {
            event.reply(errorEvent, err.message);
        } else {
            event.reply(successEvent, rows);
        }
    });
}

ipcMain.on('fetch-product-sales-history-data', (event, data) => {
    fetchProductSalesHistory(event, data, null, '', 'fetch-product-sales-history-data-success', 'fetch-product-sales-history-data-error');
});

ipcMain.on('fetch-ascending-product-sales-history-data', (event, data) => {
    fetchProductSalesHistory(event, data, null, 'ORDER BY totalPrice ASC', 'fetch-ascending-product-sales-history-data-success', 'fetch-ascending-product-sales-history-data-error');
});

ipcMain.on('fetch-descending-product-sales-history-data', (event, data) => {
    fetchProductSalesHistory(event, data, null, 'ORDER BY totalPrice DESC', 'fetch-descending-product-sales-history-data-success', 'fetch-descending-product-sales-history-data-error');
});


ipcMain.on('fetch-ascending-product-date-history-data', (event, data) => {
    fetchProductSalesHistory(event, data, null, 'ORDER BY o.orderDate ASC', 'fetch-ascending-product-date-history-data-success', 'fetch-ascending-product-date-history-data-error');
});

ipcMain.on('fetch-descending-product-date-history-data', (event, data) => {
    fetchProductSalesHistory(event, data, null, 'ORDER BY o.orderDate DESC', 'fetch-descending-product-date-history-data-success', 'fetch-descending-product-date-history-data-error');
});

ipcMain.on('fetch-purchased-product-sales-history-data', (event, data) => {
    fetchProductSalesHistory(event, data, 0, '', 'fetch-purchased-product-sales-history-data-success', 'fetch-purchased-product-sales-history-data-error');
});

ipcMain.on('fetch-ascending-purchased-product-sales-history-data', (event, data) => {
    fetchProductSalesHistory(event, data, 0, 'ORDER BY totalPrice ASC', 'fetch-ascending-purchased-product-sales-history-data-success', 'fetch-ascending-purchased-product-sales-history-data-error');
});

ipcMain.on('fetch-descending-purchased-product-sales-history-data', (event, data) => {
    fetchProductSalesHistory(event, data, 0, 'ORDER BY totalPrice DESC', 'fetch-descending-purchased-product-sales-history-data-success', 'fetch-descending-purchased-product-sales-history-data-error');
});

ipcMain.on('fetch-ascending-purchased-product-date-history-data', (event, data) => {
    fetchProductSalesHistory(event, data, 0, 'ORDER BY o.orderDate ASC', 'fetch-ascending-purchased-product-date-history-data-success', 'fetch-ascending-purchased-product-date-history-data-error');
});

ipcMain.on('fetch-descending-purchased-product-date-history-data', (event, data) => {
    fetchProductSalesHistory(event, data, 0, 'ORDER BY o.orderDate DESC', 'fetch-descending-purchased-product-date-history-data-success', 'fetch-descending-purchased-product-date-history-data-error');
});

ipcMain.on('fetch-returned-product-sales-history-data', (event, data) => {
    fetchProductSalesHistory(event, data, 1, '', 'fetch-returned-product-sales-history-data-success', 'fetch-returned-product-sales-history-data-error');
});

ipcMain.on('fetch-ascending-returned-product-sales-history-data', (event, data) => {
    fetchProductSalesHistory(event, data, 1, 'ORDER BY totalPrice ASC', 'fetch-ascending-returned-product-sales-history-data-success', 'fetch-ascending-purchased-product-sales-history-data-error');
});

ipcMain.on('fetch-descending-returned-product-sales-history-data', (event, data) => {
    fetchProductSalesHistory(event, data, 1, 'ORDER BY totalPrice DESC', 'fetch-descending-returned-product-sales-history-data-success', 'fetch-descending-purchased-product-sales-history-data-error');
});

ipcMain.on('fetch-ascending-returned-product-date-history-data', (event, data) => {
    fetchProductSalesHistory(event, data, 1, 'ORDER BY o.orderDate ASC', 'fetch-ascending-returned-product-date-history-data-success', 'fetch-ascending-purchased-product-date-history-data-error');
});

ipcMain.on('fetch-descending-returned-product-date-history-data', (event, data) => {
    fetchProductSalesHistory(event, data, 1, 'ORDER BY o.orderDate DESC', 'fetch-descending-returned-product-date-history-data-success', 'fetch-descending-purchased-product-date-history-data-error');
});


ipcMain.on('get-contacts-for-company', (event, data) => {
    const customerID = data;
    const query = `
    SELECT  c.contactID, 
            c.contactName, 
            c.contactPhone, 
            c.contactEmail, 
            c.contactNotes
    FROM Contacts c
    JOIN CustomerContacts cc ON c.contactID = cc.contactID
    WHERE cc.customerID = ${customerID}
    ORDER BY c.contactPriority DESC;`

    connection.query(query, customerID, (err, rows) => {
        if (err) {
            event.reply('get-contacts-for-company-error', err.message);
        } else {
            event.reply('get-contacts-for-company-success', rows);
        }
    });
});

ipcMain.on('get-contacts-for-order-company', (event, data, count) => {
    const customerID = data;
    const query = `
    SELECT  c.contactID, 
            c.contactName, 
            c.contactPhone, 
            c.contactEmail, 
            c.contactNotes
    FROM Contacts c
    JOIN CustomerContacts cc ON c.contactID = cc.contactID
    WHERE cc.customerID = ${customerID}
    ORDER BY c.contactPriority DESC;`;

    connection.query(query, customerID, (err, rows) => {
        if (err) {
            event.reply('get-contacts-for-order-company-error', err.message);
        } else {
            event.reply('get-contacts-for-order-company-success', rows, count);
        }
    });
});

ipcMain.on('get-info-for-order-company', (event, data, count) => {
    const customerID = data;
    const query = `
    SELECT  *
    FROM Customers c
    WHERE c.customerID = ${customerID}
    `;

    connection.query(query, customerID, (err, rows) => {
        if (err) {
            event.reply('get-info-for-order-company-error', err.message);
        } else {
            event.reply('get-info-for-order-company-success', rows, count);
        }
    });
});



function getProducts() {
    return new Promise((resolve, reject) => {
        const get_unique_products_query = `
            SELECT productID, 
                   productName
            FROM Products;
        `;
        connection.query(get_unique_products_query, (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}

async function buildProductIDQuery() {
    const currProducts = await getProducts();
    let productIDQuery = ``;
    currProducts.forEach(currProduct => {
        productIDQuery += `SUM(CASE WHEN p.productID = '${currProduct['productID']}' THEN op.productQuantity ELSE 0 END) AS '${currProduct['productName']}',`;
    });
    return { productIDQuery, currProducts };
}

async function fetchOrderData(customerID, orderClause='', isReturn=null) {
    const { productIDQuery, currProducts } = await buildProductIDQuery();

    let returnCondition = '';
    if (isReturn !== null) {
        returnCondition = `AND o.orderIsReturn = ${isReturn}`;
    }

    const get_order_data_query = `
        SELECT 
            o.orderID,
            o.orderDate,
            o.orderIsReturn,
            ${productIDQuery}
            o.orderTotal,
            o.orderStatus
        FROM Orders o
        JOIN OrderProducts op ON o.orderID = op.orderID
        JOIN Products p ON op.productID = p.productID
        WHERE o.customerID = ${customerID}
        ${returnCondition}
        GROUP BY o.orderID, o.orderDate, o.orderIsReturn, o.orderTotal, o.orderStatus
        ${orderClause};
    `;

    return new Promise((resolve, reject) => {
        connection.query(get_order_data_query, customerID, (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve({ rows, currProducts });
            }
        });
    });
}

ipcMain.on('get-order-history-for-company', async (event, customerID) => {
    try {
        const { rows, currProducts } = await fetchOrderData(customerID);
        event.reply('get-order-history-for-company-success', rows, currProducts);
    } catch (error) {
        console.error("Error get order history data for company:", error.message);
        event.reply('get-order-history-for-company-error', error.message);
    }
});

ipcMain.on('get-ascending-date-order-history-for-company', async (event, customerID) => {
    try {
        const orderClause = "ORDER BY o.orderDate ASC";
        const { rows, currProducts } = await fetchOrderData(customerID, orderClause);
        event.reply('get-ascending-date-order-history-for-company-success', rows, currProducts);
    } catch (error) {
        console.error("Error get order history sorted by date asc for company:", error.message);
        event.reply('get-ascending-date-order-history-for-company-error', error.message);
    }
});

ipcMain.on('get-ascending-sales-order-history-for-company', async (event, customerID) => {
    try {
        const orderClause = "ORDER BY o.orderTotal ASC";
        const { rows, currProducts } = await fetchOrderData(customerID, orderClause);
        event.reply('get-ascending-sales-order-history-for-company-success', rows, currProducts);
    } catch (error) {
        console.error("Error get order history sorted by sales asc for company:", error.message);
        event.reply('get-ascending-sales-order-history-for-companyy-error', error.message);
    }
});


ipcMain.on('get-descending-date-order-history-for-company', async (event, customerID) => {
    try {
        const orderClause = "ORDER BY o.orderDate DESC";
        const { rows, currProducts } = await fetchOrderData(customerID, orderClause);
        event.reply('get-descending-date-order-history-for-company-success', rows, currProducts);
    } catch (error) {
        console.error("Error get order history sorted by date desc for company:", error.message);
        event.reply('get-descending-date-order-history-for-company-error', error.message);
    }
});

ipcMain.on('get-descending-sales-order-history-for-company', async (event, customerID) => {
    try {
        const orderClause = "ORDER BY o.orderTotal DESC";
        const { rows, currProducts } = await fetchOrderData(customerID, orderClause);
        event.reply('get-descending-sales-order-history-for-company-success', rows, currProducts);
    } catch (error) {
        console.error("Error get order history sorted by date desc for company:", error.message);
        event.reply('get-descending-sales-order-history-for-company-error', error.message);
    }
});

ipcMain.on('get-purchased-order-history-for-company', async (event, customerID) => {
    try {
        const { rows, currProducts } = await fetchOrderData(customerID, '', 0);  // 0 for orderIsReturn = Purchase
        event.reply('get-purchased-order-history-for-company-success', rows, currProducts);
    } catch (error) {
        console.error("Error get purchased order history data for company:", error.message);
        event.reply('get-purchased-order-history-for-company-error', error.message);
    }
});

ipcMain.on('get-ascending-date-purchased-order-history-for-company', async (event, customerID) => {
    try {
        const orderClause = "ORDER BY o.orderDate ASC";
        const { rows, currProducts } = await fetchOrderData(customerID, orderClause, 0);  // 0 for orderIsReturn = Purchase
        event.reply('get-ascending-date-purchased-order-history-for-company-success', rows, currProducts);
    } catch (error) {
        console.error("Error get ascending purchased order history data for company:", error.message);
        event.reply('get-ascending-date-purchased-order-history-for-company-error', error.message);
    }
});

ipcMain.on('get-ascending-sales-purchased-order-history-for-company', async (event, customerID) => {
    try {
        const orderClause = "ORDER BY o.orderTotal ASC";
        const { rows, currProducts } = await fetchOrderData(customerID, orderClause, 0);  // 0 for orderIsReturn = Purchase
        event.reply('get-ascending-sales-purchased-order-history-for-company-success', rows, currProducts);
    } catch (error) {
        console.error("Error get ascending purchased order history data for company:", error.message);
        event.reply('get-ascending-sales-purchased-order-history-for-company-error', error.message);
    }
});

ipcMain.on('get-descending-date-purchased-order-history-for-company', async (event, customerID) => {
    try {
        const orderClause = "ORDER BY o.orderDate DESC";
        const { rows, currProducts } = await fetchOrderData(customerID, orderClause, 0);  // 0 for orderIsReturn = Purchase
        event.reply('get-descending-date-purchased-order-history-for-company-success', rows, currProducts);
    } catch (error) {
        console.error("Error get descending purchased order history data for company:", error.message);
        event.reply('get-descending-date-purchased-order-history-for-company-error', error.message);
    }
});

ipcMain.on('get-descending-sales-purchased-order-history-for-company', async (event, customerID) => {
    try {
        const orderClause = "ORDER BY o.orderTotal DESC";
        const { rows, currProducts } = await fetchOrderData(customerID, orderClause, 0);  // 0 for orderIsReturn = Purchase
        event.reply('get-descending-sales-purchased-order-history-for-company-success', rows, currProducts);
    } catch (error) {
        console.error("Error get descending purchased order history data for company:", error.message);
        event.reply('get-descending-sales-purchased-order-history-for-company-error', error.message);
    }
});

ipcMain.on('get-returned-order-history-for-company', async (event, customerID) => {
    try {
        const { rows, currProducts } = await fetchOrderData(customerID, '', 1);  // 1 for orderIsReturn = Return
        event.reply('get-returned-order-history-for-company-success', rows, currProducts);
    } catch (error) {
        console.error("Error get returned order history data for company:", error.message);
        event.reply('get-returned-order-history-for-company-error', error.message);
    }
});

ipcMain.on('get-ascending-date-returned-order-history-for-company', async (event, customerID) => {
    try {
        const orderClause = "ORDER BY o.orderDate ASC";
        const { rows, currProducts } = await fetchOrderData(customerID, orderClause, 1);  // 1 for orderIsReturn = Return
        event.reply('get-ascending-date-returned-order-history-for-company-success', rows, currProducts);
    } catch (error) {
        console.error("Error get returned order sort by date (ascending) history data for company:", error.message);
        event.reply('get-ascending-date-returned-order-history-for-company-error', error.message);
    }
});

ipcMain.on('get-ascending-sales-returned-order-history-for-company', async (event, customerID) => {
    try {
        const orderClause = "ORDER BY o.orderTotal ASC";
        const { rows, currProducts } = await fetchOrderData(customerID, orderClause, 1);  // 1 for orderIsReturn = Return
        event.reply('get-ascending-sales-returned-order-history-for-company-success', rows, currProducts);
    } catch (error) {
        console.error("Error get returned order sort by date (descending) history data for company:", error.message);
        event.reply('get-ascending-sales-returned-order-history-for-company-error', error.message);
    }
});

ipcMain.on('get-descending-date-returned-order-history-for-company', async (event, customerID) => {
    try {
        const orderClause = "ORDER BY o.orderDate DESC";
        const { rows, currProducts } = await fetchOrderData(customerID, orderClause, 1);  // 1 for orderIsReturn = Return
        event.reply('get-descending-date-returned-order-history-for-company-success', rows, currProducts);
    } catch (error) {
        console.error("Error get returned order by sort date (descending) history data for company:", error.message);
        event.reply('get-descending-date-returned-order-history-for-company-error', error.message);
    }
});

ipcMain.on('get-descending-sales-returned-order-history-for-company', async (event, customerID) => {
    try {
        const orderClause = "ORDER BY o.orderTotal DESC";
        const { rows, currProducts } = await fetchOrderData(customerID, orderClause, 1);  // 1 for orderIsReturn = Return
        event.reply('get-descending-sales-returned-order-history-for-company-success', rows, currProducts);
    } catch (error) {
        console.error("Error get returned order history by sort sales (descending) data for company:", error.message);
        event.reply('get-descending-sales-returned-order-history-for-company-error', error.message);
    }
});


ipcMain.on('fetch-total-sales-data-for-customer', (event, data) => {
    const { customerID, fromDate, toDate } = data;
    const query = `
    SELECT orderDate, orderTotal
    FROM Orders
    WHERE customerID = ?
    AND orderDate BETWEEN ? AND ?
    `;
    connection.query(query, [customerID, fromDate, toDate], (err, rows) => {
        if (err) {
            event.reply('fetch-total-sales-data-for-customer-error', err.message);
        } else {
            event.reply('fetch-total-sales-data-for-customer-success', rows);
        }
    });
});

ipcMain.on('get-product-data', (event) => {
    const query = `
    SELECT productID, productName, productUnitPrice, productIsAvailable
    FROM Products
    GROUP BY productID, productName, productUnitPrice`;

    connection.query(query, (err, rows) => {
        if (err) {
            event.reply('get-product-data-error', err.message);
        } else {
            event.reply('get-product-data-success', rows);
        }
    });
});

ipcMain.on('perform-order-history-search-for-customer', (event, customerID, count) => {
    const query = `
    SELECT o.orderDate, p.productName, op.productQuantity 
    FROM Orders o 
    JOIN (
        SELECT DISTINCT orderDate 
        FROM Orders
        WHERE customerID = ${customerID} 
        ORDER BY orderDate DESC 
        LIMIT 5
    ) AS recentOrders ON o.orderDate = recentOrders.orderDate
    JOIN OrderProducts op ON o.orderID = op.orderID 
    JOIN Products p ON op.productID = p.productID 
    WHERE o.customerID = ${customerID}
    ORDER BY o.orderDate DESC, p.productName;`;

    connection.query(query, (err, rows) => {
        if (err) {
            event.reply('perform-order-history-search-for-customer-error', err.message);
        } else {
            event.reply('perform-order-history-search-for-customer-success', rows, count);
        }
    });
});

ipcMain.on('get-last-orderID-request', (event) => {
    const query = `
    SELECT MAX(orderID) AS maxOrderID
    FROM Orders;
    `;

    connection.query(query, (err, rows) => {
        if (err){
            event.reply('get-last-orderID-request-error', err.message);
        } else {
            event.reply('get-last-orderID-request-success', rows);
        }
    });
});

ipcMain.on('get-company-recent-products', async (event, data) => {
    const companyName = data;
    let query = `
    SELECT productName, COUNT(productName) AS productCount
    FROM (
    SELECT o.orderDate, p.productName
    FROM Orders o
    JOIN (
    SELECT DISTINCT orderDate
    FROM Orders o LEFT JOIN Customers c ON o.customerID = c.customerID
    WHERE c.customerName = '${companyName}'
    ORDER BY orderDate DESC
    LIMIT 5
    ) AS recentOrders ON o.orderDate = recentOrders.orderDate
    JOIN OrderProducts op ON o.orderID = op.orderID
    JOIN Products p ON op.productID = p.productID
    JOIN Customers c on o.customerID = c.customerID
    WHERE c.customerName = '${companyName}'
    GROUP BY o.orderDate, p.productName
    ) AS recentProducts
    GROUP BY productName
    HAVING productCount >= 3;
    `;
    connection.query(query, companyName, (err, rows) => {
        if (err) {
            // Handle the error
            console.error(err.message);
            event.reply('get-company-recent-products-error', err.message);
        } else {
            // Extract values from the 'productName' column
            const productList = rows.map((row) => {
                return row.productName;
            });
    
            // Send the list of product names as a response
            event.reply('get-company-recent-products-success', productList);
        }
    }); 
});

ipcMain.on('get-order-from-date', async (event, data1, data2) => {

    const orderDate = data1;
    const orderDayOfWeek = data2;
    // console.log(orderDate);
    // console.log(orderDayOfWeek);

    let query = `
    SELECT 
    CASE
        WHEN o.orderID IS NOT NULL THEN 'Ordered'
        WHEN customerIsMustCheck = 1 THEN 'Must Check'
        ELSE 'Waiting'
    END AS 'Status',
        c.customerName AS Company,
        c.customerID AS CompanyID,
        o.orderID AS OrderID,
        o.orderIsReturn AS Type,
        o.orderPO AS 'PO#',
        MAX(CASE WHEN p.productName = '1.25oz Chips' THEN op.productQuantity END) AS '1.25oz Chips',
        MAX(CASE WHEN p.productName = '2.25oz Chips' THEN op.productQuantity END) AS '2.25oz Chips',
        MAX(CASE WHEN p.productName = '7.5oz Chips' THEN op.productQuantity END) AS '7.5oz Chips',
        MAX(CASE WHEN p.productName = '14oz Chips' THEN op.productQuantity END) AS '14oz Chips',
        MAX(CASE WHEN p.productName = 'Chocolate Bar' THEN op.productQuantity END) AS 'Chocolate Bar',
        MAX(CASE WHEN p.productName = 'Chocolate Box' THEN op.productQuantity END) AS 'Chocolate Box',
        orderTotal as 'Sales Total',
        orderChannel AS 'Channel'
    FROM 
        Customers c 
    LEFT JOIN Orders o ON c.customerID = o.customerID AND o.orderDate = '${orderDate}'
    LEFT JOIN OrderProducts op ON o.orderID = op.orderID
    LEFT JOIN Products p ON op.productID = p.productID
    WHERE 
        SUBSTRING(customerSchedule, ${orderDayOfWeek + 1}, 1) = '1' or o.orderDate = '${orderDate}'
    GROUP BY 
        c.customerName,
        c.customerID,
        o.orderID,
        o.orderIsReturn,
        o.orderPO,
        o.orderTotal,
        o.orderChannel
    ORDER BY
        CASE 
            WHEN Status = 'Must Check' THEN 1
            WHEN Status = 'Waiting' THEN 2
            ELSE 3
        END,
        customerName;
    `;

    connection.query(query, orderDate, (err, rows) => {
        if (err) {
            // console.log(err.message);
            event.reply('get-order-from-date-error', err.message);
        } else {
            // console.log(rows);
            event.reply('get-order-from-date-success', rows);
        }
    });
});

ipcMain.on('insert-order', (event, data) => {
    
    const { orderID, invoiceID, customerID, orderDate, orderTotal, orderIsReturn, orderChannel, orderStatus, orderPO } = data;
    const query = `
        INSERT INTO Orders (orderID, invoiceID, customerID, orderDate, orderTotal, orderIsReturn, orderChannel, orderStatus, orderPO) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    connection.query(query, [orderID, invoiceID, customerID, orderDate, orderTotal, orderIsReturn, orderChannel, orderStatus, orderPO], function(err) {
        if (err) {
            console.error('Error inserting data into Orders table:', err);
            event.reply('insert-order-reply', 'Error inserting into Orders table.');
            return;
        }
        console.log(`Row inserted`);
        event.reply('insert-order-reply', 'Successfully inserted into Orders table.');
    });
});

ipcMain.on('insert-order-product', (event, data) => {
    
    const { orderID, productID, productQuantity } = data;
    const query = `
        INSERT INTO OrderProducts (orderID, productID, productQuantity) 
        VALUES (?, ?, ?)
    `;

    connection.query(query, [orderID, productID, productQuantity], function(err) {
        if (err) {
            console.error('Error inserting data into OrderProducts table:', err);
            event.reply('insert-order-product-reply', 'Error inserting into OrderProducts table.');
            return;
        }
        console.log(`Row inserted`);
        event.reply('insert-order-product-reply', 'Successfully inserted into OrderProducts table.');
    });
});



ipcMain.on('get-summary-from-date', async (event, data) => {

    const orderDate = data;
    // console.log('Summary:', orderDate);

    let query = `
    SELECT
    SUM(CASE WHEN p.productName = '1.25oz Chips' THEN op.productQuantity ELSE 0 END) AS '1.25oz Chips',
    SUM(CASE WHEN p.productName = '2.25oz Chips' THEN op.productQuantity ELSE 0 END) AS '2.25oz Chips',
    SUM(CASE WHEN p.productName = '7.5oz Chips' THEN op.productQuantity ELSE 0 END) AS '7.5oz Chips',
    SUM(CASE WHEN p.productName = '14oz Chips' THEN op.productQuantity ELSE 0 END) AS '14oz Chips',
    SUM(CASE WHEN p.productName = 'Chocolate Bar' THEN op.productQuantity ELSE 0 END) AS 'Chocolate Bar',
    SUM(CASE WHEN p.productName = 'Chocolate Box' THEN op.productQuantity ELSE 0 END) AS 'Chocolate Box'
    FROM
    Orders o
    LEFT JOIN OrderProducts op ON o.orderID = op.orderID
    LEFT JOIN Products p ON op.productID = p.productID
    WHERE
	o.orderIsReturn = 0 AND
    o.orderDate = '${orderDate}';
    `;

    connection.query(query, orderDate, (err, rows) => {
        if (err) {
            // console.log(err.message);
            event.reply('get-summary-from-date-error', err.message);
        } else {
            // console.log(rows);
            event.reply('get-summary-from-date-success', rows);
        }
    });
});

ipcMain.on('get-sales-total-from-date', async (event, data) => {
    let query = `
    SELECT
    SUM(o.orderTotal)
    FROM
    Orders o
    WHERE
	o.orderIsReturn = 0 AND
    o.orderDate = '${orderDate}';
    `;

    connection.query(query, orderDate, (err, rows) => {
        if (err) {
            // console.log(err.message);
            event.reply('get-sales-total-from-date-error', err.message);
        } else {
            // console.log(rows);
            event.reply('get-sales-total-from-date-success', rows);
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