// Paste your exact Apps Script /exec URL here
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwEY8HxWAvqP9LU1tHYC7pXSyEqdwSDv0DCT8SciG-2_zOOVMICcUwiaKOk0oactJAh/exec"; 

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

// 1. REGISTRATION & OTP LOGIC
document.getElementById('send-otp-btn').addEventListener('click', async () => {
    const btn = document.getElementById('send-otp-btn');
    const status = document.getElementById('reg-status');
    
    const restName = document.getElementById('reg-rest').value.trim();
    const contact = document.getElementById('reg-name').value.trim();
    const phone = document.getElementById('reg-phone').value.trim();
    const password = document.getElementById('reg-password').value;

    if (!restName || !contact || !phone || !password) {
        status.innerText = "Please fill out all fields.";
        status.style.color = "red";
        return;
    }

    // STRICT PASSWORD SECURITY CHECK
    const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordPattern.test(password)) {
        status.innerText = "Password must be at least 8 characters long and include an uppercase letter, a lowercase letter, a number, and a special character (e.g., @$!%*?&).";
        status.style.color = "red";
        return;
    }

    btn.innerText = "Sending SMS...";
    btn.disabled = true;

    const payload = {
        action: "SEND_OTP",
        payload: {
            restaurantName: restName,
            contactPerson: contact,
            phone: phone,
            password: password 
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
            // Hide Step 1 inputs, show Step 2 OTP inputs
            document.getElementById('reg-step-1').classList.add('hidden');
            document.getElementById('reg-step-2').classList.remove('hidden');
        }
    } catch (err) {
        status.innerText = "Network Error while sending OTP.";
        status.style.color = "red";
    } finally {
        btn.innerText = "Send OTP Verification";
        btn.disabled = false;
    }
});

// VERIFY OTP BUTTON
document.getElementById('verify-btn').addEventListener('click', async () => {
    const btn = document.getElementById('verify-btn');
    const status = document.getElementById('reg-status');
    const phone = document.getElementById('reg-phone').value.trim();
    const otp = document.getElementById('reg-otp').value.trim();

    if (!otp) {
        status.innerText = "Please enter the OTP.";
        status.style.color = "red";
        return;
    }

    btn.innerText = "Verifying...";
    btn.disabled = true;

    const payload = {
        action: "VERIFY_OTP",
        payload: {
            phone: phone,
            otp: otp
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
            setTimeout(() => {
                // Reset form and return to login screen
                document.getElementById('reg-step-2').classList.add('hidden');
                document.getElementById('reg-step-1').classList.remove('hidden');
                document.getElementById('go-to-login').click();
            }, 2000);
        }
    } catch (err) {
        status.innerText = "Network Error while verifying OTP.";
        status.style.color = "red";
    } finally {
        btn.innerText = "Verify & Register";
        btn.disabled = false;
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
