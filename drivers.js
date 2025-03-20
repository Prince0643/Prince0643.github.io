const driversRef = database.ref('drivers');

driversRef.orderByChild('signupTimestamp').on('value', (driversSnapshot) => {
    const driverTablePendingBody = document.getElementById('driver-table-pending-body');
    const driverTableApprovedBody = document.getElementById('driver-table-approved-body');

    driverTablePendingBody.innerHTML = '';
    driverTableApprovedBody.innerHTML = '';

    const pendingDrivers = [];
    const approvedDrivers = [];

    driversSnapshot.forEach((driver) => {
        const driverData = driver.val();
        const driverInfo = { key: driver.key, data: driverData };

        if (driverData.blockedStatus === 'Pending') {
            pendingDrivers.push(driverInfo);
        } else if (driverData.blockedStatus === 'Approved') {
            approvedDrivers.push(driverInfo);
        }
    });

    const populateTable = (tableBody, driversArray, showEmailButton) => {
        driversArray.sort((a, b) => new Date(b.data.signupTimestamp) - new Date(a.data.signupTimestamp));

        driversArray.forEach((driver) => {
            const driverElement = document.createElement('tr');
            const signupDate = new Date(driver.data.signupTimestamp);
            const formattedDate = `${signupDate.toLocaleDateString()} ${signupDate.toLocaleTimeString()}`;
            driverElement.innerHTML = `
        <td>${formattedDate}</td>
        <td>${driver.data.name}</td>
        <td>${driver.data.email}</td>
        <td>${driver.data.phone}</td>
        <td>${driver.data.plate}</td>
        <td>
          <select id="blocked-status-${driver.key}" onchange="updateBlockedStatusDriver('${driver.key}')">
            <option value="Pending" ${driver.data.blockedStatus === 'Pending' ? 'selected' : ''}>Pending</option>
            <option value="Approved" ${driver.data.blockedStatus === 'Approved' ? 'selected' : ''}>Approved</option>
            <option value="Disapproved" ${driver.data.blockedStatus === 'Disapproved' ? 'selected' : ''}>Disapproved</option>
          </select>
        </td>
        <td>
          <button class="btn btn-primary view-btn" style="color: #FFFFFF" onclick="viewDriverDetails('${driver.key}')">View</button>
        </td>
      `;

            if (showEmailButton) {
                driverElement.innerHTML += `
          <td>
            <button class="btn btn-primary" style="color: #FFFFFF" onclick="sendEmail('${driver.key}')">Send Email</button>
          </td>
        `;
            }

            tableBody.appendChild(driverElement);
        });
    };

    populateTable(driverTablePendingBody, pendingDrivers, false);
    populateTable(driverTableApprovedBody, approvedDrivers, true); //This means that the email button will be shown
});

function sendEmail(driverId) {
    const driverRef = database.ref(`drivers/${driverId}`);

    driverRef.once('value')
        .then((snapshot) => {
            const driverData = snapshot.val();
            console.log('Fetched driver data:', driverData);

            if (driverData && driverData.email) {
                const driverEmail = driverData.email;
                console.log('Driver email:', driverEmail);

                const emailData = {
                    to: driverEmail,
                    subject: "Welcome to NLUCycle",
                    text: "Dear Driver, welcome to NLUCycle! Your account has been approved."
                };

                fetch('http://localhost:3000/send-email', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(emailData)
                })
                    .then(response => {
                        if (!response.ok) {
                            throw new Error('Network response was not ok');
                        }
                        return response.text();
                    })
                    .then(data => {
                        console.log('Email sent successfully!', data);
                        alert('Email sent successfully to ' + driverEmail);
                    })
                    .catch(error => {
                        console.error('Failed to send email:', error);
                        alert('Failed to send email: ' + error.message);
                    });
            } else {
                console.error('Driver data not found or email is missing.');
                alert('Driver data not found or email is missing.');
            }
        })
        .catch((error) => {
            console.error('Error fetching driver data:', error);
            alert('Error fetching driver data: ' + error.message);
        });
}

