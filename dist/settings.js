function backupData() {
    const database = firebase.database();

    const usersRef = database.ref('users');
    const driversRef = database.ref('drivers');

    usersRef.once('value', (usersSnapshot) => {
        const usersData = usersSnapshot.val();

        const usersJson = JSON.stringify(usersData);

        const usersBlob = new Blob([usersJson], { type: 'application/json' });

        const usersLink = document.createElement('a');
        usersLink.href = URL.createObjectURL(usersBlob);
        usersLink.download = 'users.json';
        usersLink.click();

        driversRef.once('value', (driversSnapshot) => {
            const driversData = driversSnapshot.val();
            const driversJson = JSON.stringify(driversData);
            const driversBlob = new Blob([driversJson], { type: 'application/json' });

            const driversLink = document.createElement('a');
            driversLink.href = URL.createObjectURL(driversBlob);
            driversLink.download = 'drivers.json';
            driversLink.click();

            document.getElementById("backup-data-alert").style.display = "block";
        });
    });
}
document.getElementById('backup-data-btn').addEventListener('click', backupData);
document.getElementById('upload-data-btn').addEventListener('click', function () {
    const fileInput = document.getElementById('upload-json');
    const file = fileInput.files[0];

    if (!file) {
        alert('Please select a JSON file to upload.');
        return;
    }

    const reader = new FileReader();
    reader.onload = function (event) {
        try {
            const jsonData = JSON.parse(event.target.result);
            const usersRef = database.ref('users');
            const driversRef = database.ref('drivers');

            const uploadPromises = [];

            if (jsonData.users) {
                Object.keys(jsonData.users).forEach(userId => {
                    const userPromise = usersRef.child(userId).set(jsonData.users[userId]);
                    uploadPromises.push(userPromise);
                });
            }

            if (jsonData.drivers) {
                Object.keys(jsonData.drivers).forEach(driverId => {
                    const driverPromise = driversRef.child(driverId).set(jsonData.drivers[driverId]);
                    uploadPromises.push(driverPromise);
                });
            }

            Promise.all(uploadPromises)
                .then(() => {
                    document.getElementById('upload-data-alert').style.display = 'block';
                    document.getElementById('upload-data-error').style.display = 'none';
                })
                .catch(error => {
                    console.error('Error uploading data:', error);
                    document.getElementById('upload-data-error').style.display = 'block';
                    document.getElementById('upload-data-alert').style.display = 'none';
                });
        } catch (error) {
            console.error('Error parsing JSON:', error);
            document.getElementById('upload-data-error').style.display = 'block';
            document.getElementById('upload-data-alert').style.display = 'none';
        }
    };

    reader.readAsText(file);
});

const pages = [
    { name: "Drivers", url: "drivers.html" },
    { name: "Feedbacks", url: "feedbacks.html" },
    { name: "Home", url: "index.html" },
    { name: "Trips", url: "trips.html" },
    { name: "Users", url: "users.html" }
];

const searchInput = document.getElementById('search-input');
const suggestionsBox = document.getElementById('suggestions');

searchInput.addEventListener('input', function () {
    const query = this.value.toLowerCase();
    suggestionsBox.innerHTML = '';
    suggestionsBox.style.display = 'none';

    if (query) {
        const filteredPages = pages.filter(page => page.name.toLowerCase().includes(query));
        filteredPages.forEach(page => {
            const suggestionItem = document.createElement('div');
            suggestionItem.classList.add('suggestion-item');
            suggestionItem.textContent = page.name;
            suggestionItem.onclick = () => {
                window.location.href = page.url;
            };
            suggestionsBox.appendChild(suggestionItem);
        });
        if (filteredPages.length > 0) {
            suggestionsBox.style.display = 'block';
        }
    }
});

searchInput.addEventListener('keydown', function (event) {
    if (event.key === 'Enter') {
        const query = this.value.toLowerCase();
        const page = pages.find(page => page.name.toLowerCase() === query);
        if (page) {
            window.location.href = page.url;
        }
    }
});

document.addEventListener('click', function (event) {
    if (!searchInput.contains(event.target) && !suggestionsBox.contains(event.target)) {
        suggestionsBox.style.display = 'none';
    }
});

const usersRef = database.ref('users');
const driversRef = database.ref('drivers');
const logsRef = database.ref('logs');

logsRef.limitToLast(10).once('value', (logsSnapshot) => {
    console.log('Logs data:', logsSnapshot.val());

    const logsTableBody = document.getElementById('logs-tbody');
    logsTableBody.innerHTML = '';

    if (logsSnapshot.exists()) {
        const logsArray = [];
        logsSnapshot.forEach((log) => {
            logsArray.push(log.val());
        });

        logsArray.reverse();
        logsArray.forEach((logData) => {
            const logElement = document.createElement('tr');
            logElement.innerHTML = `
        <td>${logData.date}</td>
        <td>${logData.event}</td>
        <td>${logData.details}</td>
      `;
            logsTableBody.appendChild(logElement);
        });
    } else {
        const noLogsMessage = document.createElement('p');
        noLogsMessage.textContent = 'No logs available.';
        logsTableBody.appendChild(noLogsMessage);
    }
});

function closeDialog() {
    const dialog = document.querySelector('.dialog');
    dialog.remove();
}

usersRef.on('child_added', (userSnapshot) => {
    const userKey = userSnapshot.key;
    const userData = userSnapshot.val();
    const logData = {
        date: new Date().toISOString(),
        event: 'User account created',
        details: `User ${userData.name} (${userData.email}) created`
    };
    logsRef.push(logData);
});

driversRef.on('child_added', (driverSnapshot) => {
    const driverKey = driverSnapshot.key;
    const driverData = driverSnapshot.val();
    const logData = {
        date: new Date().toISOString(),
        event: 'Driver account created',
        details: `Driver ${driverData.name} (${driverData.email}) created`
    };
    logsRef.push(logData);
});