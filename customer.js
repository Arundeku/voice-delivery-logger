// Paste your exact Apps Script /exec URL here
const APPS_SCRIPT_URL = "YOUR_APPS_SCRIPT_URL_HERE"; 

// Navigation Toggles
document.getElementById('go-to-reg').addEventListener('click', () => {
    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('register-screen').classList.remove('hidden');
});

document.getElementById('go-to-login').addEventListener('click', () => {
    document.getElementById('register-screen').classList.add('hidden');
    document.getElementById('login-screen').classList.remove('hidden');
});

let currentRestaurant = ""; // Store this after login

// 1. REGISTER LOGIC
document.getElementById('register-btn').addEventListener('click', async () => {
    const btn = document.getElementById('register-btn');
    const status = document.getElementById('reg-status');
    
    btn.innerText = "Registering...";
    
    const payload = {
        action: "REGISTER_CUSTOMER",
        payload: {
            restaurantName: document.getElementById('reg-rest').value,
            contactPerson: document.getElementById('reg-name').value,
            phone: document.getElementById('reg-phone').value,
            password: document.getElementById('reg-password').value
        }
    };

    try {
        const response = await fetch(APPS_SCRIPT_URL, {
            method: "POST", headers: { "Content-Type": "text/plain" }, body: JSON.stringify(payload)
        });
        const result = await response.json();
        
        status.innerText = result.message;
        status.style.color = result.success ? "green" : "red";
        
        if(result.success) setTimeout(() => document.getElementById('go-to-login').click(), 1500);
    } catch (err) {
        status.innerText = "Network Error";
        status.style.color = "red";
    } finally {
        btn.innerText = "Create Account";
    }
});

// 2. LOGIN LOGIC
document.getElementById('login-btn').addEventListener('click', async () => {
    const btn = document.getElementById('login-btn');
    const status = document.getElementById('login-status');
    
    btn.innerText = "Authenticating...";
    
    const payload = {
        action: "LOGIN_CUSTOMER",
        payload: {
            phone: document.getElementById('login-phone').value,
            password: document.getElementById('login-password').value
        }
    };

    try {
        const response = await fetch(APPS_SCRIPT_URL, {
            method: "POST", headers: { "Content-Type": "text/plain" }, body: JSON.stringify(payload)
        });
        const result = await response.json();
        
        if (result.success) {
            currentRestaurant = result.restaurantName;
            document.getElementById('welcome-msg').innerText = `Welcome, ${currentRestaurant}`;
            document.getElementById('login-screen').classList.add('hidden');
            document.getElementById('dashboard-screen').classList.remove('hidden');
        } else {
            status.innerText = result.message;
            status.style.color = "red";
        }
    } catch (err) {
        status.innerText = "Network Error";
        status.style.color = "red";
    } finally {
        btn.innerText = "Secure Login";
    }
});

// 3. BOOKING LOGIC
document.getElementById('book-btn').addEventListener('click', async () => {
    const btn = document.getElementById('book-btn');
    const status = document.getElementById('book-status');
    const date = document.getElementById('book-date').value;
    const qty = document.getElementById('book-qty').value;

    if(!date || !qty) {
        status.innerText = "Please fill all fields.";
        status.style.color = "red";
        return;
    }
    
    btn.innerText = "Submitting...";
    
    const payload = {
        action: "BOOK_CYLINDERS",
        payload: {
            restaurantName: currentRestaurant,
            requiredDate: date,
            cylinders: qty
        }
    };

    try {
        const response = await fetch(APPS_SCRIPT_URL, {
            method: "POST", headers: { "Content-Type": "text/plain" }, body: JSON.stringify(payload)
        });
        const result = await response.json();
        
        status.innerText = result.message;
        status.style.color = result.success ? "green" : "red";
        
        if(result.success) {
            document.getElementById('book-date').value = "";
            document.getElementById('book-qty').value = "";
        }
    } catch (err) {
        status.innerText = "Network Error";
        status.style.color = "red";
    } finally {
        btn.innerText = "Submit Request";
    }
});
