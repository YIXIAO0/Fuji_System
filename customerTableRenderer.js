const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
function renderCustomerTable(customers) {
    const tableBody = document.getElementById('customersTableBody');
    if (!tableBody) return;
    tableBody.innerHTML = '';

    customers.forEach(customer => {
        const row = document.createElement('tr');
        row.classList.add('customer-table-row');
        const customerDataString = JSON.stringify(customer);
        row.setAttribute('data-customer', customerDataString);

        let statusButton;
        if (customer.customerIsActive === 1){
            statusButton = '<button class="active-button">Active</button>';
        }else{
            statusButton = '<button class="inactive-button">Inactive</button>';
        }
    
        const days = numToName(customer.customerSchedule);
       
        row.innerHTML = `
            <td>${customer.customerName}</td>
            <td>${customer.customerCategory_0}</td>
            <td>${customer.customerCategory_1}</td>
            <td>${days}</td>
            <td>${statusButton}</td>
        `;
        
        tableBody.appendChild(row);
    });
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

module.exports = { renderCustomerTable };