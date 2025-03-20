const usersRef = database.ref('users');
const driversRef = database.ref('drivers');

usersRef.orderByChild('signupTimestamp').on('value', (usersSnapshot) => {
    const userTableBody = document.getElementById('user-table-pending-body');
    userTableBody.innerHTML = '';

    const usersArray = [];

    usersSnapshot.forEach((user) => {
        const userData = user.val();
        if (userData.blockedStatus === 'Pending') {
            usersArray.push({ key: user.key, data: userData });
        }
    });

    usersArray.sort((a, b) => new Date(b.data.signupTimestamp) - new Date(a.data.signupTimestamp));

    usersArray.forEach((user) => {
        const userElement = document.createElement('tr');
        const signupDate = new Date(user.data.signupTimestamp);
        const formattedDate = `${signupDate.toLocaleDateString()} ${signupDate.toLocaleTimeString()}`;
        userElement.innerHTML = `
      <td>${formattedDate}</td>
      <td>${user.data.name}</td>
      <td>${user.data.email}</td>
      <td>${user.data.phone}</td>
      <td>
        <select id="blocked-status-${user.key}" onchange="updateBlockedStatus('${user.key}')">
          <option value="Pending" ${user.data.blockedStatus === 'Pending' ? 'selected' : ''}>Pending</option>
          <option value="Approved" ${user.data.blockedStatus === 'Approved' ? 'selected' : ''}>Approved</option>
          <option value="Disapproved" ${user.data.blockedStatus === 'Disapproved' ? 'selected' : ''}>Disapproved</option>
        </select>
      </td>
      <td>
        <button class="btn btn-primary view-btn" style="color: #FFFFFF" onclick="viewUserDetails('${user.key}')">View</button>
      </td>
    `;
        userTableBody.appendChild(userElement);
    });
});


usersRef.orderByChild('signupTimestamp').on('value', (usersSnapshot) => {
    const userTableBody = document.getElementById('user-table-approved-body');
    userTableBody.innerHTML = '';

    const usersArray = [];

    usersSnapshot.forEach((user) => {
        const userData = user.val();
        if (userData.blockedStatus === 'Approved') {
            usersArray.push({ key: user.key, data: userData });
        }
    });

    usersArray.sort((a, b) => new Date(b.data.signupTimestamp) - new Date(a.data.signupTimestamp));

    usersArray.forEach((user) => {
        const userElement = document.createElement('tr');
        const signupDate = new Date(user.data.signupTimestamp);
        const formattedDate = `${signupDate.toLocaleDateString()} ${signupDate.toLocaleTimeString()}`;
        userElement.innerHTML = `
      <td>${formattedDate}</td>
      <td>${user.data.name}</td>
      <td>${user.data.email}</td>
      <td>${user.data.phone}</td>
      <td>
        <select id="blocked-status-${user.key}" onchange="updateBlockedStatus('${user.key}')">
          <option value="Pending" ${user.data.blockedStatus === 'Pending' ? 'selected' : ''}>Pending</option>
          <option value="Approved" ${user.data.blockedStatus === 'Approved' ? 'selected' : ''}>Approved</option>
          <option value="Disapproved" ${user.data.blockedStatus === 'Disapproved' ? 'selected' : ''}>Disapproved</option>
        </select>
      </td>
      <td>
        <button class="btn btn-primary view-btn" style="color: #FFFFFF" onclick="viewUserDetails('${user.key}')">View</button>
      </td>
      <td>
        <button class="btn btn-primary" style="color: #FFFFFF" onclick="sendEmail('${user.key}')">Send Email</button>
      </td>
    `;
        userTableBody.appendChild(userElement);
    });
});

function sendEmail(userId) {
    const userRef = database.ref(`users/${userId}`);

    userRef.once('value')
        .then((snapshot) => {
            const userData = snapshot.val();
            console.log('Fetched user data:', userData); // For debugging purposes

            if (userData && userData.email) {
                const userEmail = userData.email;
                console.log('User  email:', userEmail); // For debugging purposes

                const emailData = {
                    to: userEmail,
                    subject: "Registration Approved. From NLUCycle",
                    text: "Congratulations! Your registration for NLUCycle has been approved. You can now use our App."
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
                        alert('Email sent successfully to ' + userEmail);
                    })
                    .catch(error => {
                        console.error('Failed to send email:', error);
                        alert('Failed to send email: ' + error.message);
                    });
            } else {
                console.error('User  data not found or email is missing.');
                alert('User  data not found or email is missing.');
            }
        })
        .catch((error) => {
            console.error('Error fetching user data:', error);
            alert('Error fetching user data: ' + error.message);
        });
}

