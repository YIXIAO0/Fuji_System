const { ipcRenderer} = require('electron');
const Plotly = require('plotly.js-dist');
const dateRangeElement = document.getElementById('dateRange');
const fromDateElement = document.getElementById('fromDate');
const toDateElement = document.getElementById('toDate');
const fetchDataButton = document.getElementById('fetchData');
const sortCriteria = document.getElementById('sortCriteria');
const sortToggle = document.getElementById('sortToggle');

let currentProductID = null;

ipcRenderer.on('product-details', (event, productData) => {
    const productName = productData.productName;

    document.getElementById('productNameDisplay').textContent = productName;

    const productPathName = productName.replace(/ /g, "_");
    const imagePath = `./image/products/${productPathName}.png`

    // Set the image path to the <img> element within the product-image-section
    const imageSection = document.querySelector('.product-image-section');
    const imgElement = document.createElement('img');
    imgElement.src = imagePath;
    imgElement.alt = productName;
    imgElement.style.width = '180px';
    imgElement.style.height = '220px';

    // Append the <img> element to the product-image-section
    imageSection.appendChild(imgElement);

    let available = productData.productIsAvailable === 1 ? 'Available' : 'Not Available';
    // Handle the additional product details 
    const detailsSection = document.querySelector('.product-details-section');
    const detailsList = document.createElement('ul');
    const productShelfLength = productData.productShelfLife === 1? `${productData.productShelfLife} Day` : `${productData.productShelfLife} Days`;
    
    const details = [
        {label: 'Name', value: productData.productName},
        {label: 'Item ID', value: productData.productID},
        {label: 'Price', value: productData.productUnitPrice},
        {label: 'Status', value: available},
        {label: 'Shelf Length', value: productShelfLength},
        {label: 'Category', value: productData.productCategory}
    ]

    details.forEach(detail => {
        const listItem = document.createElement('li');

        // Create span for label
        const labelSpan = document.createElement('span');
        labelSpan.textContent = `${detail.label}: `;
        labelSpan.classList.add('detail-label-text');
        listItem.appendChild(labelSpan);

        const valueSpan = document.createElement('span');
        valueSpan.textContent = detail.value;
        valueSpan.classList.add('detail-value-text');
        listItem.appendChild(valueSpan);

        listItem.classList.add('product-detail-text');
        detailsList.appendChild(listItem);
    })
    detailsSection.appendChild(detailsList);
    currentProductID = productData.productID;
    ipcRenderer.send('fetch-product-sales-history-data', {productID: currentProductID});
    ipcRenderer.send('fetch-purchased-product-sales-history-data', {productID: currentProductID});
    ipcRenderer.send('fetch-returned-product-sales-history-data', {productID: currentProductID});
});

document.getElementById('fetchData').addEventListener('click', () => {
    if (currentProductID) {
        renderSalesAnalysis(currentProductID);
    } else {
        console.error("Product ID not set");
    }
});

// Add event listener for the "Go Back" button
document.querySelector('.goBackProductSearchButton').addEventListener('click', () => {
    // Notify the main process to navigate back to the product search page
    ipcRenderer.send('navigate-back-to-product-search');
});

// Add event listeners
dateRangeElement.addEventListener('change', checkDateRange);
fromDateElement.addEventListener('input', () => renderSalesAnalysis(currentProductID));
toDateElement.addEventListener('input', () => renderSalesAnalysis(currentProductID));
fetchDataButton.addEventListener('click', () => renderSalesAnalysis(currentProductID));

// TODO: Add constraints to the date range
function renderSalesAnalysis(productID){
    let fromDate = fromDateElement.value;
    let toDate = toDateElement.value;
    
    if (!fromDate && !toDate) {
        if (checkDateRange()){
            return;
        }
        alert("Please select both a start and end date, or select a time range.");
        return;
    } else if (!fromDate || !toDate) {
        // Only one date is missing, so just return and wait for the user to fill it
        return;
    }
    
    // Send a request to the main process to get sales data
    ipcRenderer.send('fetch-sales-data', { productID, fromDate, toDate });
    ipcRenderer.send('fetch-customer-distribution-data', { productID, fromDate, toDate });
}

