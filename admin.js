// ==========================================
// ADMIN PORTAL - Security & Logic
// ==========================================

// IMPORTANT: Paste your actual Google Apps Script URL here
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwEY8HxWAvqP9LU1tHYC7pXSyEqdwSDv0DCT8SciG-2_zOOVMICcUwiaKOk0oactJAh/exec"; 

// DOM Elements - Login View
const loginContainer = document.getElementById("login-container");
const usernameInput = document.getElementById("admin-username");
const passwordInput = document.getElementById("admin-password");
const loginBtn = document.getElementById("login-btn");
const loginStatus = document.getElementById("login-status");

// DOM Elements - Dashboard View
const dashboardContainer = document.getElementById("dashboard-container");

// 1. Handle Login Button Click
loginBtn.addEventListener("click", async () => {
    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();

    // Basic validation
    if (!username || !password) {
        loginStatus.textContent = "Please enter both username and password.";
        loginStatus.style.color = "red";
        return;
    }

    // UI Feedback
    loginStatus.textContent = "Authenticating...";
    loginStatus.style.color = "#555";
    loginBtn.disabled = true;

    // Package the request
    const payload = {
        action: "LOGIN",
        username: username,
        password: password
    };

    try {
        const response = await fetch(APPS_SCRIPT_URL, {
            method: "POST",
            headers: { "Content-Type": "text/plain" },
            body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (result.success) {
            // Success: Hide login, show dashboard
            loginStatus.textContent = "";
            loginContainer.style.display = "none";
            dashboardContainer.style.display = "flex"; // Using flexbox for dashboard layout
            
            console.log("Authentication successful.");
            // We will add the function to load the Google Sheets data here later!

        } else {
            // Failure: Show error message
            loginStatus.textContent = result.error;
            loginStatus.style.color = "red";
        }
    } catch (err) {
        console.error("Connection Error:", err);
        loginStatus.textContent = "Failed to connect to the secure server.";
        loginStatus.style.color = "red";
    } finally {
        // Always re-enable the button
        loginBtn.disabled = false;
    }
});

// 2. Quality of Life: Allow hitting 'Enter' to log in
passwordInput.addEventListener("keypress", function(event) {
    if (event.key === "Enter") {
        event.preventDefault();
        loginBtn.click();
    }
});
