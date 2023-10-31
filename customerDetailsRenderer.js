const { ipcRenderer} = require('electron');
const Plotly = require('plotly.js-dist');
const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

// Get the elements
const dateRangeElement = document.getElementById('dateRange');
const fromDateElement = document.getElementById('fromDate');
const toDateElement = document.getElementById('toDate');
const fetchDataButton = document.getElementById('fetchData');
const sortCriteria = document.getElementById('sortCriteria');
const sortToggle = document.getElementById('sortToggle');


let currentCustomerID = null;
ipcRenderer.on('customer-details', (event, customerData) => {
    const customerName = customerData.customerName;

    document.getElementById('customerNameDisplay').textContent =customerName;

    let mustCheck = customerData.customerIsMustCheck === 1 ? 'Yes' : 'No';
    let isActive = customerData.customerIsActive === 1 ? 'Active' : 'Inactive';
    const customerDetailsSection = document.querySelector('.customer-details-section');
    const customerDetailsList = document.createElement('ul');
    const details = [
        {label: 'Status', value: isActive},
        {label: 'Must Check', value: mustCheck},
        {label: 'Sector', value: customerData.customerCategory_0},
        {label: 'Category', value: customerData.customerCategory_1},
        {label: 'Delivery Schedule', value: numToName(customerData.customerSchedule)}
    ]

    details.forEach(detail => {
        const listItem = document.createElement('li');
        // create span for label
        const labelSpan = document.createElement('span');
        labelSpan.textContent = `${detail.label}: `;
        labelSpan.classList.add('detail-label-text');
        listItem.appendChild(labelSpan);

        const valueSpan = document.createElement('span');
        valueSpan.textContent = detail.value;
        if (detail.label === 'Status'){
            if (detail.value === 'Active'){
                valueSpan.classList.add('active-status-text');

            }else{
                valueSpan.classList.add('inactice-status-text');
            }
        }else{
            valueSpan.classList.add('detail-value-text');
        }
        listItem.appendChild(valueSpan);

        listItem.classList.add('customer-detail-text');
        customerDetailsList.appendChild(listItem);
    })
    customerDetailsSection.appendChild(customerDetailsList);

    // Customer Phone, Email, Fax information
    const tableBody = document.getElementById('company-info');
    if (!tableBody) return;
    tableBody.innerHTML = '';
    const customerPhone = formatNumber(customerData.customerPhone);
    const customerFax = formatNumber(customerData.customerFax);
    const rowsData = [
        { label: 'Company Phone:', value: `${customerPhone}` },
        { label: 'Company Email:', value: `${customerData.customerEmail}` },
        { label: 'Company Fax:', value: `${customerFax}` }
    ];

    rowsData.forEach(rowData => {
        const row = document.createElement('tr');
        row.classList.add('customer-business-number-row');
        row.innerHTML = `
            <td>${rowData.label}</td>
            <td class="info-value">${rowData.value}</td>
        `;
        tableBody.appendChild(row);
    });
    currentCustomerID = customerData.customerID;
    ipcRenderer.send('get-contacts-for-company', currentCustomerID);
    ipcRenderer.send('get-order-history-for-company', currentCustomerID);
    ipcRenderer.send('get-purchased-order-history-for-company', currentCustomerID);
    ipcRenderer.send('get-returned-order-history-for-company', currentCustomerID);
});

// Fetch order history for that product with specfied date range
ipcRenderer.on('get-contacts-for-company-success', (event, rows) => {
    // Create a table element
    const table = document.createElement('table');
    table.classList.add('contacts-table-unique');
    // Add table headers
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    const headers = ['Name', 'Phone', 'Email'];
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
        const name = row.contactName;
        const values = [name, formatNumber(row.contactPhone), row.contactEmail];
        values.forEach(value => {
            const td = document.createElement('td');
            td.textContent = value;
            tr.appendChild(td);
        });
        tbody.appendChild(tr);
        const tr_note = document.createElement('tr');
        const td_note = document.createElement('td');
        td_note.colSpan = 3;
        td_note.textContent = row.contactNotes;
        td_note.style.fontWeight = 'normal';
        tr_note.appendChild(td_note);
        tbody.appendChild(tr_note);
    });
    table.appendChild(tbody);

    // Append the table to the orderHistoryContent div
    const container = document.getElementById('contacts-table');
    container.innerHTML = ''; // Clear previous content
    container.appendChild(table);
});

