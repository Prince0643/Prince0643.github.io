const fareMatrixRef = database.ref('fare_matrix');
let fareDataCache = {};

fareMatrixRef.on('value', (snapshot) => {
    fareDataCache = snapshot.val() || {};
    renderFareTable(fareDataCache);
});

let pendingUpdates = {};

function renderFareTable(fareData) {
    const fareTableBody = document.getElementById('fare-table-body');
    fareTableBody.innerHTML = '';
    const fareEntries = Object.entries(fareData).map(([key, value]) => ({ key, ...value }));

    if (fareEntries.length > 0) {
        fareEntries.pop();
    }

    fareEntries.forEach(fareEntry => {
        const row = document.createElement('tr');
        row.innerHTML = `
                        <td>${fareEntry.Point_of_Origin}</td>
                        <td>${fareEntry.Destination}</td>
                        <td>${fareEntry['Number_of_KM']}</td>
                        <td><input type="number" value="${fareEntry['Arkila_Discounted']}" disabled data-key="${fareEntry.key}" data-field="Arkila_Discounted" /></td>
                        <td><input type="number" value="${fareEntry['Arkila_Regular']}" disabled data-key="${fareEntry.key}" data-field="Arkila_Regular" /></td>
                    `;
        fareTableBody.appendChild(row);
    });

    if ($.fn.DataTable.isDataTable('#fare-table')) {
        $('#fare-table').DataTable().destroy();
    }

    $('#fare-table').DataTable({
        paging: true,
        searching: true,
        ordering: true,
        pageLength: 10,
        lengthMenu: [5, 10, 25, 50, 100]
    });
}

function toggleEditFare() {
    const fareTableBody = document.getElementById('fare-table-body');
    const inputs = fareTableBody.querySelectorAll('input[type="number"]');
    const isEditing = inputs.length > 0 && !inputs[0].disabled;

    if (isEditing) {
        const confirmSave = confirm("Are you sure you want to save the changes?");
        if (confirmSave) {
            for (const key in pendingUpdates) {
                const { field, value } = pendingUpdates[key];
                updateFare(key, field, value);
            }
            pendingUpdates = {};
            inputs.forEach(input => {
                input.disabled = true;
            });
            const editButton = document.getElementById('edit-fare-button');
            editButton.textContent = 'Edit';
        } else {
            console.log("Changes were not saved.");
            inputs.forEach(input => {
                input.disabled = true;
            });
            const editButton = document.getElementById('edit-fare-button');
            editButton.textContent = 'Edit';
        }
    } else {
        const confirmEdit = confirm("Are you sure you want to edit the fare information?");
        if (confirmEdit) {
            inputs.forEach(input => {
                input.disabled = false;
                input.addEventListener('input', function () {
                    const key = this.getAttribute('data-key');
                    const field = this.getAttribute('data-field');
                    pendingUpdates[key] = { field, value: this.value };
                });
            });
            const editButton = document.getElementById('edit-fare-button');
            editButton.textContent = 'Save';
            console.log("Editing mode enabled.");
        } else {
            console.log("Editing mode not enabled.");
        }
    }
}

async function updateFare(key, field, value) {
    try {
        await fareMatrixRef.child(key).update({ [field]: parseFloat(value) });
        console.log(`Updated ${field} for ${key} to ${value}`);
        await recalculateTotals();
    } catch (error) {
        console.error('Error updating fare:', error);
        alert('Error updating fare. Please try again.');
    }
}

async function recalculateTotals() {
    const kmValues = [];
    const arkilaRegularValues = [];

    for (const key in fareDataCache) {
        if (fareDataCache.hasOwnProperty(key)) {
            const fareEntry = fareDataCache[key];
            kmValues.push(fareEntry['Number_of_KM'] || 0);
            arkilaRegularValues.push(fareEntry['Arkila_Regular'] || 0);
        }
    }

    const filteredKM = removeOutliers(kmValues);
    const filteredArkilaRegular = removeOutliers(arkilaRegularValues);

    const totalFilteredKM = filteredKM.reduce((acc, val) => acc + val, 0);
    const totalFilteredArkilaRegular = filteredArkilaRegular.reduce((acc, val) => acc + val, 0);
    const farePerKM = totalFilteredKM > 0 ? totalFilteredArkilaRegular / totalFilteredKM : 0;

    try {
        await database.ref('fare_matrix/perkm').set({
            totalKM: totalFilteredKM,
            totalArkilaRegular: totalFilteredArkilaRegular,
            farePerKM: farePerKM,
            count: kmValues.length
        });
        console.log('perkm node updated successfully with totals:', {
            totalFilteredKM,
            totalArkilaRegular: totalFilteredArkilaRegular,
            farePerKM
        });
    } catch (error) {
        console.error('Error updating perkm node:', error);
    }
}

function removeOutliers(values) {
    if (values.length === 0) return values;

    values.sort((a, b) => a - b);
    const q1 = values[Math.floor((values.length / 4))];
    const q3 = values[Math.floor((values.length * (3 / 4)))];
    const iqr = q3 - q1;

    const lowerBound = q1 - 1.5 * iqr;
    const upperBound = q3 + 1.5 * iqr;

    return values.filter(value => value >= lowerBound && value <= upperBound);
}

