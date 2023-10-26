const { create } = require('domain');
const { ipcRenderer} = require('electron');
// const { dialog } = require('electron');
const { EventEmitter } = require('events');
EventEmitter.defaultMaxListeners = 200;

var today = new Date();

// Set default date to tomorrow
var tomorrow = new Date(today);
tomorrow.setDate(tomorrow.getDate() + 1);

var yyyy = tomorrow.getFullYear();
var mm = String(tomorrow.getMonth() + 1).padStart(2, '0');
var dd = String(tomorrow.getDate()).padStart(2, '0');
var formattedDate = yyyy + '-' + mm + '-' + dd;
var processDate = formattedDate;
let changedRows = [];
var sqldata = [];

// Set the default value of the date input to tomorrow's date
document.getElementById('orderDate').value = formattedDate;

// Get the day of the week
var days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
var dayOfWeek = days[tomorrow.getDay()];

// Add an event listener to update the variable when the date changes
var dateInput = document.getElementById('orderDate');
var selectedDate = '';

function formatDate(date) {
  const formattedDate = date.toISOString().slice(0, 10);
  return formattedDate;
}

function getOrderFromDate (selectedDate, dayOfWeek) {
  ipcRenderer.send('get-order-from-date', selectedDate, dayOfWeek);
  // ipcRenderer.send('get-summary-from-date', selectedDate);
}

getOrderFromDate (formattedDate, (tomorrow.getDay())%7);

var sales_summary = [0,0,0,0,0,0,0];

// Assuming you have an array of product names
const productNames = ["1.25oz Chips", "2.25oz Chips", "7.5oz Chips", "14oz Chips", "Chocolate Bar", "Chocolate Box"];

// Assuming you have a reference to the summary-display table element
const summaryTable = document.getElementById('summary-display');

function fillSummaryTable() {
  // Clear the existing table content
  summaryTable.innerHTML = '';
  // console.log(sales_summary);
  // Create the table header row
  const headerRow = document.createElement('tr');
  //const productHeader = document.createElement('th');
  //headerRow.appendChild(productHeader);

  for (let i = 0; i < 6; i++) {
    const headerCell = document.createElement('th');
    headerCell.textContent = productNames[i];
    headerRow.appendChild(headerCell);
  }

  const totalHeader = document.createElement('th');
  totalHeader.textContent = 'Sales Total';
  headerRow.appendChild(totalHeader);

  summaryTable.appendChild(headerRow);

  const additionalRow = document.createElement('tr');
  additionalRow.classList.add('additional-row');
  const cell = document.createElement('td');
  cell.setAttribute('colspan', '7'); // Assuming there are 7 columns in total
  cell.textContent = `Day's Summary`; // You can assign the value you want here
  additionalRow.appendChild(cell);
  summaryTable.insertBefore(additionalRow, summaryTable.firstChild);

  // Create the table data row
  const dataRow = document.createElement('tr');
  // const productNameCell = document.createElement('td');
  // dataRow.appendChild(productNameCell);

  for (let i = 0; i < 6; i++) {
    const dataCell = document.createElement('td');
    dataCell.textContent = sales_summary[i];
    dataRow.appendChild(dataCell);
  }

  const totalCell = document.createElement('td');
  totalCell.textContent = sales_summary[6].toFixed(2);; // Total
  dataRow.appendChild(totalCell);

  summaryTable.appendChild(dataRow);
}

dateInput.addEventListener('change', function(event) {
  selectedDate = new Date(event.target.value);
  // selectedDate.setDate(selectedDate.getDate() + 1);
  dayOfWeek = (selectedDate.getDay() + 1)%7;
  selectedDate = formatDate(selectedDate);
  processDate = selectedDate;
  console.log(processDate);
  getOrderFromDate (selectedDate, dayOfWeek);
  // ipcRenderer.send('get-order-from-date', selectedDate, dayOfWeek);
  // You can perform other operations with the selectedDate variable here
});