ipcRenderer.on('get-contacts-for-company-error', (event, errorMessage) => {
    console.error("Error get contacts for company data error:", errorMessage);
    alert("Error get contacts data for company. Please try again later.");
});

ipcRenderer.on('get-order-history-for-company-success', (event, rows, currProducts) => {
    createAndRenderTable(rows, currProducts, 'order-history-section', 'order-history-table');
});

ipcRenderer.on('get-ascending-date-order-history-for-company-success', (event, rows, currProducts) => {
    createAndRenderTable(rows, currProducts, 'order-history-section', 'order-history-table');
});

ipcRenderer.on('get-descending-date-order-history-for-company-success', (event, rows, currProducts) => {
    createAndRenderTable(rows, currProducts, 'order-history-section', 'order-history-table');
});

ipcRenderer.on('get-ascending-sales-order-history-for-company-success', (event, rows, currProducts) => {
    createAndRenderTable(rows, currProducts, 'order-history-section', 'order-history-table');
});

ipcRenderer.on('get-descending-sales-order-history-for-company-success', (event, rows, currProducts) => {
    createAndRenderTable(rows, currProducts, 'order-history-section', 'order-history-table');
});

ipcRenderer.on('get-purchased-order-history-for-company-success', (event, rows, currProducts) => {
    createAndRenderTable(rows, currProducts, 'purchased-history-section', 'purchased-history-table');
});

ipcRenderer.on('get-ascending-date-purchased-order-history-for-company-success', (event, rows, currProducts) => {
    createAndRenderTable(rows, currProducts, 'purchased-history-section', 'purchased-history-table');
});

ipcRenderer.on('get-descending-date-purchased-order-history-for-company-success', (event, rows, currProducts) => {
    createAndRenderTable(rows, currProducts, 'purchased-history-section', 'purchased-history-table');
});

ipcRenderer.on('get-ascending-sales-purchased-order-history-for-company-success', (event, rows, currProducts) => {
    createAndRenderTable(rows, currProducts, 'purchased-history-section', 'purchased-history-table');
});

ipcRenderer.on('get-descending-sales-purchased-order-history-for-company-success', (event, rows, currProducts) => {
    createAndRenderTable(rows, currProducts, 'purchased-history-section', 'purchased-history-table');
});

ipcRenderer.on('get-returned-order-history-for-company-success', (event, rows, currProducts) => {
    createAndRenderTable(rows, currProducts, 'returned-history-section', 'returned-history-table');
});

ipcRenderer.on('get-ascending-date-returned-order-history-for-company-success', (event, rows, currProducts) => {
    createAndRenderTable(rows, currProducts, 'returned-history-section', 'returned-history-table');
});

ipcRenderer.on('get-descending-date-returned-order-history-for-company-success', (event, rows, currProducts) => {
    createAndRenderTable(rows, currProducts, 'returned-history-section', 'returned-history-table');
});

ipcRenderer.on('get-ascending-sales-returned-order-history-for-company-success', (event, rows, currProducts) => {
    createAndRenderTable(rows, currProducts, 'returned-history-section', 'returned-history-table');
});

ipcRenderer.on('get-descending-sales-returned-order-history-for-company-success', (event, rows, currProducts) => {
    createAndRenderTable(rows, currProducts, 'returned-history-section', 'returned-history-table');
});

