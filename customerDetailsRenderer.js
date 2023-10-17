const { ipcRenderer} = require('electron');
const Plotly = require('plotly.js-dist');
const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

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
});

// Fetch order history for that product with specfied date range
ipcRenderer.on('get-contacts-for-company-success', (event, rows) => {
    // Create a table element
    const table = document.createElement('table');
    // Add table headers
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    const headers = ['Name', 'Phone', 'Email', 'Note'];
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
        const name = row.contactFirstName + " " + row.contactLastName;
        const values = [name, row.contactPhone, row.contactEmail, row.contactNotes];
        values.forEach(value => {
            const td = document.createElement('td');
            td.textContent = value;
            tr.appendChild(td);
        });
        tbody.appendChild(tr);
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
    const productNameList = currProducts.map(product => product['productName']);
    // Create a table element
    const table = document.createElement('table');
    table.classList.add('order-history-table');
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
        const isReturn = row.orderIsReturn === 1 ? 'Return' : 'Purchase';
        const tr = document.createElement('tr');
        const date = row.orderDate.toISOString().slice(0, 10);
        const values = [row.orderID, date, isReturn, ...productQuantities, row.orderTotal, row.orderStatus];
        values.forEach(value => {
            const td = document.createElement('td');
            td.textContent = value;
            tr.appendChild(td);
        });
        tbody.appendChild(tr);
    });
    table.appendChild(tbody);

    // Append the table to the orderHistoryContent div
    const container = document.getElementById('order-history-section');
    container.innerHTML = ''; // Clear previous content
    container.appendChild(table);
});


ipcRenderer.on('get-order-history-for-company-error', (event, errorMessage) => {
    console.error("Error get order history data for company data error:", errorMessage);
    alert("Error get order history data for company. Please try again later.");
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

