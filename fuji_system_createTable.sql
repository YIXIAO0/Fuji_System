USE Fuji_System_Version2;

CREATE TABLE Products (
    productID INT NOT NULL AUTO_INCREMENT,
    productName CHAR(30),
    productUnitPrice DECIMAL(6, 2),
    productIsAvailable BOOL,
    productShelfLife INT NOT NULL,
    productCategory ENUM('Chip', 'Chocolate'),
    PRIMARY KEY (productID)
);

CREATE TABLE Contacts(
	contactID INT NOT NULL AUTO_INCREMENT,
    contactName CHAR (60),
    contactPhone CHAR(10),
    contactEmail CHAR(50),
    contactPriority ENUM('2', '1', '0'), 
    contactNotes VARCHAR(256),
    PRIMARY KEY (contactID)
);

CREATE TABLE Customers(
	customerID INT NOT NULL AUTO_INCREMENT,
    customerName CHAR(60),
    customerAddress CHAR(100),
    customerCategory_0 ENUM('Technology', 'Consumer Discretionary', 'Financials', 'Health Care', 'Consumer Staples'),
    customerCategory_1 ENUM('Retail', 'Wholesale'),
    customerPhone CHAR(10),
    customerFax CHAR(10),
    customerEmail CHAR(50),
    customerIsActive BOOL,
    customerIsMustCheck BOOL,
    customerSchedule CHAR(7),
    customerSince DATE,
    PRIMARY KEY (customerID)
);

CREATE TABLE CustomerContacts(
	customerID INT,
	contactID INT,
	FOREIGN KEY (customerID) REFERENCES Customers(customerID),
	FOREIGN KEY (contactID) REFERENCES Contacts(contactID),
	PRIMARY KEY (customerID, contactID)
);

CREATE TABLE Orders(
	orderID INT NOT NULL AUTO_INCREMENT,
    invoiceID INT, 
    customerID INT,
    FOREIGN KEY (customerID) REFERENCES Customers(customerID),
    orderDate DATE,
    orderTotal Decimal(10, 2),
    orderIsReturn BOOL,
    orderChannel ENUM('Email', 'Phone', 'Fax'),
    orderStatus ENUM('Received', 'Delivered', 'Cancelled', 'Completed'),
    orderPO CHAR(60),
    PRIMARY KEY (orderID)
);

CREATE TABLE OrderProducts(
	orderID INT,
    productID INT,
    productQuantity INTEGER NOT NULL,
    FOREIGN KEY (orderID) REFERENCES Orders(orderID),
    FOREIGN KEY (productID) REFERENCES Products(productID),
    PRIMARY KEY (orderID, productID)
);