function createAndRenderTable(rows, currProducts, containerId, tableClass) {
    const productNameList = currProducts.map(product => product['productName']);
    
    // Create a table element
    const table = document.createElement('table');
    table.classList.add(tableClass);
    
    // Add table headers
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    const headers = ['Order ID', 'Date', 'Type', ...productNameList, 'Sales Total', 'Status'];
    
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
        const productQuantities = productNameList.map(productName => row[productName]);
        const isReturn = row.orderIsReturn === 1 ? 'Replace' : 'Purchase';
        const tr = document.createElement('tr');
        const date = row.orderDate.toISOString().slice(0, 10);
        let statusButton;
        
        switch(row.orderStatus) {
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
        
        const values = [row.orderID, date, isReturn, ...productQuantities, row.orderTotal];
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

    // Append the table to the specified container
    const container = document.getElementById(containerId);
    container.innerHTML = ''; // Clear previous content
    container.appendChild(table);
}



function handleOrderHistoryTableError(errorMessage, type) {
    console.error(`Error get ${type} order history data for company error:`, errorMessage);
    alert(`Error get ${type} order history data for company. Please try again later.`);
}

ipcRenderer.on('get-order-history-for-company-error', (event, errorMessage) => {
    handleOrderHistoryTableError(errorMessage, 'general');
});

ipcRenderer.on('get-ascending-date-order-history-for-company-error', (event, errorMessage) => {
    handleOrderHistoryTableError(errorMessage, 'general (sort by date -- ascending)');
});

ipcRenderer.on('get-descending-date-order-history-for-company-error', (event, errorMessage) => {
    handleOrderHistoryTableError(errorMessage, 'general (sort by date -- descending)');
});

ipcRenderer.on('get-ascending-sales-order-history-for-company-error', (event, errorMessage) => {
    handleOrderHistoryTableError(errorMessage, 'general (sort by sales -- ascending)');
});

ipcRenderer.on('get-descending-sales-order-history-for-company-error', (event, errorMessage) => {
    handleOrderHistoryTableError(errorMessage, 'general (sort by sales -- descending)');
});

ipcRenderer.on('get-purchased-order-history-for-company-error', (event, errorMessage) => {
    handleOrderHistoryTableError(errorMessage, 'purchased');
});

ipcRenderer.on('get-ascending-date-purchased-order-history-for-company-error', (event, errorMessage) => {
    handleOrderHistoryTableError(errorMessage, 'purchased (sort by date -- ascending)');
});

ipcRenderer.on('get-descending-date-purchased-order-history-for-company-error', (event, errorMessage) => {
    handleOrderHistoryTableError(errorMessage, 'purchased (sort by date -- descending)');
});

ipcRenderer.on('get-ascending-sales-purchased-order-history-for-company-error', (event, errorMessage) => {
    handleOrderHistoryTableError(errorMessage, 'purchased (sort by sales -- ascending)');
});

ipcRenderer.on('get-descending-sales-purchased-order-history-for-company-error', (event, errorMessage) => {
    handleOrderHistoryTableError(errorMessage, 'purchased (sort by sales -- descending)');
});

ipcRenderer.on('get-returned-order-history-for-company-error', (event, errorMessage) => {
    handleOrderHistoryTableError(errorMessage, 'returned');
});

ipcRenderer.on('get-ascending-date-returned-order-history-for-company-error', (event, errorMessage) => {
    handleOrderHistoryTableError(errorMessage, 'returned');
});

ipcRenderer.on('get-descending-date-returned-order-history-for-company-error', (event, errorMessage) => {
    handleOrderHistoryTableError(errorMessage, 'returned');
});

ipcRenderer.on('get-ascending-sales-returned-order-history-for-company-error', (event, errorMessage) => {
    handleOrderHistoryTableError(errorMessage, 'returned');
});

ipcRenderer.on('get-descending-sales-returned-order-history-for-company-error', (event, errorMessage) => {
    handleOrderHistoryTableError(errorMessage, 'returned');
});

// Add event listener for the "Go Back" button
document.querySelector('.goBackCustomerSearchButton').addEventListener('click', () => {
    // Notify the main process to navigate back to the product search page
    ipcRenderer.send('navigate-back-to-customer-search');
});

document.getElementById('customer-basic-info-button').addEventListener('click', () => {
    switchContent('basicInfo');
});

document.getElementById('customer-contact-info-button').addEventListener('click', () => {
    switchContent('contactInfo');
});

function switchContent(section){
    if (section === 'basicInfo'){
        document.getElementById('customer-basic-info-button').classList.add('active');
        document.getElementById('customer-contact-info-button').classList.remove('active');
        document.getElementById('basic-info-section').classList.add('active-content');
        document.getElementById('contact-info-section').classList.remove('active-content');

    } else if (section === 'contactInfo'){
        document.getElementById('customer-contact-info-button').classList.add('active');
        document.getElementById('customer-basic-info-button').classList.remove('active');
        document.getElementById('contact-info-section').classList.add('active-content');
        document.getElementById('basic-info-section').classList.remove('active-content');
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
            ipcRenderer.send('get-ascending-date-order-history-for-company', currentCustomerID);
            ipcRenderer.send('get-ascending-date-purchased-order-history-for-company', currentCustomerID);
            ipcRenderer.send('get-ascending-date-returned-order-history-for-company', currentCustomerID);
            
        } else {
            ipcRenderer.send('get-descending-date-order-history-for-company', currentCustomerID);
            ipcRenderer.send('get-descending-date-purchased-order-history-for-company', currentCustomerID);
            ipcRenderer.send('get-descending-date-returned-order-history-for-company', currentCustomerID);
        }
    } else if (selectedCriteria === 'sales') {
        if (currentSortOrder === 'ASC') {
            ipcRenderer.send('get-ascending-sales-order-history-for-company', currentCustomerID);
            ipcRenderer.send('get-ascending-sales-purchased-order-history-for-company', currentCustomerID);
            ipcRenderer.send('get-ascending-sales-returned-order-history-for-company', currentCustomerID);
        } else {
            ipcRenderer.send('get-descending-sales-order-history-for-company', currentCustomerID);
            ipcRenderer.send('get-descending-sales-purchased-order-history-for-company', currentCustomerID);
            ipcRenderer.send('get-descending-sales-returned-order-history-for-company', currentCustomerID);
        }
    }
}

