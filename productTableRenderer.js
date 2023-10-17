function renderProductTable(products) {
    const tableBody = document.getElementById('productsTableBody');
    if (!tableBody) return;
    tableBody.innerHTML = '';

    products.forEach(product => {
        const row = document.createElement('tr');
        row.classList.add('product-table-row');
        const productDataString = JSON.stringify(product);
        row.setAttribute('data-product', productDataString);
    
        let availableButton;
        if (product.productIsAvailable === 1){
            availableButton = '<button class="available-button">Available</button>';
        }else{
            availableButton = '<button class="unavailable-button">Unavailable</button>';
        }
        const currProductUnitPrice = `$${product.productUnitPrice}`;
        
        row.innerHTML = `
            <td>${product.productName}</td>
            <td>${product.productCategory}</td>
            <td>${currProductUnitPrice}</td>
            <td>${shelfLifeConversion(product.productShelfLife)}</td>
            <td>${availableButton}</td>
        `;
        
        tableBody.appendChild(row);
    });
}

function shelfLifeConversion(input){
    if (input === 1){
        return "1 day";
    }else{
        return `${input} days`;
    }

}

module.exports = { renderProductTable };