function checkDateRange(){
    let startDate, endDate;
    const dateRange = document.getElementById('dateRange');
    const currentDate = new Date();
    switch(dateRange.value) {
        case null:
            return false;
        case 'lastWeek':
            startDate = new Date(currentDate.setDate(currentDate.getDate() - 7));
            endDate = new Date();
            break;
        case 'lastMonth':
            startDate = new Date(currentDate.setMonth(currentDate.getMonth() - 1));
            endDate = new Date();
            break;
        case 'past3Months':
            startDate = new Date(currentDate.setMonth(currentDate.getMonth() - 3));
            endDate = new Date();
            break;
    }
    startDate = formatDate(startDate);
    endDate = formatDate(endDate);
    fromDateElement.value = startDate;
    toDateElement.value = endDate;
    // Send a request to the main process to get sales data
    ipcRenderer.send('fetch-sales-data', {productID: currentProductID, fromDate: startDate, toDate: endDate });
    ipcRenderer.send('fetch-customer-distribution-data', {productID: currentProductID, fromDate: startDate, toDate: endDate });
    return true;
}

// Line Chart
ipcRenderer.on('fetch-sales-data-success', (event, rows) => {
    // Process rows into format suitable for Plotly.js
    const dates = rows.map(row => row.orderDate.toISOString().slice(0, 10));
    const sales = rows.map(row => row.totalSales);
    const plotData = [{
        x: dates,
        y: sales,
        type: 'scatter',  // scatter type with mode 'lines' gives a line chart
        mode: 'lines',
        name: `Sales Trend (${fromDate.value} to ${toDate.value})`
    }];

    const layout = {
        title: `Sales Trend (${fromDate.value} to ${toDate.value})`,
        xaxis: {
            title: 'Date'
        },
        yaxis: {
            title: 'Total Sales'
        }
    };

    Plotly.newPlot('salesChart', plotData, layout);
});

ipcRenderer.on('fetch-sales-data-error', (event, errorMessage) => {
    console.error("Error fetching sales data:", errorMessage);
    alert("Error fetching sales data. Please try again later.");
});

// Pie Chart
ipcRenderer.on('fetch-customer-distribution-data-success', (event, rows) => {
    const categories = rows.map(row => row.category);
    const counts = rows.map(row => row.totalSales);
    const pieData = [{
        labels: categories,
        values: counts,
        type: 'pie',
        name: `Customer Distribution`
    }];
    
    const pieLayout = {
        title: `Customer Distribution (${fromDate.value} to ${toDate.value})`,
        height: 400,
        width: 500
    };

    Plotly.newPlot('pieChart', pieData, pieLayout);
});

ipcRenderer.on('fetch-customer-distribution-data-error', (event, errorMessage) => {
    console.error("Error fetching customer distribution data:", errorMessage);
    alert("Error fetching customer distribution data. Please try again later.");
});