document.getElementById('all-order-button').addEventListener('click', () => {
    switchOrderStatusContent('allOrder');
});

document.getElementById('purchased-order-button').addEventListener('click', () => {
    switchOrderStatusContent('purchasedOrder');
});

document.getElementById('returned-order-button').addEventListener('click', () => {
    switchOrderStatusContent('returnedOrder');
});

// Add event listeners
dateRangeElement.addEventListener('change', checkDateRange);
fromDateElement.addEventListener('input', () => salesAnalysisForCustomer(currentCustomerID));
toDateElement.addEventListener('input', () => salesAnalysisForCustomer(currentCustomerID));
fetchDataButton.addEventListener('click', () => salesAnalysisForCustomer(currentCustomerID));


// TODO: Add constraints to the date range
function salesAnalysisForCustomer(customerID){
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
    ipcRenderer.send('fetch-total-sales-data-for-customer', { customerID, fromDate, toDate });
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
    ipcRenderer.send('fetch-total-sales-data-for-customer', {customerID: currentCustomerID, fromDate: startDate, toDate: endDate });
    return true;
}

// Line Chart
ipcRenderer.on('fetch-total-sales-data-for-customer-success', (event, rows) => {
    // Process rows into format suitable for Plotly.js
    const dates = rows.map(row => row.orderDate.toISOString().slice(0, 10));
    const sales = rows.map(row => row.orderTotal);
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
            title: 'Date',
            tickformat: '%Y-%m-%d'
        },
        yaxis: {
            title: 'Total Sales'
        }
    };

    Plotly.newPlot('salesChart', plotData, layout);
});

ipcRenderer.on('fetch-total-sales-data-for-customer-error', (event, errorMessage) => {
    console.error("Error fetching sales data:", errorMessage);
    alert("Error fetching sales data. Please try again later.");
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

function numToName(charList){
    if (charList.length !== 7){
        return "Invalid input";
    }
    let selectedDays = [];
    for (let i = 0; i < charList.length; i++){
        if (charList[charList.length - 1 - i] === '1'){
            selectedDays.push(daysOfWeek[i]);
        }
    }
    return selectedDays.join(", ");

}

function formatNumber(number) {
    const numberString = number.toString();

    if (numberString.length !== 10) {
        console.error('Phone number must be 10 digits long');
        return null;
    }

    const part1 = numberString.substring(0, 3);
    const part2 = numberString.substring(3, 6);
    const part3 = numberString.substring(6, 10);

    return `${part1}-${part2}-${part3}`;
}

function formatDate(date) {
    const year = date.getFullYear();
    
    // Add 1 to the month and ensure it's 2 digits long
    const month = ("0" + (date.getMonth() + 1)).slice(-2);
    
    // Ensure the day is 2 digits long
    const day = ("0" + date.getDate()).slice(-2);
    
    return `${year}-${month}-${day}`;
}
