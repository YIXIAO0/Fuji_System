function toggleTableView() {
    document.querySelector('.content-product-table-page').style.display = 'block';
    document.querySelector('.content-product-gallery-page').style.display = 'none';
    document.getElementById('tableToggle').classList.add('active');
    document.getElementById('galleryToggle').classList.remove('active');
}

function toggleGalleryView() {
    document.querySelector('.content-product-table-page').style.display = 'none';
    document.querySelector('.content-product-gallery-page').style.display = 'block';
    document.getElementById('galleryToggle').classList.add('active');
    document.getElementById('tableToggle').classList.remove('active');
}

module.exports = { toggleTableView, toggleGalleryView };
