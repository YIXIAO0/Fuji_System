let orderEntryCount = 0;

document.getElementById('addNewEntry').addEventListener('click', function() {
    orderEntryCount++;
    addOrderEntryButton(orderEntryCount);
    addOrderEntrySection(orderEntryCount);
    navigateToSection(orderEntryCount);
});

function addOrderEntryButton(count) {
    const button = document.createElement('button');
    button.innerHTML = `Customer ${count} <img src='./image/x-button.png' class='close-icon'>`;
    button.classList.add('orderEntryButton');

    button.addEventListener('click', function(e) {
        if (e.target.tagName === 'IMG') {
            // Ask the user for confirmation
            const userConfirmed = confirm('Are you sure you want to delete this entry?');
            
            if (userConfirmed) {
                removeOrderEntrySection(count);
                button.remove();
            }
        } else {
            navigateToSection(count);
        }
    });

    const container = document.getElementById('buttonContainer');
    container.insertBefore(button, container.firstChild);
}

function addOrderEntrySection(count) {
    const section = document.createElement('div');
    section.classList.add('orderEntrySection');
    section.id = `orderEntry${count}`;
    section.innerHTML = `This is the content for orderEntry${count}`;
    // Note: You can fill this section with your specific content structure and inputs
    
    const mainSection = document.querySelector('.main-section');
    mainSection.appendChild(section);
}

function navigateToSection(count) {
    const sections = document.querySelectorAll('.orderEntrySection');
    sections.forEach(section => section.style.display = 'none');
    
    const targetSection = document.getElementById(`orderEntry${count}`);
    if (targetSection) {
        targetSection.style.display = 'block';
    }
}

function removeOrderEntrySection(count) {
    const section = document.getElementById(`orderEntry${count}`);
    if (section) {
        section.remove();
    }
}


