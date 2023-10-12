const { ipcRenderer} = require('electron');

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
});

// Add event listener for the "Go Back" button
document.querySelector('.goBackButton').addEventListener('click', () => {
    // Notify the main process to navigate back to the product search page
    ipcRenderer.send('navigate-back-to-search');
});