function createTable(rows, containerId) {
    // Create a table element
    const table = document.createElement('table');

    // Add table headers
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    const headers = ['Order ID', 'Order Date', 'Customer Name', 'Product Quantity', 'Total Price', 'Invoice ID', 'Order Channel', 'PO Number', 'Order Status'];
    headers.forEach(header => {
        const th = document.createElement('th');
        th.textContent = header;
        headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    // Add table data
    const tbody = document.createElement('tbody');
    rows.forEach(row => {
        const tr = document.createElement('tr');
        let statusButton;

        switch (row.orderStatus) {
            case 'Completed':
                statusButton = '<button class="completed-button">Completed</button>';
                break;
            case 'Cancelled':
                statusButton = '<button class="cancelled-button">Cancelled</button>';
                break;
            case 'Delivered':
                statusButton = '<button class="delivered-button">Delivered</button>';
                break;
            case 'Received':
                statusButton = '<button class="received-button">Received</button>';
                break;
            default:
                statusButton = '';
        }
        const values = [row.orderID, row.orderDate.toISOString().slice(0, 10), row.customerName, row.productQuantity, row.totalPrice, row.invoiceID, row.orderChannel, row.orderPO];
        values.forEach(value => {
            const td = document.createElement('td');
            td.textContent = value;
            tr.appendChild(td);
        });
        // Create a separate td for statusButton and use innerHTML
        const tdStatus = document.createElement('td');
        tdStatus.innerHTML = statusButton;
        tr.appendChild(tdStatus);

        tbody.appendChild(tr);
    });
    table.appendChild(tbody);

    // Append the table to the specific container
    const container = document.getElementById(containerId);
    container.innerHTML = ''; // Clear previous content
    container.appendChild(table);
}

function handleFetchError(event, errorMessage, type) {
    console.error(`Error fetching ${type} data:`, errorMessage);
    alert(`Error fetching ${type} data. Please try again later.`);
}

ipcRenderer.on('fetch-product-sales-history-data-success', (event, rows) => {
    createTable(rows, 'order-history-section');
});

ipcRenderer.on('fetch-ascending-product-sales-history-data-success', (event, rows) => {
    createTable(rows, 'order-history-section');
});

ipcRenderer.on('fetch-ascending-product-date-history-data-success', (event, rows) => {
    createTable(rows, 'order-history-section');
});

ipcRenderer.on('fetch-descending-product-sales-history-data-success', (event, rows) => {
    createTable(rows, 'order-history-section');
});

ipcRenderer.on('fetch-descending-product-date-history-data-success', (event, rows) => {
    createTable(rows, 'order-history-section');
});

ipcRenderer.on('fetch-purchased-product-sales-history-data-success', (event, rows) => {
    createTable(rows, 'purchased-history-section');
});

ipcRenderer.on('fetch-ascending-purchased-product-sales-history-data-success', (event, rows) => {
    createTable(rows, 'purchased-history-section');
});

ipcRenderer.on('fetch-ascending-purchased-product-date-history-data-success', (event, rows) => {
    createTable(rows, 'purchased-history-section');
});

ipcRenderer.on('fetch-descending-purchased-product-sales-history-data-success', (event, rows) => {
    createTable(rows, 'purchased-history-section');
});

ipcRenderer.on('fetch-descending-purchased-product-date-history-data-success', (event, rows) => {
    createTable(rows, 'purchased-history-section');
});

ipcRenderer.on('fetch-returned-product-sales-history-data-success', (event, rows) => {
    createTable(rows, 'returned-history-section');
});

ipcRenderer.on('fetch-ascending-returned-product-sales-history-data-success', (event, rows) => {
    createTable(rows, 'returned-history-section');
});

ipcRenderer.on('fetch-ascending-returned-product-date-history-data-success', (event, rows) => {
    createTable(rows, 'returned-history-section');
});

ipcRenderer.on('fetch-descending-returned-product-sales-history-data-success', (event, rows) => {
    createTable(rows, 'returned-history-section');
});

ipcRenderer.on('fetch-descending-returned-product-date-history-data-success', (event, rows) => {
    createTable(rows, 'returned-history-section');
});

ipcRenderer.on('fetch-product-sales-history-data-error', (event, errorMessage) => {
    handleFetchError(event, errorMessage, "product sales history");
});

ipcRenderer.on('fetch-ascending-product-sales-history-data-error', (event, errorMessage) => {
    handleFetchError(event, errorMessage, "product ascending sales history");
});

ipcRenderer.on('fetch-descending-product-sales-history-data-error', (event, errorMessage) => {
    handleFetchError(event, errorMessage, "product descending sales history");
});

ipcRenderer.on('fetch-ascending-product-date-history-data-error', (event, errorMessage) => {
    handleFetchError(event, errorMessage, "product ascending date sales history");
});

ipcRenderer.on('fetch-descending-product-date-history-data-error', (event, errorMessage) => {
    handleFetchError(event, errorMessage, "product descending date sales history");
});

ipcRenderer.on('fetch-purchased-product-sales-history-data-error', (event, errorMessage) => {
    handleFetchError(event, errorMessage, "purchased product sales history");
});

ipcRenderer.on('fetch-ascending-purchased-product-sales-history-data-error', (event, errorMessage) => {
    handleFetchError(event, errorMessage, "purchased product ascending sales history");
});

ipcRenderer.on('fetch-descending-purchased-product-sales-history-data-error', (event, errorMessage) => {
    handleFetchError(event, errorMessage, "purchased product descending sales history");
});

ipcRenderer.on('fetch-ascending-purchased-product-date-history-data-error', (event, errorMessage) => {
    handleFetchError(event, errorMessage, "purchased product ascending date sales history");
});

ipcRenderer.on('fetch-descending-purchased-product-date-history-data-error', (event, errorMessage) => {
    handleFetchError(event, errorMessage, "purchased product descending date sales history");
});

ipcRenderer.on('fetch-returned-product-sales-history-data-error', (event, errorMessage) => {
    handleFetchError(event, errorMessage, "returned product sales history");
});

ipcRenderer.on('fetch-ascending-returned-product-sales-history-data-error', (event, errorMessage) => {
    handleFetchError(event, errorMessage, "returned product ascending sales history");
});

ipcRenderer.on('fetch-descending-returned-product-sales-history-data-error', (event, errorMessage) => {
    handleFetchError(event, errorMessage, "returned product descending sales history");
});

ipcRenderer.on('fetch-ascending-returned-product-date-history-data-error', (event, errorMessage) => {
    handleFetchError(event, errorMessage, "returned product ascending date sales history");
});

ipcRenderer.on('fetch-descending-returned-product-date-history-data-error', (event, errorMessage) => {
    handleFetchError(event, errorMessage, "returned product descending date sales history");
});

document.getElementById('all-order-button').addEventListener('click', () => {
    switchOrderStatusContent('allOrder');
});

document.getElementById('purchased-order-button').addEventListener('click', () => {
    switchOrderStatusContent('purchasedOrder');
});

document.getElementById('returned-order-button').addEventListener('click', () => {
    switchOrderStatusContent('returnedOrder');
});

function switchOrderStatusContent(section){
    if (section === 'allOrder'){
        document.getElementById('all-order-button').classList.add('active');
        document.getElementById('purchased-order-button').classList.remove('active');
        document.getElementById('returned-order-button').classList.remove('active');

        document.getElementById('order-history-section').classList.add('active-content');
        document.getElementById('purchased-history-section').classList.remove('active-content');
        document.getElementById('returned-history-section').classList.remove('active-content');

    } else if (section === 'purchasedOrder'){
        document.getElementById('purchased-order-button').classList.add('active');
        document.getElementById('all-order-button').classList.remove('active');
        document.getElementById('returned-order-button').classList.remove('active');

        document.getElementById('purchased-history-section').classList.add('active-content');
        document.getElementById('order-history-section').classList.remove('active-content');
        document.getElementById('returned-history-section').classList.remove('active-content');
        
    } else if (section === 'returnedOrder'){
        document.getElementById('returned-order-button').classList.add('active');
        document.getElementById('all-order-button').classList.remove('active');
        document.getElementById('purchased-order-button').classList.remove('active');

        document.getElementById('returned-history-section').classList.add('active-content');
        document.getElementById('order-history-section').classList.remove('active-content');
        document.getElementById('purchased-history-section').classList.remove('active-content');

    }
}

let currentSortOrder = 'ASC'; // Initial sort direction

sortToggle.addEventListener('click', function() {
    if (currentSortOrder === 'ASC') {
        currentSortOrder = 'DESC';
        sortToggle.innerHTML = '&#9660;'; // Change to down arrow for descending
    } else {
        currentSortOrder = 'ASC';
        sortToggle.innerHTML = '&#9650;'; // Change to up arrow for ascending
    }
    applySorting();
});

sortCriteria.addEventListener('change', applySorting);

function applySorting() {
    const selectedCriteria = sortCriteria.value;
    if (selectedCriteria === 'date') {
        if (currentSortOrder === 'ASC') {
            ipcRenderer.send('fetch-ascending-product-date-history-data', currentProductID);
            ipcRenderer.send('fetch-ascending-purchased-product-date-history-data', currentProductID);
            ipcRenderer.send('fetch-ascending-returned-product-date-history-data', currentProductID);
        } else {
            ipcRenderer.send('fetch-descending-product-date-history-data', currentProductID);
            ipcRenderer.send('fetch-descending-purchased-product-date-history-data', currentProductID);
            ipcRenderer.send('fetch-descending-returned-product-date-history-data', currentProductID);
        }
    } else if (selectedCriteria === 'sales') {
        if (currentSortOrder === 'ASC') {
            ipcRenderer.send('fetch-ascending-product-sales-history-data', currentProductID);
            ipcRenderer.send('fetch-ascending-purchased-product-sales-history-data', currentProductID);
            ipcRenderer.send('fetch-ascending-returned-product-sales-history-data', currentProductID);
        } else {
            ipcRenderer.send('fetch-descending-product-sales-history-data', currentProductID);
            ipcRenderer.send('fetch-descending-purchased-product-sales-history-data', currentProductID);
            ipcRenderer.send('fetch-descending-returned-product-sales-history-data', currentProductID);
        }
    }
}

function formatDate(date) {
    const year = date.getFullYear();
    
    // Add 1 to the month and ensure it's 2 digits long
    const month = ("0" + (date.getMonth() + 1)).slice(-2);
    
    // Ensure the day is 2 digits long
    const day = ("0" + date.getDate()).slice(-2);
    
    return `${year}-${month}-${day}`;
}