const feedbacksRef = firebase.database().ref('feedbacks');

feedbacksRef.on('value', (feedbacksSnapshot) => {
    const feedbackContainer = document.getElementById('feedback-table-body');
    feedbackContainer.innerHTML = '';

    const feedbacksArray = [];

    feedbacksSnapshot.forEach((userFeedbacks) => {
        userFeedbacks.forEach((feedback) => {
            const feedbackData = feedback.val();
            feedbacksArray.push(feedbackData);
        });
    });

    feedbacksArray.sort((a, b) => new Date(b.date) - new Date(a.date));

    feedbacksArray.forEach((feedbackData) => {
        const feedbackElement = document.createElement('tr');
        feedbackElement.className = 'feedback';
        feedbackElement.innerHTML = `
                    <td><strong>${feedbackData.from}</strong></td>
                    <td>${feedbackData.passenger_name}</td>
                    <td>${feedbackData.driver_name}</td>
                    <td>${feedbackData.rating}</td>
                    <td>${feedbackData.comment}</td>
                    <td>${feedbackData.completion_status}</td>
                    <td>${feedbackData.date}</td>
                `;
        feedbackContainer.appendChild(feedbackElement);
    });

    $('#feedback-table').DataTable({
        paging: true,
        searching: true,
        ordering: true,
        pageLength: 10,
        lengthMenu: [5, 10, 25, 50, 100]
    });
});

document.getElementById('export-button').addEventListener('click', function () {
    const feedbackTable = document.getElementById('feedback-table-body');
    const data = [];

    const header = ['From', 'Passenger Name', 'Driver Name', 'Rating', 'Comment', 'Completion Status', 'Date'];
    data.push(header);

    const rows = feedbackTable.getElementsByTagName('tr');
    for (let i = 0; i < rows.length; i++) {
        const row = [];
        const cells = rows[i].getElementsByTagName('td');

        for (let j = 0; j < cells.length; j++) {
            row.push(cells[j].innerText);
        }

        data.push(row);
    }

    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(wb, ws, 'Feedbacks');
    XLSX.writeFile(wb, 'feedbacks.xlsx');
});

const pages = [
    { name: "Drivers", url: "drivers.html" },
    { name: "Home", url: "index.html" },
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