driversRef.orderByChild('signupTimestamp').on('value', (driversSnapshot) => {
    const driverTableDisapprovedBody = document.getElementById('driver-table-disapproved-body');
    driverTableDisapprovedBody.innerHTML = '';

    const driversArray = [];

    driversSnapshot.forEach((driver) => {
        const driverData = driver.val();
        if (driverData.blockedStatus === 'Disapproved') {
            driversArray.push({ key: driver.key, data: driverData });
        }
    });

    driversArray.sort((a, b) => new Date(b.data.signupTimestamp) - new Date(a.data.signupTimestamp));

    driversArray.forEach((driver) => {
        const driverElement = document.createElement('tr');
        const signupDate = new Date(driver.data.signupTimestamp);
        const formattedDate = `${signupDate.toLocaleDateString()} ${signupDate.toLocaleTimeString()}`;

        const reasons = ['Incomplete Documents', 'Fraudulent Information', 'Other'];
        const reasonOptions = reasons.map(reason => `<option value="${reason}" ${driver.data.disapprovalReason === reason ? 'selected' : ''}>${reason}</option>`).join('');

        driverElement.innerHTML = `
      <td>${formattedDate}</td>
      <td>${driver.data.name}</td>
      <td>${driver.data.email}</td>
      <td>${driver.data.phone}</td>
      <td>${driver.data.plate}</td>
      <td>
        <select id="blocked-status-${driver.key}" onchange="updateBlockedStatusDriver('${driver.key}')">
          <option value="Pending" ${driver.data.blockedStatus === 'Pending' ? 'selected' : ''}>Pending</option>
          <option value="Approved" ${driver.data.blockedStatus === 'Approved' ? 'selected' : ''}>Approved</option>
          <option value="Disapproved" ${driver.data.blockedStatus === 'Disapproved' ? 'selected' : ''}>Disapproved</option>
        </select>
      </td>
      <td>
        <select id="disapproval-reason-${driver.key}" onchange="updateDisapprovalReasonDriver('${driver.key}')">
          ${reasonOptions}
        </select>
      </td>
      <td>
        <button class="btn btn-primary view-btn" style="color: #FFFFFF" onclick ="viewDriverDetails('${driver.key}')">View</button>
      </td>
    `;
        driverTableDisapprovedBody.appendChild(driverElement);
    });
});

function searchDrivers(tableType) {
    let input, filter, table, tbody, tr, td, i, j, txtValue;
    if (tableType === 'pending') {
        input = document.getElementById('search-pending-drivers');
        table = document.getElementById('driver-table-pending');
    } else if (tableType === 'approved') {
        input = document.getElementById('search-approved-drivers');
        table = document.getElementById('driver-table-approved');
    } else if (tableType === 'disapproved') {
        input = document.getElementById('search-disapproved-drivers');
        table = document.getElementById('driver-table-disapproved');
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

function updateDisapprovalReasonDriver(uid) {
    const disapprovalReason = document.getElementById(`disapproval-reason-${uid}`).value;
    const userRef = database.ref(`drivers/${uid}`);

    userRef.update({
        disapprovalReason: disapprovalReason,
        disapprovalMessage: disapprovalReason === 'Incomplete Documents'
            ? 'Your documents are incomplete for registration. Please review them.'
            : disapprovalReason === 'Fraudulent Information'
                ? 'The information you provided may be false (e.g., full name, phone number, IDs). Please check again.'
                : ''
    })
        .then(() => {
            console.log('Disapproval reason updated successfully!');
        })
        .catch((error) => {
            console.error('Error updating disapproval reason:', error);
        });
}

function viewDriverDetails(uid) {
    const existingDialog = document.querySelector('.dialog');
    if (existingDialog) {
        existingDialog.remove();
    }

    const driverRef = database.ref(`drivers/${uid}`);
    driverRef.once('value', (driverSnapshot) => {
        const driverData = driverSnapshot.val();
        const dialog = document.createElement('div');
        dialog.innerHTML = `
      <div class="dialog-content">
        <h2 style="font-size: 24px;">Driver Details</h2>
        <div class="image-container">
          <img src="${driverData.idFrontImageUrl}" alt="Driver ID Front Image" style="width: 250px; height: 350px; border-radius: 10px; margin-right: 10px;">
          <img src="${driverData.idBackImageUrl}" alt="Driver ID Back Image" style="width: 250px; height: 350px; border-radius: 10px; margin-right: 10px;">
          <img src="${driverData.selfieImageUrl}" alt="Driver Selfie Image" style="width: 250px; height: 350px;">
        </div>
        <p style="font-size: 18px;">Name: ${driverData.name}</p>
        <p style="font-size: 18px;">Email: ${driverData.email}</p>
        <p style="font-size: 18px;">Phone: ${driverData.phone}</p>
        <p style="font-size: 18px;">Plate: ${driverData.plate}</p>
        <button class="close-btn" style="background-color: #ed850e; color: #FFFFFF; border: none; border-radius: 5px; padding: 10px 20px; cursor: pointer; position: absolute; bottom: 10px; left: 10px;" onclick="closeDialog()">Close</button>
      </div>
    `;
        dialog.className = 'dialog';

        const style = document.createElement('style');
        style.innerHTML = `
      .dialog {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background-color: white;
        border: 1px solid #ccc;
        border-radius: 10px;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
        z-index: 1000;
        max-width: 95%;
        width: 900px;
        max-height: 80%;
        overflow: hidden;
        padding: 10px;
      }
      .dialog-content {
        padding: 20px;
        max-height: 70vh;
        overflow-y: auto;
      }
      .image-container {
        display: flex;
        justify-content: space-between;
        margin-bottom: 10px;
      }
      .image-container img {
        border-radius: 10px;
      }
    `;
        document.head.appendChild(style);

        document.body.appendChild(dialog);
    });
}

function updateBlockedStatusDriver(uid) {
    const blockedStatus = document.getElementById(`blocked-status-${uid}`).value;
    const driverRef = database.ref(`drivers/${uid}`);
    driverRef.update({ blockedStatus: blockedStatus });
}

const pages = [
    { name: "Home", url: "index.html" },
    { name: "Feedbacks", url: "feedbacks.html" },
    { name: "Settings", url: "settings.html" },
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