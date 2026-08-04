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

    // FIXED: Package the request to exactly match Code.gs expectations
    const payload = {
        action: "ADMIN_LOGIN", // Changed from "LOGIN"
        payload: {             // Nested the credentials inside payload
            username: username,
            password: password
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
            // Success: Hide login, show dashboard
            loginStatus.textContent = "";
            loginContainer.style.display = "none";
            dashboardContainer.style.display = "flex";

             // Fetch the data!
            fetchLogs();
            
            console.log("Authentication successful.");
        } else {
            // FIXED: Look for result.message instead of result.error
            loginStatus.textContent = result.message || result.error || "Login Failed.";
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
    contentArea.innerHTML = "<p>Loading delivery logs...</p>";

    try {
        // Notice we added "?endpoint=logs" to the URL
        const response = await fetch(APPS_SCRIPT_URL + "?endpoint=logs");
        const result = await response.json();

        if (result.success) {
            renderTable(result.data);
        } else {
            contentArea.innerHTML = `<p style="color: red;">Failed to connect to the database: ${result.error || "Unknown error"}</p>`;
        }
    } catch (error) {
        console.error("Fetch error:", error);
        contentArea.innerHTML = "<p style='color: red;'>Failed to connect to the database.</p>";
    }
}

// ==========================================
// RENDER TABLE WITH AMOUNT COLUMN
// ==========================================
function renderTable(data) {
    const contentArea = document.getElementById("dynamic-content");
    
    if (!data || data.length === 0) {
        contentArea.innerHTML = "<p>No delivery logs found.</p>";
        return;
    }

    // Build table header including 'Amount'
    let html = `
    <table class="data-table">
        <thead>
            <tr>
                <th>Timestamp</th>
                <th>Driver Name</th>
                <th>Restaurants</th>
                <th>Cylinders</th>
                <th>Empties</th>
                <th>Amount</th>
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
        const empties = row[4] || ""; 
        const amount = row[5] || "";   // NEW: Amount is column index 5
        const flag = row[6] || "";     // SHIFTED: Flag is now column index 6

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
            <td><input type="number" id="cyl-${i}" value="${cylinders}" disabled style="border:none; background:transparent; width: 50px;"></td>
            <td><input type="number" id="emp-${i}" value="${empties}" disabled style="border:none; background:transparent; width: 50px;"></td>
            <td><input type="number" id="amt-${i}" value="${amount}" disabled style="border:none; background:transparent; width: 70px;"></td>
            <td>
              <button class="action-btn" id="edit-btn-${i}" onclick="toggleEdit(${i}, '${timestamp}')" style="padding: 6px 12px; margin: 0;">Edit</button>
            </td>
          </tr>
        `;
    }

    html += '</tbody></table>';
    contentArea.innerHTML = html;
}

