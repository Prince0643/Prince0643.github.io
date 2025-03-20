const pages = [
    { name: "Drivers", url: "drivers.html" },
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

const ridesRef = database.ref('rides');
let totalCompletedRides = 0;
let totalCancelledRides = 0;

ridesRef.on('value', (data) => {
    const rides = data.val();
    console.log('Retrieved rides:', rides);

    const dailyRides = [];
    Object.keys(rides).forEach((userKey) => {
        Object.keys(rides[userKey]).forEach((rideKey) => {
            const ride = rides[userKey][rideKey];
            const bookingDate = new Date(ride.booking_date_time).toLocaleDateString();
            const completionStatus = ride.completion_status;

            let dateEntry = dailyRides.find(entry => entry.date === bookingDate);
            if (!dateEntry) {
                dateEntry = { date: bookingDate, completed: 0, cancelled: 0, waiting: 0 };
                dailyRides.push(dateEntry);
            }

            if (completionStatus === 'completed') {
                dateEntry.completed += 1;
                totalCompletedRides += 1;
            } else if (completionStatus === 'failed' || completionStatus === 'cancelled') {
                dateEntry.cancelled += 1;
                totalCancelledRides += 1;
            } else if (completionStatus === 'waiting') {
                dateEntry.waiting += 1;
            }
        });
    });

    dailyRides.sort((a, b) => new Date(a.date) - new Date(b.date));

    document.getElementById('total-completed-rides').textContent = totalCompletedRides;
    document.getElementById('total-cancelled-rides').textContent = totalCancelledRides;

    const ctx = document.getElementById('ridesChart').getContext('2d');
    const chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: dailyRides.map(ride => ride.date),
            datasets: [{
                label: 'Completed',
                data: dailyRides.map(ride => ride.completed),
                borderColor: 'rgba(0, 128, 0, 0.5)',
                backgroundColor: 'rgba(0, 128, 0, 0.5)',
                fill: false,
            }, {
                label: 'Cancelled',
                data: dailyRides.map(ride => ride.cancelled),
                borderColor: 'rgba(255, 0, 0, 0.5)',
                backgroundColor: 'rgba(255, 0, 0, 0.5)',
                fill: false,
            }, {
                label: 'Waiting',
                data: dailyRides.map(ride => ride.waiting),
                borderColor: 'rgba(255, 255, 0, 0.5)',
                backgroundColor: 'rgba(255, 255, 0, 0.5)',
                fill: false,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            title: {
                display: true,
                text: 'Rides Completed, Cancelled, and Waiting Over Time'
            },
            scales: {
                x: {
                    type: 'category',
                    title: {
                        display: true,
                        text: 'Booking Date'
                    }
                },
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Number of Rides'
                    }
                }
            },
            legend: {
                display: true,
                position: 'bottom',
                labels: {
                    boxWidth: 20,
                    padding: 10,
                    usePointStyle: false
                }
            }
        }
    });
});

const usersRef = database.ref('users');
const driversRef = database.ref('drivers');
const ratingsRef = database.ref('ratings');

ratingsRef.on('value', (ratingsSnapshot) => {
    const driverRatings = {};
    const passengerRatings = {};

    ratingsSnapshot.forEach((ratingSnapshot) => {
        const ratingData = ratingSnapshot.val();

        if (ratingData.from_driver) {
            const driver = ratingData.from_driver;
            if (!driverRatings[driver]) {
                driverRatings[driver] = { totalRating: 0, count: 0 };
            }
            driverRatings[driver].totalRating += ratingData.rating;
            driverRatings[driver].count += 1;
        }

        if (ratingData.from_passenger) {
            const passenger = ratingData.from_passenger;
            if (!passengerRatings[passenger]) {
                passengerRatings[passenger] = { totalRating: 0, count: 0 };
            }
            passengerRatings[passenger].totalRating += ratingData.rating;
            passengerRatings[passenger].count += 1;
        }
    });

    const topDrivers = Object.keys(driverRatings).map(driver => ({
        name: driver,
        averageRating: (driverRatings[driver].totalRating / driverRatings[driver].count).toFixed(2),
        count: driverRatings[driver].count
    })).sort((a, b) => b.averageRating - a.averageRating).slice(0, 5);

    const topDriversTableBody = document.getElementById('top-drivers-table-body');
    topDriversTableBody.innerHTML = '';
    topDrivers.forEach(driver => {
        const driverRow = document.createElement('tr');
        driverRow.innerHTML = `
      <td>${driver.name}</td>
      <td>${driver.averageRating}</td>
    `;
        topDriversTableBody.appendChild(driverRow);
    });

    const topPassengers = Object.keys(passengerRatings).map(passenger => ({
        name: passenger,
        averageRating: (passengerRatings[passenger].totalRating / passengerRatings[passenger].count).toFixed(2),
        count: passengerRatings[passenger].count
    })).sort((a, b) => b.averageRating - a.averageRating).slice(0, 5);

    const topPassengersTableBody = document.getElementById('top-passengers-table-body');
    topPassengersTableBody.innerHTML = '';
    topPassengers.forEach(passenger => {
        const passengerRow = document.createElement('tr');
        passengerRow.innerHTML = `
      <td>${passenger.name}</td>
      <td>${passenger.averageRating}</td>
    `;
        topPassengersTableBody.appendChild(passengerRow);
    });
});

let usersCount = 0;
let driversCount = 0;

usersRef.once('value', (usersSnapshot) => {
    usersCount = usersSnapshot.numChildren();
    console.log('Number of users:', usersCount);
    document.getElementById('user-count').textContent = `${usersCount}`;
});

driversRef.once('value', (driversSnapshot) => {
    driversCount = driversSnapshot.numChildren();
    console.log('Number of drivers:', driversCount);

    document.getElementById('driver-count').textContent = `${driversCount}`;

    const overallCount = usersCount + driversCount;

    document.getElementById('total-app-users').textContent = `${overallCount}`;
});