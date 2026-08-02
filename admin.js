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

// REPLACED: New Editable Table Renderer (Now with Empties)
function renderTable(data) {
    const contentArea = document.getElementById("dynamic-content");
    
    if (!data || data.length === 0) {
        contentArea.innerHTML = "<p>No delivery logs found.</p>";
        return;
    }

    // Added "Empties" to the header
    let html = `
    <table class="data-table">
        <thead>
            <tr>
                <th>Timestamp</th>
                <th>Driver Name</th>
                <th>Restaurants</th>
                <th>Cylinders</th>
                <th>Empties</th>
                <th>Actions</th>
            </tr>
        </thead>
        <tbody id="logs-body">
    `;

    for (let i = 1; i < data.length; i++) {
        const row = data[i];
        const timestamp = row[0] || "";
        const driver = row[1] || "";
        const restaurant = row[2] || "";
        const cylinders = row[3] || "";
        const empties = row[4] || ""; // NEW: Empties is now the 5th column (index 4)
        const flag = row[5] || ""; // SHIFTED: Flag is now the 6th column (index 5)

        let flagNote = "";
        if (flag && flag.trim() !== "") {
            flagNote = `<br><span style="color: #d93025; font-size: 0.85em;">⚠️ Note: ${flag}</span>`;
        }

        html += `
          <tr>
            <td>${timestamp}</td>
            <td><input type="text" id="driver-${i}" value="${driver}" disabled style="border:none; background:transparent; width: 100%;"></td>
            <td>
              <input type="text" id="rest-${i}" value="${restaurant}" disabled style="border:none; background:transparent; width: 100%;">
              ${flagNote}
            </td>
            <td><input type="number" id="cyl-${i}" value="${cylinders}" disabled style="border:none; background:transparent; width: 60px;"></td>
            <td><input type="number" id="emp-${i}" value="${empties}" disabled style="border:none; background:transparent; width: 60px;"></td>
            <td>
              <button class="action-btn" id="edit-btn-${i}" onclick="toggleEdit(${i}, '${timestamp}')" style="padding: 6px 12px; margin: 0;">Edit</button>
            </td>
          </tr>
        `;
    }

    html += '</tbody></table>';
    contentArea.innerHTML = html;
}

// 3. Refresh Button Listener
const refreshBtn = document.getElementById("refresh-logs-btn");
if (refreshBtn) {
    refreshBtn.addEventListener("click", () => {
        const contentArea = document.getElementById("dynamic-content");
        contentArea.innerHTML = "<p>Refreshing delivery data...</p>";
        fetchLogs();
    });
}

// ==========================================
// INLINE EDITING ENGINE
// ==========================================

async function toggleEdit(index, timestamp) {
    const btn = document.getElementById(`edit-btn-${index}`);
    const driverInput = document.getElementById(`driver-${index}`);
    const restInput = document.getElementById(`rest-${index}`);
    const cylInput = document.getElementById(`cyl-${index}`);
    const empInput = document.getElementById(`emp-${index}`); // NEW: Target Empties

    if (btn.innerText === "Edit") {
        // UNLOCK
        driverInput.disabled = false;
        restInput.disabled = false;
        cylInput.disabled = false;
        empInput.disabled = false;
        
        driverInput.style.border = "1px solid #ccc";
        restInput.style.border = "1px solid #ccc";
        cylInput.style.border = "1px solid #ccc";
        empInput.style.border = "1px solid #ccc";
        
        driverInput.style.backgroundColor = "#fff";
        restInput.style.backgroundColor = "#fff";
        cylInput.style.backgroundColor = "#fff";
        empInput.style.backgroundColor = "#fff";
        
        btn.innerText = "Save";
        btn.style.backgroundColor = "#34a853"; 
        btn.style.color = "white";
        
    } else {
        // SAVE
        btn.innerText = "Saving...";
        btn.disabled = true;

        const payload = {
            action: "UPDATE_DELIVERY",
            payload: {
                timestamp: timestamp,
                driver_name: driverInput.value,
                restaurant: restInput.value,
                cylinders: cylInput.value,
                empties: empInput.value, // NEW: Send empties to backend
                clear_flag: true 
            }
        };

        try {
            const response = await fetch(APPS_SCRIPT_URL, { 
                method: "POST",
                headers: { "Content-Type": "text/plain" },
                body: JSON.stringify(payload)
            });
            
            const result = await response.json();

            if (result.success) {
                // LOCK
                driverInput.disabled = true;
                restInput.disabled = true;
                cylInput.disabled = true;
                empInput.disabled = true;
                
                driverInput.style.border = "none";
                restInput.style.border = "none";
                cylInput.style.border = "none";
                empInput.style.border = "none";
                
                driverInput.style.backgroundColor = "transparent";
                restInput.style.backgroundColor = "transparent";
                cylInput.style.backgroundColor = "transparent";
                empInput.style.backgroundColor = "transparent";
                
                btn.innerText = "Edit";
                btn.style.backgroundColor = ""; 
                btn.style.color = "";
                btn.disabled = false;
                
                fetchLogs(); 
            } else {
                alert("Failed to update: " + result.error);
                btn.innerText = "Save";
                btn.disabled = false;
            }
        } catch (error) {
            alert("Network Error: " + error);
            btn.innerText = "Save";
            btn.disabled = false;
        }
    }
}
