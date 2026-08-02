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

             // Fetch the data!
            fetchLogs();
            
            console.log("Authentication successful.");
            
           
            
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

// ==========================================
// DATA FETCHING & RENDERING
// ==========================================

async function fetchLogs() {
    const contentArea = document.getElementById("dynamic-content");
    contentArea.innerHTML = "<p>Loading delivery data...</p>";

    const payload = { action: "GET_LOGS" };

    try {
        const response = await fetch(APPS_SCRIPT_URL, {
            method: "POST",
            headers: { "Content-Type": "text/plain" },
            body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (result.success) {
            renderTable(result.data);
        } else {
            contentArea.innerHTML = `<p style="color:red;">Error fetching data: ${result.error}</p>`;
        }
    } catch (err) {
        console.error("Fetch error:", err);
        contentArea.innerHTML = '<p style="color:red;">Failed to connect to the database.</p>';
    }
}

function renderTable(data) {
    const contentArea = document.getElementById("dynamic-content");
    
    // If sheet is completely empty
    if (!data || data.length === 0) {
        contentArea.innerHTML = "<p>No delivery logs found.</p>";
        return;
    }

    let html = '<table class="data-table"><thead><tr>';
    
    // Create Table Headers (Row 0 from Google Sheets)
    data[0].forEach(header => {
        html += `<th>${header}</th>`;
    });
    html += '</tr></thead><tbody>';

    // Create Data Rows (Row 1 onwards)
    for (let i = 1; i < data.length; i++) {
        html += '<tr>';
        data[i].forEach(cell => {
            html += `<td>${cell}</td>`;
        });
        html += '</tr>';
    }

    html += '</tbody></table>';
    contentArea.innerHTML = html;
}

// 3. Refresh Button Listener
const refreshBtn = document.getElementById("refresh-logs-btn");
if (refreshBtn) {
    refreshBtn.addEventListener("click", () => {
        // Provide visual feedback that it is working
        const contentArea = document.getElementById("dynamic-content");
        contentArea.innerHTML = "<p>Refreshing delivery data...</p>";

        // Call your existing fetch function
        fetchLogs();
    });
}