async function createTable(data) {
    const table = document.createElement('table');
    const tableHeader = table.createTHead();
    const headerRow = tableHeader.insertRow();

    Object.keys(data[0]).forEach((key) => {
        if (key === 'CompanyID' || key === 'OrderID'){
            return;
        }
        const th = document.createElement('th');
        th.textContent = key;
        headerRow.appendChild(th);
    });

    const tableBody = table.createTBody();

    // Function to assign status based on date condition
    function assignStatusBasedOnDate(item) {
        // Convert the stored dates to JavaScript Date objects for comparison
        const processDateObj = new Date(processDate);
        const formattedDateObj = new Date(formattedDate);
        
        const isChangedRow = changedRows.some(row => row.processDate.getTime() === processDateObj.getTime() && row.company === item['Company']);

        if (isChangedRow) {
            item['Status'] = 'No Order';
        } else if (processDateObj < formattedDateObj && (item['Status'] === 'Must Check' || item['Status'] === 'Waiting')) {
            item['Status'] = 'No Order';
        }
    }

    // Apply the status change based on the date condition
    for (let item of data) {
        assignStatusBasedOnDate(item);
    }

    // Sorting function
    data.sort((a, b) => {
        // if (a['Status'] === b['Status']) {
        //     return a['Company'].localeCompare(b['Company']); // Sort by company if statuses are the same
        // }
        // return getStatusPriority(a['Status']) - getStatusPriority(b['Status']); // Otherwise, sort by status
        return a['Company'].localeCompare(b['Company']);
    });

    for (const item of data) {
        const row = tableBody.insertRow();
        // row.classList.add('display-table-row');
        // row.setAttribute('data-display-row',JSON.stringify(item));
        for (const key in item) {
            if (key === 'CompanyID' || key === 'OrderID'){
                continue;
            }
            const cell = row.insertCell();
            const recentProducts = await processRecentProducts(item['Company']);
            if (key === 'Status') {
                const btn = document.createElement('button');
                btn.classList.add('status-button');
                btn.setAttribute('data-company', item['Company']);
                btn.textContent = item[key];
                
                switch(item[key]) {
                    case 'Waiting':
                        btn.classList.add('waiting');
                        break;
                    case 'Ordered':
                        btn.classList.add('ordered');
                        break;
                    case 'Must Check':
                        btn.classList.add('must-check');
                        break;
                    case 'No Order':
                        btn.classList.add('no-order');
                        break;
                }
                cell.appendChild(btn);
            } else if (key === 'Company') {
                // cell.classList.add();
                if (item['Status'] === 'Waiting' || item['Status'] === 'Must Check') {
                    cell.classList.add('display-table-row');
                    cell.setAttribute('data-display-row',JSON.stringify(item));
                }
                cell.textContent = item[key];
            } else if (key === 'Type') {
                if (item[key] === 0) {
                    cell.textContent = 'Purchase';
                } else if (item[key] === 1) {
                    cell.textContent = 'Replaced';
                }
            } else if (key === 'Sales Total') {
                if (item['Type'] === 0) {
                    sales_summary[6] += parseFloat(item[key]);
                }
                cell.textContent = item['Type'] === 1 ? 0 : item[key];
            } else if (recentProducts.includes(key)) {
                cell.classList.add('frequent-item');
                cell.textContent = item[key];
            } else {
                cell.textContent = item[key];
            }
            for (let i = 0; i < productNames.length; i++) {
                if (key === productNames[i]) {
                  sales_summary[i] += item[key];
                }
            }
            // ipcRenderer.removeListener('get-company-recent-products-success');
        }
    }

    const tableDisplay = document.getElementById('table-display');
    if (tableDisplay) {
        tableDisplay.innerHTML = '';
        tableDisplay.appendChild(table);
    }
    fillSummaryTable();
}

function getStatusPriority(status) {
    switch (status) {
        case 'Must Check': return 1;
        case 'Waiting': return 2;
        case 'Ordered': return 3;
        case 'No Order': return 4;
        default: return 5;
    }
}

document.addEventListener('click', function(event) {
    if (event.target.matches('.status-button')) {
        console.log("Status button clicked");
        handleButtonClick(event);
    }
});

document.addEventListener('click', (event) => {
    // Check if the clicked element is within a product row with class "product-table-row"
    let row = event.target.closest('td.display-table-row');
    if (row) {
        event.preventDefault();
        // Extract the product data from the row's data-product attribute
        const displayData = JSON.parse(row.getAttribute('data-display-row'));
        // Sending the product data to the main process to open the product details page
        ipcRenderer.send('open-display-row', displayData);
    }
});

function handleButtonClick(event) {
    const company = event.target.getAttribute('data-company');
    const processDateObj = new Date(processDate);

    const isConfirmed = confirm('Are you sure you want to change status?');
    if (isConfirmed) {
        if (event.target.textContent === 'Must Check' || event.target.textContent === 'Waiting') {
            event.target.textContent = 'No Order';
            event.target.className = 'status-button no-order';
            changedRows.push({ processDate: processDateObj, company: company });
        }
    }
    sales_summary = [0,0,0,0,0,0,0];
    createTable(sqldata);
}


function processRecentProducts(companyName) {
    return new Promise((resolve, reject) => {
        ipcRenderer.send('get-company-recent-products', companyName);

        ipcRenderer.once('get-company-recent-products-success', (event, result) => {
            resolve(result);
        });

        ipcRenderer.once('get-company-recent-products-error', (event, error) => {
            reject(error);
        });
    });
}

// Function to filter table rows based on search query
function filterTable(searchQuery) {
    const table = document.getElementById('table-display');
    if (!table) {
        return;
    }

    const rows = table.querySelectorAll('tbody tr');
    rows.forEach((row) => {
        const companyNameCell = row.cells[1]; // Assuming the company name is in the first column
        if (!companyNameCell) {
            return;
        }

        const companyName = companyNameCell.textContent.toLowerCase();
        const shouldDisplay = companyName.includes(searchQuery.toLowerCase());
        row.style.display = shouldDisplay ? '' : 'none';
    });
}

// Listen for the "get-order-from-date-success" event
ipcRenderer.on('get-order-from-date-success', (event, results) => {
    const data = results;
    sales_summary = [0,0,0,0,0,0,0];
    createTable(data);
    sqldata = data;
    // fillSummaryTable();
});

// Call the function to populate the table
fillSummaryTable();

// Add an event listener to the search input
const searchInput = document.getElementById('orderSearchBar');
if (searchInput) {
    searchInput.addEventListener('input', (event) => {
        const searchQuery = event.target.value.trim();
        filterTable(searchQuery);
    });
}
document.addEventListener('DOMContentLoaded', function () {
    const buttons = document.querySelectorAll(".left-panel .panel-button");
    // Event listener to adjust the 'active' class
    ipcRenderer.send('request-all-customers');
    buttons.forEach(button => {
        button.addEventListener('click', function () {
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
            } else if (button.textContent.trim() === "Master Board") {
                ipcRenderer.send('navigate', 'masterBoardPage.html');
            }
        });
    });
});