// ==========================================
// INLINE EDITING ENGINE (WITH AMOUNT)
// ==========================================
async function toggleEdit(index, timestamp) {
    const btn = document.getElementById(`edit-btn-${index}`);
    const driverInput = document.getElementById(`driver-${index}`);
    const restInput = document.getElementById(`rest-${index}`);
    const cylInput = document.getElementById(`cyl-${index}`);
    const empInput = document.getElementById(`emp-${index}`);
    const amtInput = document.getElementById(`amt-${index}`); // NEW: Target Amount input

    if (btn.innerText === "Edit") {
        // UNLOCK FIELDS
        driverInput.disabled = false;
        restInput.disabled = false;
        cylInput.disabled = false;
        empInput.disabled = false;
        amtInput.disabled = false;
        
        driverInput.style.border = "1px solid #ccc";
        restInput.style.border = "1px solid #ccc";
        cylInput.style.border = "1px solid #ccc";
        empInput.style.border = "1px solid #ccc";
        amtInput.style.border = "1px solid #ccc";
        
        driverInput.style.backgroundColor = "#fff";
        restInput.style.backgroundColor = "#fff";
        cylInput.style.backgroundColor = "#fff";
        empInput.style.backgroundColor = "#fff";
        amtInput.style.backgroundColor = "#fff";
        
        btn.innerText = "Save";
        btn.style.backgroundColor = "#34a853"; 
        btn.style.color = "white";
        
    } else {
        // SAVE CHANGES
        btn.innerText = "Saving...";
        btn.disabled = true;

        const payload = {
            action: "UPDATE_DELIVERY",
            payload: {
                timestamp: timestamp,
                driver_name: driverInput.value,
                restaurant: restInput.value,
                cylinders: cylInput.value,
                empties: empInput.value,
                amount: amtInput.value, // NEW: Send updated amount to backend
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
                // LOCK FIELDS BACK
                driverInput.disabled = true;
                restInput.disabled = true;
                cylInput.disabled = true;
                empInput.disabled = true;
                amtInput.disabled = true;
                
                driverInput.style.border = "none";
                restInput.style.border = "none";
                cylInput.style.border = "none";
                empInput.style.border = "none";
                amtInput.style.border = "none";
                
                driverInput.style.backgroundColor = "transparent";
                restInput.style.backgroundColor = "transparent";
                cylInput.style.backgroundColor = "transparent";
                empInput.style.backgroundColor = "transparent";
                amtInput.style.backgroundColor = "transparent";
                
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

// ==========================================
// NAVIGATION & SIDEBAR SWITCHING
// ==========================================
const navLogs = document.getElementById("nav-logs");
const navRequests = document.getElementById("nav-requests");
const pageTitle = document.getElementById("page-title");

navLogs.addEventListener("click", () => {
    setActiveNav(navLogs);
    pageTitle.textContent = "Delivery Logs";
    fetchLogs(); // Existing function to load logs
});

navRequests.addEventListener("click", () => {
    setActiveNav(navRequests);
    pageTitle.textContent = "Customer Requests";
    fetchCustomerRequests();
});

function setActiveNav(selectedItem) {
    document.querySelectorAll(".sidebar li").forEach(li => li.classList.remove("active"));
    selectedItem.classList.add("active");
}

// ==========================================
// FETCH & RENDER CUSTOMER REQUESTS
// ==========================================
async function fetchCustomerRequests() {
    const contentArea = document.getElementById("dynamic-content");
    contentArea.innerHTML = "<p>Loading requests...</p>";

    try {
        const response = await fetch(`${APPS_SCRIPT_URL}?action=GET_CUSTOMER_REQUESTS`);
        const result = await response.json();

        if (result.success) {
            renderRequestsTable(result.data);
        } else {
            contentArea.innerHTML = `<p style="color:red;">Error: ${result.error}</p>`;
        }
    } catch (err) {
        contentArea.innerHTML = `<p style="color:red;">Failed to connect to database.</p>`;
    }
}

function renderRequestsTable(data) {
    const contentArea = document.getElementById("dynamic-content");

    // Filter out header row if present and check length
    const requests = data.slice(1);

    if (!requests || requests.length === 0) {
        contentArea.innerHTML = "<p>No cylinder requests found.</p>";
        return;
    }

    let html = `
    <table class="data-table">
        <thead>
            <tr>
                <th>Order ID</th>
                <th>Timestamp</th>
                <th>Restaurant Name</th>
                <th>Required Date</th>
                <th>Cylinders</th>
                <th>Status</th>
                <th>Actions</th>
            </tr>
        </thead>
        <tbody>
    `;

    requests.forEach(row => {
        const orderId = row[0];
        const timestamp = new Date(row[1]).toLocaleString();
        const restaurantName = row[2];
        const requiredDate = row[3];
        const cylinders = row[4];
        const status = row[5];

        const isPending = status === "Pending";
        const statusBadge = isPending 
            ? `<span style="color: #e67e22; font-weight: bold;">Pending</span>`
            : `<span style="color: #27ae60; font-weight: bold;">${status}</span>`;

        html += `
          <tr>
            <td><strong>${orderId}</strong></td>
            <td>${timestamp}</td>
            <td>${restaurantName}</td>
            <td>${requiredDate}</td>
            <td>${cylinders}</td>
            <td>${statusBadge}</td>
            <td>
              ${isPending 
                ? `<button class="action-btn" onclick="acceptOrder('${orderId}')" style="background:#34a853; color:white;">Accept Request</button>` 
                : `<button disabled style="opacity:0.5;">Accepted</button>`
              }
            </td>
          </tr>
        `;
    });

    html += `</tbody></table>`;
    contentArea.innerHTML = html;
}

// ==========================================
// ACCEPT ORDER FUNCTION
// ==========================================
async function acceptOrder(orderId) {
    if (!confirm(`Are you sure you want to accept order ${orderId}?`)) return;

    const payload = {
        action: "ACCEPT_ORDER",
        payload: { orderId: orderId }
    };

    try {
        const response = await fetch(APPS_SCRIPT_URL, {
            method: "POST",
            headers: { "Content-Type": "text/plain" },
            body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (result.success) {
            alert(`Order ${orderId} has been accepted!`);
            fetchCustomerRequests(); // Refresh table view
        } else {
            alert("Error updating order: " + result.error);
        }
    } catch (err) {
        alert("Network error. Could not accept order.");
    }
}