const pages = [
    { name: "Drivers", url: "drivers.html" },
    { name: "Feedbacks", url: "feedbacks.html" },
    { name: "Settings", url: "settings.html" },
    { name: "Home", url: "index.html" },
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

const ridesRef = database.ref('rides');
ridesRef.on('value', (ridesSnapshot) => {
    const waitingRidesArray = [];

    ridesSnapshot.forEach((userRides) => {
        userRides.forEach((ride) => {
            const rideData = ride.val();
            if (rideData.completion_status === 'waiting') {
                waitingRidesArray.push(rideData);
            }
        });
    });

    waitingRidesArray.sort((a, b) => new Date(b.booking_date_time) - new Date(a.booking_date_time));

    const waitingRidesTableBody = document.getElementById('waiting-rides-table-body');
    waitingRidesTableBody.innerHTML = '';
    waitingRidesArray.forEach((ride) => {
        const rideElement = document.createElement('tr');
        const bookingDateTime = new Date(ride.booking_date_time).toLocaleString();
        rideElement.innerHTML = `
      <td>${ride.origin}</td>
      <td>${ride.destination}</td>
      <td>${ride.distance}</td>
      <td>${ride.fare}</td>
      <td>${ride.completion_status}</td>
      <td>${bookingDateTime}</td>
    `;
        waitingRidesTableBody.appendChild(rideElement);
    });
});

ridesRef.on('value', (ridesSnapshot) => {
    const waitingRidesArray = [];

    ridesSnapshot.forEach((userRides) => {
        userRides.forEach((ride) => {
            const rideData = ride.val();
            if (rideData.completion_status === 'completed') {
                waitingRidesArray.push(rideData);
            }
        });
    });

    waitingRidesArray.sort((a, b) => new Date(b.booking_date_time) - new Date(a.booking_date_time));

    const waitingRidesTableBody = document.getElementById('completed-rides-table-body');
    waitingRidesTableBody.innerHTML = '';
    waitingRidesArray.forEach((ride) => {
        const rideElement = document.createElement('tr');
        const bookingDateTime = new Date(ride.booking_date_time).toLocaleString();
        const completedDateTime = new Date(ride.completion_date).toLocaleString();

        rideElement.innerHTML = `
      <td>${ride.origin}</td>
      <td>${ride.destination}</td>
      <td>${ride.distance}</td>
      <td>${ride.fare}</td>
      <td>${ride.completion_status}</td>
      <td>${bookingDateTime}</td>
      <td>${completedDateTime}</td>
    `;
        waitingRidesTableBody.appendChild(rideElement);
    });
});

ridesRef.on('value', (ridesSnapshot) => {
    const waitingRidesArray = [];

    ridesSnapshot.forEach((userRides) => {
        userRides.forEach((ride) => {
            const rideData = ride.val();
            if (rideData.completion_status === 'cancelled') {
                waitingRidesArray.push(rideData);
            }
        });
    });

    waitingRidesArray.sort((a, b) => new Date(b.booking_date_time) - new Date(a.booking_date_time));

    const waitingRidesTableBody = document.getElementById('cancelled-rides-table-body');
    waitingRidesTableBody.innerHTML = '';
    waitingRidesArray.forEach((ride) => {
        const rideElement = document.createElement('tr');
        const bookingDateTime = new Date(ride.booking_date_time).toLocaleString();
        rideElement.innerHTML = `
      <td>${ride.origin}</td>
      <td>${ride.destination}</td>
      <td>${ride.distance}</td>
      <td>${ride.fare}</td>
      <td>${ride.completion_status}</td>
      <td>${bookingDateTime}</td> <!-- Include date and time -->
    `;
        waitingRidesTableBody.appendChild(rideElement);
    });
});

ridesRef.on('value', (ridesSnapshot) => {
    const waitingRidesArray = [];

    ridesSnapshot.forEach((userRides) => {
        userRides.forEach((ride) => {
            const rideData = ride.val();
            if (rideData.completion_status === 'failed') {
                waitingRidesArray.push(rideData);
            }
        });
    });

    waitingRidesArray.sort((a, b) => new Date(b.booking_date_time) - new Date(a.booking_date_time));

    const waitingRidesTableBody = document.getElementById('failed-rides-table-body');
    waitingRidesTableBody.innerHTML = '';
    waitingRidesArray.forEach((ride) => {
        const rideElement = document.createElement('tr');
        const bookingDateTime = new Date(ride.booking_date_time).toLocaleString();
        const completedDateTime = new Date(ride.completion_date).toLocaleString();

        rideElement.innerHTML = `
      <td>${ride.origin}</td>
      <td>${ride.destination}</td>
      <td>${ride.distance}</td>
      <td>${ride.fare}</td>
      <td>${ride.completion_status}</td>
      <td>${bookingDateTime}</td> <!-- Include date and time -->
      <td>${completedDateTime}</td>

    `;
        waitingRidesTableBody.appendChild(rideElement);
    });
});

function searchTable(tableType) {
    let input, filter, table, tbody, tr, td, i, j, txtValue;
    if (tableType === 'waiting') {
        input = document.getElementById('search-waiting');
        table = document.getElementById('waiting-rides-table');
    } else if (tableType === 'completed') {
        input = document.getElementById('search-completed');
        table = document.getElementById('completed-rides-table');
    } else if (tableType === 'cancelled') {
        input = document.getElementById('search-cancelled');
        table = document.getElementById('cancelled-rides-table');
    } else if (tableType === 'failed') {
        input = document.getElementById('search-failed');
        table = document.getElementById('failed-rides-table');
    }

    filter = input.value.toLowerCase();
    tbody = table.getElementsByTagName("tbody")[0];
    tr = tbody.getElementsByTagName("tr");

    for (i = 0; i < tr.length; i++) {
        tr[i].style.display = "none";
        const tds = tr[i].getElementsByTagName("td");
        for (j = 0; j < tds.length; j++) {
            if (tds[j]) {
                txtValue = tds[j].textContent || tds[j].innerText;
                if (txtValue.toLowerCase().indexOf(filter) > -1) {
                    tr[i].style.display = "";
                    break;
                }
            }
        }
    }
}