(function() {
    const { ipcRenderer } = require('electron');
    const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    let orderEntryCount = 0;
    let searchTimeout;

    document.getElementById('addNewEntry').addEventListener('click', function() {
        orderEntryCount++;
        addOrderEntryButton(orderEntryCount);
        addOrderEntrySection(orderEntryCount);
        navigateToSection(orderEntryCount);
    });

    function addOrderEntryButton(count) {
        const button = document.createElement('button');
        button.innerHTML = `Order ${count} <img src='./image/x-button.png' class='close-icon'>`;
        button.classList.add('orderEntryButton');

        button.addEventListener('click', function(e) {
            if (e.target.tagName === 'IMG') {
                const userConfirmed = confirm('Are you sure you want to delete this entry?');
                if (userConfirmed) {
                    removeOrderEntrySection(count);
                    button.remove();
                }
            } else {
                const currentSection = document.getElementById(`mainSection${count}`);
                const searchInput = currentSection.querySelector('.search-input');
                const resultsContainer = currentSection.querySelector('.results-container');

                attachSearchEventListener(count, searchInput, resultsContainer); // Attach the event listener dynamically
                navigateToSection(count);
            }
        });

        const container = document.getElementById('buttonContainer');
        container.insertBefore(button, container.firstChild);
    }

    function removeOrderEntrySection(count) {
        const section = document.getElementById(`mainSection${count}`);
        if (section) {
            section.remove();
        }
    }

    function navigateToSection(count) {
        const mainSections = document.querySelectorAll('.main-section');
        mainSections.forEach(mainSection => mainSection.style.display = 'none');

        const targetMainSection = document.getElementById(`mainSection${count}`);
        if (targetMainSection) {
            targetMainSection.style.display = 'block';
        }
    }

    function addOrderEntrySection() {
        // Hide the current main-section
        const currentMainSection = document.querySelector('.main-section');
        if (currentMainSection) {
            currentMainSection.style.display = 'none';
        }

        // Create a new main-section
        const mainSection = document.createElement('div');
        mainSection.classList.add('main-section');
        mainSection.id = `mainSection${orderEntryCount}`;

        // Add the page-name div
        const pageNameDiv = document.createElement('div');
        pageNameDiv.classList.add('page-name');
        pageNameDiv.textContent = 'Order Entry';
        mainSection.appendChild(pageNameDiv);

        // Main customer info section
        const customerInfoSection = document.createElement('div');
        customerInfoSection.classList.add('customer-info-section');

        // Left section
        const customerInfoLeftSection = document.createElement('div');
        customerInfoLeftSection.classList.add('customer-info-left-section');

        // Search bar within the left section
        const searchBar = document.createElement('div');
        searchBar.classList.add('search-bar');

        const customerTitleSpan = document.createElement('span');
        customerTitleSpan.classList.add('customer-title');
        customerTitleSpan.innerHTML = 'Customer: ';

        const searchInput = document.createElement('input');
        searchInput.type = 'search';
        searchInput.classList.add('search-input');

        searchBar.appendChild(customerTitleSpan);
        searchBar.appendChild(searchInput);

        // Results container within the left section
        const searchResults = document.createElement('div');
        searchResults.classList.add('results-container');

        // Contact info within the left section
        const contactInfo = document.createElement('div');
        contactInfo.classList.add('contact-info');

        // Add all the left-section components to the left section
        customerInfoLeftSection.appendChild(searchBar);
        customerInfoLeftSection.appendChild(searchResults);
        customerInfoLeftSection.appendChild(contactInfo);

        // Right section
        const customerInfoRightSection = document.createElement('div');
        customerInfoRightSection.classList.add('customer-info-right-section');

        // Order section
        const orderSection = document.createElement('div');
        orderSection.classList.add('order-section');

        // Order entry section
        const orderEntrySection = document.createElement('div');
        orderEntrySection.classList.add('order-entry-section');
        addOrderEntryDetailsSection(orderEntrySection);

        // Order purchase history section
        const orderPurchaseHistorySection = document.createElement('div');
        orderPurchaseHistorySection.classList.add('order-purchase-history-section');

        // Add both left and right sections to the main customer info section
        customerInfoSection.appendChild(customerInfoLeftSection);
        customerInfoSection.appendChild(customerInfoRightSection);

        orderSection.appendChild(orderEntrySection);
        orderSection.appendChild(orderPurchaseHistorySection);

        // <hr style="height:5px; background-color: black; border: none;">
        const hr = document.createElement('hr');
        hr.style.height = "5px";
        hr.style.backgroundColor = "lightgray";
        hr.style.width = "95%";
        hr.style.margin = "10px auto";
        hr.style.border = "none";
        mainSection.appendChild(customerInfoSection);
        mainSection.appendChild(hr);
        mainSection.appendChild(orderSection);

        // Append the new main-section to its parent container
        const mainContent = document.querySelector('.main-content');
        mainContent.appendChild(mainSection);
        attachSearchEventListener(orderEntryCount, searchInput, searchResults);
    }

    ipcRenderer.on('order-customer-data', (event, customers, count) => {
        const currentSection = document.getElementById(`mainSection${count}`);
        const searchInput = currentSection.querySelector('.search-input');
        const resultsContainer = currentSection.querySelector('.results-container');
        const searchBar = currentSection.querySelector('.search-bar');
        displayResults(customers, count, searchInput, resultsContainer, searchBar);
    });
    
    ipcRenderer.on('order-customer-data-error', (event, error) => {
        console.error('Error fetching order customer:', error);
    });
    
    function attachSearchEventListener(count, searchInput, resultsContainer) {
        if (searchInput) {
            searchInput.addEventListener('input', () => {
                // clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    const searchQuery = searchInput.value;
                    if (searchQuery.trim() === '') {
                        resultsContainer.innerHTML = '';
                        resultsContainer.style.display = 'none';
                        clearMainContent(count);
                        removeStatusButton(count);
                    } else {
                        ipcRenderer.send('perform-order-customer-search', searchQuery, count);
                    }
                }, 300);
            });
        }
    }

    function addOrderEntryDetailsSection(orderEntrySection) {
        // Date Selection Section
        const dateSelectionDiv = document.createElement('div');
        const dateLabel = document.createElement('label');
        dateLabel.setAttribute('for', 'date-input');
        dateLabel.textContent = 'Date' + '\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0';
        dateLabel.style.fontWeight = 'bold';
        dateSelectionDiv.appendChild(dateLabel);

        const dateInput = document.createElement('input');
        dateInput.type = 'date';
        dateInput.id = 'date-input';
        dateInput.addEventListener('change', displayFormattedDate);
        dateSelectionDiv.appendChild(dateInput);

        const dayOfWeekSpan = document.createElement('span');
        dayOfWeekSpan.id = 'day-of-week';
        dateSelectionDiv.appendChild(dayOfWeekSpan);
        dateSelectionDiv.style.marginBottom = '10px';

        orderEntrySection.appendChild(dateSelectionDiv);

        // Channel Selection Section
        const channels = ['Phone', 'Email', 'Fax'];
        const channelsLabel = document.createElement('label');
        channelsLabel.textContent = 'Channel' + '\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0';
        channelsLabel.style.fontWeight = 'bold';
        const channelSelectionDiv = document.createElement('div');
        // channelSelectionDiv.classList.add('channel-selection');
        channelSelectionDiv.appendChild(channelsLabel);
        channels.forEach(channel => {
            const button = document.createElement('button');
            button.classList.add('channel-button');
            button.textContent = channel;
            button.addEventListener('click', function() {
                // Remove 'selected' class from all other channel buttons
                const selectedChannelButton = channelSelectionDiv.querySelector('.channel-button.selected');
                if (selectedChannelButton) {
                    selectedChannelButton.classList.remove('selected');
                }
                // Add 'selected' class to the clicked button
                button.classList.add('selected');
            });
            channelSelectionDiv.appendChild(button);
        });
        channelSelectionDiv.style.marginBottom = '10px';
        orderEntrySection.appendChild(channelSelectionDiv);

        // Type Selection Section
        const types = ["Purchase", "Replace"];
        const typesLabel = document.createElement('label');
        typesLabel.textContent = 'Type' + '\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0';
        typesLabel.style.fontWeight = 'bold';
        const typeSelectionDiv = document.createElement('div');
        typeSelectionDiv.appendChild(typesLabel);
        // typeSelectionDiv.classList.add('type-selection');
        types.forEach(type => {
            const button = document.createElement('button');
            button.classList.add('type-button');
            button.textContent = type;
            button.addEventListener('click', function() {
                // Remove 'selected' class from all other type buttons
                const selectedTypeButton = typeSelectionDiv.querySelector('.type-button.selected');
                if (selectedTypeButton) {
                    selectedTypeButton.classList.remove('selected');
                }
                // Add 'selected' class to the clicked button
                button.classList.add('selected');
            });
            typeSelectionDiv.appendChild(button);
        });
        typeSelectionDiv.style.marginBottom = '10px';
        orderEntrySection.appendChild(typeSelectionDiv);

        // PO Input Selection
        const poInputDiv = document.createElement('div');
        const poLabel = document.createElement('label');
        poLabel.setAttribute('for', 'po-input');
        poLabel.textContent = 'PO#' + '\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0';
        poLabel.style.fontWeight = 'bold';
        poInputDiv.appendChild(poLabel);

        const poInput = document.createElement('input');
        poInput.id = 'po-input';
        poInput.type = 'text';
        poInputDiv.appendChild(poInput);
        poInputDiv.style.marginBottom = '15px';
        orderEntrySection.appendChild(poInputDiv);
        createOrderEntryTable(orderEntrySection);
    }

    function createOrderEntryTable(orderEntrySection){
        const prices = {};
        const table = document.createElement('table');
        table.id = 'orderEntryTable';
        table.classList.add('order-entry-table');
        const thead = document.createElement('thead');
        const tbody = document.createElement('tbody');

        // Table headers
        const headers = ['Item', 'Quantity', 'Sales'];
        const trHead = document.createElement('tr');
        headers.forEach(headerText => {
            const th = document.createElement('th');
            th.textContent = headerText;
            trHead.appendChild(th);
        });
        thead.appendChild(trHead);
        table.appendChild(thead);

        // Send a request to the backend to fetch product data
        ipcRenderer.send('get-product-data');
        ipcRenderer.on('get-product-data-success', (event, data) => {
            ipcRenderer.removeAllListeners('get-product-data-success');
            // Table body
            const items = data.map(product => product.productName);
            data.forEach(product => {
                prices[product.productName] = product.productUnitPrice;
            });

            items.forEach(item => {
                const tr = document.createElement('tr');
                
                // Item column
                const tdItem = document.createElement('td');
                tdItem.textContent = item;
                tr.appendChild(tdItem);

                // Quantity column
                const tdQuantity = document.createElement('td');
                ['-10', '-1', 'input', '+1', '+10'].forEach(type => {
                    if (type === 'input') {
                        const input = document.createElement('input');
                        input.type = 'number';
                        input.step = '1';  // Ensure only integer values
                        input.value = 0;
                        input.min = '0';   // Set the minimum value
                        input.style.width = '50px';   // Set width
                        input.style.height = '20px';  // Set height
                        input.addEventListener('input', updateSales);
                        tdQuantity.appendChild(input);
                    } else {
                        const button = document.createElement('button');
                        button.classList.add("adjust-quantity-button");
                        button.textContent = type;
                        button.addEventListener('click', function() {
                            adjustQuantity(tdQuantity, parseInt(type, 10));
                            updateSales();
                        });
                        tdQuantity.appendChild(button);
                    }
                });
                tr.appendChild(tdQuantity);

                // Sales column
                const tdSales = document.createElement('td');
                tdSales.textContent = '$0.00';  // Default sales value
                tr.appendChild(tdSales);

                tbody.appendChild(tr);
            });
            // Add the order total row to the table body
            const orderTotalRow = document.createElement('tr');
            orderTotalRow.classList.add('order-total-row');

            const tdLabel = document.createElement('td');
            tdLabel.textContent = 'Order Total:';
            tdLabel.setAttribute('colspan', '2');  // Span across "Item" and "Quantity" columns

            const tdTotal = document.createElement('td');
            tdTotal.textContent = '$0.00';  // Initial total value

            orderTotalRow.appendChild(tdLabel);
            orderTotalRow.appendChild(tdTotal);
            tbody.appendChild(orderTotalRow);

            table.appendChild(tbody);
            orderEntrySection.appendChild(table);
        });

        function adjustQuantity(tdQuantity, adjustment) {
            const input = tdQuantity.querySelector('input');
            const newValue = parseInt(input.value, 10) + adjustment;

            // Ensure the value is not less than 0
            input.value = newValue < 0 ? 0 : newValue;
        }
        
        function updateSales() {
            // Calculate sales for each row and update the Sales column
            let totalSales = 0;
            const rows = tbody.querySelectorAll('tr:not(.order-total-row)');
            rows.forEach(row => {
                const itemName = row.querySelector('td:nth-child(1)').textContent;
                const quantity = parseInt(row.querySelector('td:nth-child(2) input').value, 10);
                const salesCell = row.querySelector('td:nth-child(3)');
                const sales = quantity * prices[itemName];
                salesCell.textContent = '$' + sales.toFixed(2);
                totalSales += sales;
            });

            // Update the order total row
            const tdTotal = tbody.querySelector('.order-total-row td:nth-child(2)');
            tdTotal.textContent = '$' + totalSales.toFixed(2);
        }
    }

    function displayResults(customers, count, searchInput, resultsContainer, searchBar) {
        resultsContainer.innerHTML = '';
        customers.forEach(customer => {
            const item = document.createElement('div');
            item.classList.add('result-item');
            item.textContent = customer.customerName;

            // Add an event listener to hide the results container when clicked
            item.addEventListener('click', function() {
                // Handle the customer selection
                searchInput.value = customer.customerName;
                resultsContainer.style.display = 'none';  // Hide the container
                let isActive = customer.customerIsActive === 1;

                // Create the button or select it if it already exists
                let statusButton = document.createElement('button');
                statusButton.id = 'statusButton';
                statusButton.textContent = isActive ? 'Active' : 'Inactive';

                // Apply the appropriate class based on the customer's active status
                statusButton.className = isActive ? 'button-active' : 'button-inactive';

                // Append the button to the desired container (assuming it's next to the search input)
                let span = document.createElement('span');
                span.classList.add("status-title");
                span.textContent = 'Status:';
                searchBar.appendChild(span);
                searchBar.appendChild(statusButton);
                const customerID = customer.customerID;
                ipcRenderer.send('get-contacts-for-order-company', customerID, count);
                ipcRenderer.send('get-info-for-order-company', customerID, count);
                ipcRenderer.send('perform-order-history-search-for-customer', customerID, count);
            });
            resultsContainer.appendChild(item);
        });

        resultsContainer.style.display = customers.length ? 'block' : 'none';
    }

    ipcRenderer.on('get-contacts-for-order-company-success', (event, contacts, count) => {
        const currentSection = document.getElementById(`mainSection${count}`);
        const contactInfoSection = currentSection.querySelector('.contact-info');
        displayContactResults(contacts, contactInfoSection);

    });

    ipcRenderer.on('get-info-for-order-company-success', (event, customers, count) => {
        const currentSection = document.getElementById(`mainSection${count}`);
        const customerInfoRightSection = currentSection.querySelector('.customer-info-right-section');
        displayCustomerInfoRightSection(customers, customerInfoRightSection);
    });

    ipcRenderer.on('perform-order-history-search-for-customer-success', (event, rows, count) => {
        const currentSection = document.getElementById(`mainSection${count}`);
        const orderPurchaseHistorySection = currentSection.querySelector('.order-purchase-history-section');
        displayOrderPurchaseHistorySection(rows, orderPurchaseHistorySection);
    });

    function displayContactResults(contacts, contactInfoSection){
        // Create a table element
        contactInfoSection.innerHTML = '';
        const table = document.createElement('table');
        table.classList.add('contacts-table-unique');
        // Add table headers
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        const headers = ['Name', 'Phone', 'Email'];
        headers.forEach(header => {
            const th = document.createElement('th');
            th.textContent = header;
            headerRow.appendChild(th);
        });
        thead.appendChild(headerRow);
        table.appendChild(thead);

        // Add table data
        const tbody = document.createElement('tbody');
        contacts.forEach(contact => {
            const tr = document.createElement('tr');
            const name = contact.contactName;
            const values = [name, formatNumber(contact.contactPhone), contact.contactEmail];
            values.forEach(value => {
                const td = document.createElement('td');
                td.textContent = value;
                tr.appendChild(td);
            });
            tbody.appendChild(tr);
        });
        table.appendChild(tbody);

        // Append the table to the orderHistoryContent div
        contactInfoSection.appendChild(table);
    }

    function displayCustomerInfoRightSection(customers, customerInfoRightSection){
        const customerData = customers[0];
        customerInfoRightSection.innerHTML = '';

        const p_deliverySchedule = document.createElement('p');
        p_deliverySchedule.innerHTML = `<span class="bold-text">Delivery Schedule:</span> <span class="highlight">${numToName(customerData.customerSchedule)}</span><br>`;
        customerInfoRightSection.appendChild(p_deliverySchedule);

        const p_mustCheck = document.createElement('p');
        let mustCheck = customerData.customerIsMustCheck === 1 ? 'Yes' : 'No';
        p_mustCheck.innerHTML = `<span class="bold-text">Must Check:</span> <span class="highlight">${mustCheck}</span>`;
        customerInfoRightSection.appendChild(p_mustCheck);

        const p_category = document.createElement('p');
        p_category.innerHTML = `<span class="bold-text">Sector:</span> <span class="highlight">${customerData.customerCategory_0}</span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span class="bold-text">Category:</span> <span class="highlight">${customerData.customerCategory_1}</span>`;
        customerInfoRightSection.appendChild(p_category);

        const p_companyPhone = document.createElement('p');
        p_companyPhone.innerHTML = `<span class="bold-text">Company Phone:</span> <span class="highlight">${formatNumber(customerData.customerPhone)}</span>`;
        customerInfoRightSection.appendChild(p_companyPhone);

        const p_companyFax = document.createElement('p');
        p_companyFax.innerHTML = `<span class="bold-text">Company Fax:</span> <span class="highlight">${formatNumber(customerData.customerFax)}</span>`;
        customerInfoRightSection.appendChild(p_companyFax);

        const p_companyEmail = document.createElement('p');
        p_companyEmail.innerHTML = `<span class="bold-text">Company Email:</span> <span class="highlight">${customerData.customerEmail}</span>`;
        customerInfoRightSection.appendChild(p_companyEmail);

        const p_companyAddress = document.createElement('p');
        p_companyAddress.innerHTML = `<span class="bold-text">Company Address:</span> <span class="highlight">${customerData.customerAddress}</span>`;
        customerInfoRightSection.appendChild(p_companyAddress);

    }

    function displayOrderPurchaseHistorySection(rows, orderPurchaseHistorySection){
        orderPurchaseHistorySection.innerHTML = '';
        // Organize the data
        const organizedData = {};
        rows.forEach(row => {
            if (!organizedData[row.productName]) {
                organizedData[row.productName] = {};
            }
            organizedData[row.productName][formatDate(row.orderDate)] = row.productQuantity;
        });
    
        // Get all unique dates for table headers
        const uniqueDates = [...new Set(rows.map(row => formatDate(row.orderDate)))].sort();
        const table = document.createElement('table');
        table.classList.add('order-purchase-history-table');
        table.id = 'orderPurchaseHistoryTable';
        const thead = document.createElement('thead');
        const tbody = document.createElement('tbody');
        table.append(thead);
        table.append(tbody);
    
        const titleRow = document.createElement('tr');
        const titleHeader = document.createElement('th');
        titleHeader.textContent = 'Purchase History'
        titleHeader.setAttribute('colspan', uniqueDates.length + 1);
        titleHeader.style.fontWeight = 'bold';
        titleRow.appendChild(titleHeader);
        thead.appendChild(titleRow);
    
        // Create the date headers row
        const dateRow = document.createElement('tr');
        const emptyHeader = document.createElement('th'); // For the product names column
        dateRow.appendChild(emptyHeader);
    
        ipcRenderer.send('get-product-data');
        ipcRenderer.on('get-product-data-success', (event, data) => {
            ipcRenderer.removeAllListeners('get-product-data-success');
            const allProducts = data.map(product => product.productName);
    
            uniqueDates.forEach(date => {
                const th = document.createElement('th');
                const dateObj = new Date(date);
                const formattedDate = dateObj.toISOString().split('T')[0]; // This will give you YYYY-MM-DD format
                const weekday = dateObj.toLocaleString('default', { weekday: 'short' });
                th.textContent = `${formattedDate} (${weekday})`;
                dateRow.appendChild(th);
            });
            thead.appendChild(dateRow);
    
            allProducts.forEach(product => {
                const tr = document.createElement('tr');
                const tdProduct = document.createElement('td');
                tdProduct.textContent = product;
                tr.appendChild(tdProduct);
            
                uniqueDates.forEach(date => {
                    const td = document.createElement('td');
                    td.textContent = (organizedData[product] && organizedData[product][date]) || ''; // If no quantity, display empty
                    tr.appendChild(td);
                });
            
                tbody.appendChild(tr);
            });
            orderPurchaseHistorySection.appendChild(table);
        });
    }
    

    ipcRenderer.on('get-contacts-for-order-company-error', (event, error) => {
        console.error('Error fetching contacts for order customer:', error);
    });

    ipcRenderer.on('get-info-for-order-company-error', (event, error) => {
        console.error('Error fetching info for order customer:', error);
    });

    ipcRenderer.on('perform-order-history-search-for-customer-error', (event, error) => {
        console.error('Error performing order history search for customer:', error);
    });

    ipcRenderer.on('get-product-data-error', (event, error) => {
        ipcRenderer.removeAllListeners('get-product-data-success');
        console.error('Error getting product data:', error);
    });

    function clearMainContent(count) {
        // Assuming the main content is in a container with class 'main-content'
        const currentSection = document.getElementById(`mainSection${count}`);
        const contactContent = currentSection.querySelector('.contact-info');
        const rightContent = currentSection.querySelector('.customer-info-right-section');
        const statusTitle = currentSection.querySelector('.status-title');
        const orderPurchaseHistorySection = currentSection.querySelector('.order-purchase-history-section');

        if (contactContent) {
            contactContent.innerHTML = '';  // Clear the content
        }
        if (rightContent) {
            rightContent.innerHTML = '';
        }
        if (statusTitle) {
            statusTitle.innerHTML = '';
        }
        if (orderPurchaseHistorySection) {
            orderPurchaseHistorySection.innerHTML = '';
        }
    }

    function removeStatusButton(count) {
        const currentSection = document.getElementById(`mainSection${count}`);
        const statusButton = currentSection.querySelector('#statusButton');
        const statusTitle = currentSection.querySelector('.status-title');
        if (statusButton) {
            statusButton.remove();  // Remove the button from the DOM
        }

        if (statusTitle) {
            statusTitle.remove();
        }
    }

    function initializeFirstCustomer() {
        orderEntryCount++;
        addOrderEntryButton(orderEntryCount);
        addOrderEntrySection(orderEntryCount);
        navigateToSection(orderEntryCount);
    }

    function handleSubmit(){

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

    function formatDate(date) {
        const year = date.getFullYear();
        
        // Add 1 to the month and ensure it's 2 digits long
        const month = ("0" + (date.getMonth() + 1)).slice(-2);
        
        // Ensure the day is 2 digits long
        const day = ("0" + date.getDate()).slice(-2);
        
        return `${year}-${month}-${day}`;
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
    
    function displayFormattedDate(event) {
        // Get the selected date string in 'YYYY-MM-DD' format
        const [year, month, day] = event.target.value.split('-').map(part => parseInt(part, 10));
        
        // Create a new Date object using the parts
        const selectedDate = new Date(year, month - 1, day);  // month is 0-indexed in JavaScript
        
        const options = { weekday: 'long'};
        document.getElementById('day-of-week').textContent = " (" + selectedDate.toLocaleDateString(undefined, options) + ")";
    }
    
    module.exports = {
        initOrderEntryModule: function() {
            // Add the event listener for the "Add" button to add more customers
            document.getElementById('addNewEntry').addEventListener('click', function() {
                orderEntryCount++;
                addOrderEntryButton(orderEntryCount);
                addOrderEntrySection(orderEntryCount);
                navigateToSection(orderEntryCount);
            });
        }
    };
    
    // Initialize the first customer when the module is loaded
    initializeFirstCustomer();
})();