const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const connection = require('./database');
const searchHandler = require('./searchHandler');  // If the main process has some logic for handling searches

let mainWindow;

app.on('ready', () => {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 900,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            enableRemoteModule: false
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

// Listen for the search request from the renderer
ipcMain.on('perform-product-search', (event, searchQuery) => {
    searchHandler.handleSearch(searchQuery, connection)
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

ipcMain.on('navigate-back-to-search', () => {
    mainWindow.loadFile('productSearchPage.html');
});

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