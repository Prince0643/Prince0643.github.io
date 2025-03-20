const firebaseConfig = {
  apiKey: "AIzaSyA8W0T2-SGnYOT9ALf7Qqf47TPUvNn87YQ",
  authDomain: "tricycle-flutter-app.firebaseapp.com",
  databaseURL: "https://tricycle-flutter-app-default-rtdb.firebaseio.com",
  projectId: "tricycle-flutter-app",
  storageBucket: "tricycle-flutter-app.appspot.com",
  messagingSenderId: "1070834755333",
  appId: "1:1070834755333:web:6f4b4e2f4f4f4f4f"
};

firebase.initializeApp(firebaseConfig);

const database = firebase.database();

function createAdminNode() {
  const username = document.getElementById('exampleInputUsername1').value;
  const email = document.getElementById('exampleInputEmail1').value;
  const password = document.getElementById('exampleInputPassword1').value;
  const adminRef = database.ref('admin');
  const newAdminRef = adminRef.push();

  newAdminRef.set({
    uid: newAdminRef.key,
    username: username,
    email: email,
    password: password
  });

  localStorage.setItem('email', email);
  localStorage.setItem('username', username);

  alert('Admin created successfully!');
  window.location.href = 'index.html';
}

function loginAdmin() {
  const email = document.getElementById('exampleInputEmail1').value;
  const password = document.getElementById('exampleInputPassword1').value;

  const adminRef = database.ref('admin');

  adminRef.once('value', (data) => {
    data.forEach((admin) => {
      if (admin.val().email === email && admin.val().password === password) {

        localStorage.setItem('email', admin.val().email);
        localStorage.setItem('username', admin.val().username);

        alert('Login successful!');
        window.location.href = 'dashboard.html';
      }
    });
  });
}