usersRef.orderByChild('signupTimestamp').on('value', (usersSnapshot) => {
    const userTableBody = document.getElementById('user-table-disapproved-body');
    userTableBody.innerHTML = '';

    const usersArray = [];

    usersSnapshot.forEach((user) => {
        const userData = user.val();
        if (userData.blockedStatus === 'Disapproved') {
            usersArray.push({ key: user.key, data: userData });
        }
    });

    usersArray.sort((a, b) => new Date(b.data.signupTimestamp) - new Date(a.data.signupTimestamp));

    usersArray.forEach((user) => {
        const userElement = document.createElement('tr');
        const signupDate = new Date(user.data.signupTimestamp);
        const formattedDate = `${signupDate.toLocaleDateString()} ${signupDate.toLocaleTimeString()}`;

        const reasons = ['Incomplete Documents', 'Fraudulent Information', 'Other'];
        const reasonOptions = reasons.map(reason => `<option value="${reason}" ${user.data.disapprovalReason === reason ? 'selected' : ''}>${reason}</option>`).join('');

        userElement.innerHTML = `
      <td>${formattedDate}</td>
      <td>${user.data.name}</td>
      <td>${user.data.email}</td>
      <td>${user.data.phone}</td>
      <td>
        <select id="blocked-status-${user.key}" onchange="updateBlockedStatus('${user.key}')">
          <option value="Pending" ${user.data.blockedStatus === 'Pending' ? 'selected' : ''}>Pending</option>
          <option value="Approved" ${user.data.blockedStatus === 'Approved' ? 'selected' : ''}>Approved</option>
          <option value="Disapproved" ${user.data.blockedStatus === 'Disapproved' ? 'selected' : ''}>Disapproved</option>
        </select>
      </td>
      <td>
        <select id="disapproval-reason-${user.key}" onchange="updateDisapprovalReason('${user.key}')">
          ${reasonOptions}
        </select>
      </td>
      <td>
        <button class="btn btn-primary view-btn" style="color: #FFFFFF" onclick="viewUserDetails('${user.key}')">View</button>
      </td>
    `;
        userTableBody.appendChild(userElement);
    });
});

