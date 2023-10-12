function renderProductTable(products) {
    const tableBody = document.getElementById('productsTableBody');

    tableBody.innerHTML = '';

    products.forEach(product => {
        const row = document.createElement('tr');

        const productDataString = JSON.stringify(product);
        const productIDLink = `
        <a href="#" class="product-id-link" data-product='${productDataString}' style="color: blue; text-decoration: underline;">
            ${product.productID}
        </a>`;
    
        const detailsButton = `
            <button class="product-details-button" data-product='${productDataString}'>
                Details
            </button>`;
            
        let available = product.productIsAvailable === 1 ? 'Yes' : 'No';
        
        row.innerHTML = `
            <td>${productIDLink}</td>
            <td>${product.productName}</td>
            <td>${product.productUnitPrice}</td>
            <td>${available}</td>
            <td>${product.productShelfLife}</td>
            <td>${product.productCategory}</td>
            <td>${detailsButton}</td>
        `;
        
        tableBody.appendChild(row);
    });
}

module.exports = { renderProductTable };
