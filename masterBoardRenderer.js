const { ipcRenderer} = require('electron');

var today = new Date();

// Set default date to tomorrow
var tomorrow = new Date(today);
tomorrow.setDate(tomorrow.getDate() + 1);

var yyyy = tomorrow.getFullYear();
var mm = String(tomorrow.getMonth() + 1).padStart(2, '0');
var dd = String(tomorrow.getDate()).padStart(2, '0');
var formattedDate = yyyy + '-' + mm + '-' + dd;

// Set the default value of the date input to tomorrow's date
document.getElementById('orderDate').value = formattedDate;

// Get the day of the week
var days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
var dayOfWeek = days[tomorrow.getDay()];

// Add an event listener to update the variable when the date changes
var dateInput = document.getElementById('orderDate');
var selectedDate = '';

function formatDate(date) {
  /*const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;*/
  const formattedDate = date.toISOString().slice(0, 10);
  return formattedDate;
}

dateInput.addEventListener('change', function(event) {
  selectedDate = new Date(event.target.value);
  // selectedDate.setDate(selectedDate.getDate() + 1);
  dayOfWeek = (selectedDate.getDay() + 1)%7;
  selectedDate = formatDate(selectedDate);
  ipcRenderer.send('get-order-from-date', selectedDate, dayOfWeek);
  // You can perform other operations with the selectedDate variable here
});

ipcRenderer.on('get-order-from-date-success', (event, results) => {
  //console.log("Back to MBR");
  const data = results;
  const table = document.createElement('table');
  const tableHeader = table.createTHead();
  const headerRow = tableHeader.insertRow();

  Object.keys(data[0]).forEach(key => {
      let th = document.createElement('th');
      th.textContent = key;
      headerRow.appendChild(th);
  });

  const tableBody = table.createTBody();

  data.forEach(item => {
      let row = tableBody.insertRow();
      for (const key in item) {
          let cell = row.insertCell();
          if (key === 'orderDate') {
              const date = new Date(item[key]);
              cell.textContent = date.toLocaleDateString('en-CA');
          } else {
              cell.textContent = item[key];
          }
      }
  });

  const tableDisplay = document.getElementById('table-display');
  if (tableDisplay) {
    tableDisplay.innerHTML = '';
  }  
  tableDisplay.appendChild(table);
})
