const { ipcRenderer } = require('electron');

function handleSearch(searchQuery, connection) {
    return new Promise((resolve, reject) => {
        connection.query('SELECT * FROM Products WHERE productName LIKE ?', [`%${searchQuery}%`], (err, results) => {
            if (err) {
                reject(err);
            } else {
                resolve(results);
            }
        });
    });
}
module.exports = { handleSearch };