function searchUsers(tableType) {
    let input, filter, table, tbody, tr, td, i, j, txtValue;
    if (tableType === 'pending') {
        input = document.getElementById('search-pending');
        table = document.getElementById('user-table-pending');
    } else if (tableType === 'approved') {
        input = document.getElementById('search-approved');
        table = document.getElementById('user-table-approved');
    } else if (tableType === 'disapproved') {
        input = document.getElementById('search-disapproved');
        table = document.getElementById('user-table-disapproved');
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

function updateDisapprovalReason(uid) {
    const disapprovalReason = document.getElementById(`disapproval-reason-${uid}`).value;
    const userRef = database.ref(`users/${uid}`);

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

function viewUserDetails(uid) {
    const existingDialog = document.querySelector('.dialog');
    if (existingDialog) {
        existingDialog.remove();
    }

    const userRef = database.ref(`users/${uid}`);
    userRef.once('value', (userSnapshot) => {
        const userData = userSnapshot.val();
        const dialog = document.createElement('div');
        dialog.innerHTML = `
      <div class="dialog-content">
        <h2 style="font-size: 24px;">User  Details</h2>
        <div class="image-container">
          <img src="${userData.idFrontImageUrl}" alt="User  Image" style="width: 250px; height: 350px; border-radius: 10px; margin-right: 10px;">
          <img src="${userData.idBackImageUrl}" alt="User  Image" style="width: 250px; height: 350px; border-radius: 10px; margin-right: 10px;">
          <img src="${userData.selfieImageUrl}" alt="User  Image" style="width: 250px; height: 350px; border-radius: 10px;">
        </div>
        <p style="font-size: 18px;">Name: ${userData.name}</p>
        <p style="font-size: 18px;">Email: ${userData.email}</p>
        <p style="font-size: 18px;">Phone: ${userData.phone}</p>
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
        max-width: 95%; /* Increase the max-width to make the dialog wider */
        width: 900px; /* Set a specific width for the dialog */
        max-height: 80%;
        overflow: hidden; /* Prevent overflow of the dialog itself */
        padding: 10px; /* Add padding to the dialog */
      }
      .dialog-content {
        padding: 20px; /* Space between content and dialog */
        max-height: 70vh; /* Set a max height for the content */
        overflow-y: auto; /* Enable vertical scrolling only for content */
      }
      .image-container {
        display: flex; /* Use flexbox to arrange images in a row */
        justify-content: space-between; /* Optional: space between images */
        margin-bottom: 10px; /* Space below the image container */
      }
      .image-container img {
        border-radius: 10px; /* Ensure images have rounded corners */
      }
    `;
        document.head.appendChild(style);

        document.body.appendChild(dialog);
    });
}

function updateBlockedStatus(uid) {
    const blockedStatus = document.getElementById(`blocked-status-${uid}`).value;

    const confirmationMessage = `Are you sure you want to change the status to "${blockedStatus}"?`;
    if (confirm(confirmationMessage)) {
        const userRef = database.ref(`users/${uid}`);
        userRef.update({ blockedStatus: blockedStatus })
            .then(() => {
                alert('Status updated successfully!');
            })
            .catch((error) => {
                console.error('Error updating status:', error);
                alert('Error updating status: ' + error.message);
            });
    } else {
        const previousStatus = blockedStatus === 'Approved' ? 'Pending' : 'Disapproved';
        document.getElementById(`blocked-status-${uid}`).value = previousStatus;
    }
}

const pages = [
    { name: "Drivers", url: "drivers.html" },
    { name: "Feedbacks", url: "feedbacks.html" },
    { name: "Settings", url: "settings.html" },
    { name: "Trips", url: "trips.html" },
    { name: "Home", url: "index.html" }
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

const exitButtons = document.querySelectorAll('.close');

exitButtons.forEach((button) => {
    button.addEventListener('click', () => {
        $(button.closest('.modal')).modal('hide');
    });
});

document.getElementById('add-account-btn').addEventListener('click', () => {
    $('#create-account-modal').modal('show');
});

const createAccountForm = document.getElementById('create-account-form');

document.getElementById('account-type').addEventListener('change', (e) => {
    const accountType = e.target.value;
    if (accountType === 'driver') {
        document.getElementById('plate-group').style.display = 'block';
    } else {
        document.getElementById('plate-group').style.display = 'none';
    }
});

createAccountForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const accountType = document.getElementById('account-type').value;
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const phone = document.getElementById('phone').value;
    const plate = document.getElementById('plate').value;
    const password = document.getElementById('password').value;

    if (name === '' || email === '' || phone === '' || password === '') {
        alert('Please fill in all the required fields.');
        return;
    }

    firebase
        .auth()
        .createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
            var user = userCredential.user;
            console.log("Account created successfully!");

            const newAccountRef = accountType === 'user' ? usersRef.child(user.uid) : driversRef.child(user.uid);

            newAccountRef.set({
                name: name,
                email: email,
                phone: phone,
                plate: plate,
                blockedStatus: 'No',
                id: user.uid,
            })
                .then(() => {
                    alert('Account created successfully!');

                    document.getElementById('name').value = '';
                    document.getElementById('email').value = '';
                    document.getElementById('phone').value = '';
                    document.getElementById('plate').value = '';
                    document.getElementById('password').value = '';

                    $('#create-account-modal').modal('hide');
                })
                .catch((error) => {
                    var errorCode = error.code;
                    var errorMessage = error.message;
                    console.log("Error writing account data:", errorCode, errorMessage);
                    alert('Error creating account: ' + errorMessage);
                });
        })
        .catch((error) => {
            var errorCode = error.code;
            var errorMessage = error.message;
            console.log("Error creating account:", errorCode, errorMessage);
            if (errorCode === 'auth/email-already-in-use') {
                alert('The email address is already in use. Please try a different email address.');
            } else {
                alert('Error creating account: ' + errorMessage);
            }
        });
});