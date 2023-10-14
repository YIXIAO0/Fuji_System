const { ipcRenderer} = require('electron');
const connection = require('./database.js');
const Plotly = require('plotly.js-dist');

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

    const details = [
        {label: 'Name', value: productData.productName},
        {label: 'Item ID', value: productData.productID},
        {label: 'Price', value: productData.productUnitPrice},
        {label: 'Status', value: available},
        {label: 'Shelf Length', value: productData.productShelfLife},
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
});

document.getElementById('fetchData').addEventListener('click', () => {
    if (currentProductID) {
        renderSalesAnalysis(currentProductID);
    } else {
        console.error("Product ID not set");
    }
});

// Add event listener for the "Go Back" button
document.querySelector('.goBackButton').addEventListener('click', () => {
    // Notify the main process to navigate back to the product search page
    ipcRenderer.send('navigate-back-to-search');
});

document.getElementById('salesAnalysisButton').addEventListener('click', () => {
    switchContent('salesAnalysis');
});

document.getElementById('orderHistoryButton').addEventListener('click', () => {
    switchContent('orderHistory');
});

function switchContent(section){
    if (section === 'salesAnalysis'){
        document.getElementById('salesAnalysisButton').classList.add('active');
        document.getElementById('orderHistoryButton').classList.remove('active');
        document.getElementById('salesAnalysisContent').classList.add('active-content');
        document.getElementById('orderHistoryContent').classList.remove('active-content');

    } else if (section === 'orderHistory'){
        document.getElementById('orderHistoryButton').classList.add('active');
        document.getElementById('salesAnalysisButton').classList.remove('active');
        document.getElementById('orderHistoryContent').classList.add('active-content');
        document.getElementById('salesAnalysisContent').classList.remove('active-content');
    }
}

function renderSalesAnalysis(productID){
    let fromDate = document.getElementById('fromDate').value;
    let toDate = document.getElementById('toDate').value;
    if (!fromDate || !toDate) {
        alert("Please select both a start and end date.");
        return;
    }
    // Send a request to the main process to get sales data
    ipcRenderer.send('fetch-sales-data', { productID, fromDate, toDate });
    ipcRenderer.send('fetch-customer-distribution-data', { productID, fromDate, toDate });
    ipcRenderer.send('fetch-product-sales-history-data', { productID, fromDate, toDate });
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
})

// Fetch order history for that product with specfied date range
ipcRenderer.on('fetch-product-sales-history-data-success', (event, rows) => {
    // Create a table element
    const table = document.createElement('table');

    // Add table headers
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    const headers = ['Order ID', 'Order Date', 'Customer Name', 'Product Quantity', 'Total Price'];
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
        const values = [row.orderID, row.orderDate.toISOString().slice(0, 10), row.customerName, row.productQuantity, row.totalPrice];
        values.forEach(value => {
            const td = document.createElement('td');
            td.textContent = value;
            tr.appendChild(td);
        });
        tbody.appendChild(tr);
    });
    table.appendChild(tbody);

    // Append the table to the orderHistoryContent div
    const container = document.getElementById('orderHistoryContent');
    container.innerHTML = ''; // Clear previous content
    container.appendChild(table);
})


ipcRenderer.on('fetch-product-sales-history-data-error', (event, errorMessage) => {
    console.error("Error fetching product sales history data:", errorMessage);
    alert("Error fetching product sales history data. Please try again later.");
})