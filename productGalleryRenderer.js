function renderProductGallery(products) {
    const galleryContainer = document.querySelector('.content-product-gallery-page');
    galleryContainer.innerHTML = ''; // Clear existing content
    let productRow = document.createElement('div');
    productRow.classList.add('product-row');
    let count = 0;

    products.forEach((product, index) => {
        const productButton = document.createElement('button');
        productButton.classList.add('product');

        const productName = product.productName;
        const productPathName = productName.replace(/ /g, "_");
        
        productButton.innerHTML = `
            <img src="./image/products/${productPathName}.png" alt="Product ${product.productID} Image" class="product-image">
            <p class="product-name">${productName}</p>
            <p class="product-price">$${product.productUnitPrice}</p>
        `;

        productRow.appendChild(productButton);

        // Every 4 products, append the row and create a new one
        if ((index + 1) % 4 === 0) {
            galleryContainer.appendChild(productRow);
            productRow = document.createElement('div');
            productRow.classList.add('product-row');
        }
        count = index + 1;
    });

    const newProductButton = document.createElement('button');
    newProductButton.classList.add('product');
    newProductButton.innerHTML = `
        <img src="./image/plus.png" alt="Add Image" class="add-product-image">
        <p class="add-title">Add New Product</p>
    `;
    productRow.appendChild(newProductButton);
    

    // Append any remaining products in the last row
    if (productRow.childElementCount > 0) {
        galleryContainer.appendChild(productRow);
    }
}

module.exports = { renderProductGallery };
