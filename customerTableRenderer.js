function renderCustomerTable(customers) {
    const tableBody = document.getElementById('customersTableBody');
    if (!tableBody) return;
    tableBody.innerHTML = '';

    customers.forEach(customer => {
        const row = document.createElement('tr');

        const customerDataString = JSON.stringify(customer);
        const customerIDLink = `
        <a href="#" class="customer-id-link" data-product='${customerDataString}' style="color: blue; text-decoration: underline;">
            ${customer.customerID}
        </a>`;
    
        const detailsButton = `
            <button class="product-details-button" data-product='${customerDataString}'>
                Details
            </button>`;
       
        row.innerHTML = `
            <td>${customerIDLink}</td>
            <td>${customer.customerName}</td>
            <td>${customer.customerCategory_0}</td>
            <td>${customer.customerCategory_1}</td>
            <td>${customer.customerPhone}</td>
            <td>${customer.customerFax}</td>
            <td>${customer.customerEmail}</td>
            <td>${detailsButton}</td>
        `;
        
        tableBody.appendChild(row);
    });
}

module.exports = { renderCustomerTable };