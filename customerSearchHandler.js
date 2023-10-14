const { ipcRenderer } = require('electron');

function handleSearch(searchQuery, connection) {
    return new Promise((resolve, reject) => {
        connection.query(
            'SELECT * FROM Customers WHERE customerName LIKE ? OR customerPhone LIKE ? OR customerFax LIKE ? OR customerEmail LIKE ?',
            [`%${searchQuery}%`, `%${searchQuery}%`, `%${searchQuery}%`, `%${searchQuery}%`],
            (err, results) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(results);
                }
            }
        );
    });
}
module.exports = { handleSearch };
