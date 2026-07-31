// ==========================================
// CONFIGURATION
// ==========================================
// Replace this with your newly deployed Google Apps Script Web App URL
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwEY8HxWAvqP9LU1tHYC7pXSyEqdwSDv0DCT8SciG-2_zOOVMICcUwiaKOk0oactJAh/exec";

// ==========================================
// DOM ELEMENTS
// ==========================================
const driverSelect = document.getElementById("driver-select");
const recordBtn = document.getElementById("record-btn");
const statusText = document.getElementById("status-text");

// ==========================================
// INITIALIZATION: Fetch Drivers on Load
// ==========================================
async function fetchDrivers() {
    try {
        const response = await fetch(APPS_SCRIPT_URL);
        const data = await response.json();

        if (data.success && data.drivers) {
            // Clear the "Loading..." option
            driverSelect.innerHTML = '<option value="">-- Choose a Driver --</option>';
            
            // Populate the dropdown with the names from your Google Sheet
            data.drivers.forEach(driver => {
                const option = document.createElement("option");
                option.value = driver;
                option.textContent = driver;
                driverSelect.appendChild(option);
            });
            
            statusText.textContent = "Ready to record.";
        } else {
            statusText.textContent = "Error loading drivers.";
        }
    } catch (error) {
        console.error("Fetch error:", error);
        statusText.textContent = "Network error. Could not connect.";
    }
}

// ==========================================
// EVENT LISTENERS
// ==========================================
// Enable the record button ONLY when a driver is actually selected
driverSelect.addEventListener("change", () => {
    if (driverSelect.value !== "") {
        recordBtn.disabled = false;
        statusText.textContent = `Ready to record for ${driverSelect.value}.`;
    } else {
        recordBtn.disabled = true;
        statusText.textContent = "Please select a driver first.";
    }
});

// Start the app by fetching the drivers
window.onload = fetchDrivers;
