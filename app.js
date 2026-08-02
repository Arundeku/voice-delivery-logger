// ==========================================
// CONFIGURATION
// ==========================================
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwEY8HxWAvqP9LU1tHYC7pXSyEqdwSDv0DCT8SciG-2_zOOVMICcUwiaKOk0oactJAh/exec";

// ==========================================
// DOM ELEMENTS
// ==========================================
const driverSelect = document.getElementById("driver-select");
const recordBtn = document.getElementById("record-btn");
const statusText = document.getElementById("status-text");

// Global holder for parsed data during review stage
let pendingDeliveryData = {};
let currentSelectedDriver = "";

// ==========================================
// AUDIO RECORDING VARIABLES
// ==========================================
let mediaRecorder;
let audioChunks = [];
let isRecording = false;

// ==========================================
// INITIALIZATION: Fetch Drivers on Load
// ==========================================
async function fetchDrivers() {
    try {
        const response = await fetch(APPS_SCRIPT_URL);
        const data = await response.json();

        if (data.success && data.drivers) {
            driverSelect.innerHTML = '<option value="">-- Choose a Driver --</option>';
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
driverSelect.addEventListener("change", () => {
    if (driverSelect.value !== "") {
        recordBtn.disabled = false;
        statusText.textContent = `Ready to record for ${driverSelect.value}.`;
    } else {
        recordBtn.disabled = true;
        statusText.textContent = "Please select a driver first.";
    }
});

recordBtn.addEventListener("click", async () => {
    if (!isRecording) {
        await startRecording();
    } else {
        stopRecording();
    }
});

// ==========================================
// AUDIO CAPTURE LOGIC
// ==========================================
async function startRecording() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);
        audioChunks = [];

        mediaRecorder.ondataavailable = event => {
            audioChunks.push(event.data);
        };

        mediaRecorder.onstop = processAudio;

        mediaRecorder.start();
        isRecording = true;
        
        recordBtn.textContent = "Stop Recording";
        recordBtn.classList.add("recording");
        statusText.textContent = "Listening...";
        driverSelect.disabled = true; 
    } catch (err) {
        console.error("Microphone access denied:", err);
        statusText.textContent = "Please allow microphone access.";
    }
}

function stopRecording() {
    if (mediaRecorder && mediaRecorder.state === "recording") {
        mediaRecorder.stop();
        mediaRecorder.stream.getTracks().forEach(track => track.stop());
    }
    isRecording = false;
    
    recordBtn.textContent = "Processing...";
    recordBtn.classList.remove("recording");
    recordBtn.disabled = true; 
    statusText.textContent = "Extracting data from voice...";
}

// ==========================================
// DATA PIPELINE: Process & Display Review UI
// ==========================================
async function processAudio() {
    const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
    const reader = new FileReader();
    reader.readAsDataURL(audioBlob);
    
    reader.onloadend = async () => {
        const base64AudioMessage = reader.result.split(',')[1];
        currentSelectedDriver = driverSelect.value; 
        
        const processPayload = {
            action: "PROCESS_AUDIO",
            audioBase64: base64AudioMessage,
            mimeType: 'audio/webm'
        };

        try {
            const response = await fetch(APPS_SCRIPT_URL, {
                method: "POST",
                headers: { "Content-Type": "text/plain" },
                body: JSON.stringify(processPayload)
            });

            const result = await response.json();
            
            if (result.success) {
                statusText.textContent = "Review extracted details & enter amount:";
                pendingDeliveryData = result.data.extracted;
                
                // Render the review card on screen for the driver to verify and edit
                renderReviewInterface(pendingDeliveryData);

            } else {
                statusText.textContent = "Extraction Error: " + result.error;
                setTimeout(resetUI, 3000);
            }
        } catch (err) {
            console.error("Pipeline error:", err);
            statusText.textContent = "Failed to connect to backend.";
            setTimeout(resetUI, 3000);
        }
    };
}

// ==========================================
// REVIEW & EDIT INTERFACE GENERATOR
// ==========================================
function renderReviewInterface(data) {
    const mainContainer = document.querySelector("main") || document.body;
    
    // Extract values safely
    const restaurantVal = Array.isArray(data.restaurants) ? data.restaurants.join(', ') : (data.restaurants || "");
    const cylindersVal = data.cylinders || 0;
    const emptiesVal = data.empties || 0;

    // Create a clean verification card overlay/replacement view
    mainContainer.innerHTML = `
        <div style="max-width: 400px; margin: 40px auto; padding: 25px; background: #ffffff; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); font-family: sans-serif;">
            <h2 style="margin-top: 0; color: #2c3e50;">Review Delivery</h2>
            <p style="font-size: 14px; color: #555;">Verify the extracted details and input the total amount collected.</p>
            
            <div style="margin-bottom: 15px;">
                <label style="font-weight: bold; font-size: 13px;">Restaurant:</label><br>
                <input type="text" id="review-rest" value="${restaurantVal}" style="width: 100%; padding: 8px; margin-top: 5px; box-sizing: border-box; border: 1px solid #ccc; border-radius: 4px;">
            </div>

            <div style="margin-bottom: 15px;">
                <label style="font-weight: bold; font-size: 13px;">Cylinders Delivered:</label><br>
                <input type="number" id="review-cyl" value="${cylindersVal}" style="width: 100%; padding: 8px; margin-top: 5px; box-sizing: border-box; border: 1px solid #ccc; border-radius: 4px;">
            </div>

            <div style="margin-bottom: 15px;">
                <label style="font-weight: bold; font-size: 13px;">Empties Taken:</label><br>
                <input type="number" id="review-emp" value="${emptiesVal}" style="width: 100%; padding: 8px; margin-top: 5px; box-sizing: border-box; border: 1px solid #ccc; border-radius: 4px;">
            </div>

            <div style="margin-bottom: 20px;">
                <label style="font-weight: bold; font-size: 13px; color: #d93025;">Amount (₹) *Required:</label><br>
                <input type="number" id="review-amt" placeholder="Enter amount manually" autofocus style="width: 100%; padding: 8px; margin-top: 5px; box-sizing: border-box; border: 2px solid #007bff; border-radius: 4px; font-size: 16px;">
            </div>

            <button id="submit-final-btn" style="width: 100%; background: #34a853; color: white; padding: 12px; border: none; border-radius: 4px; font-weight: bold; cursor: pointer; font-size: 16px;">Submit to Sheet</button>
        </div>
    `;

    // Hook up button click listener
    document.getElementById("submit-final-btn").addEventListener("click", submitFinalDataToSheet);

    // Allow hitting 'Enter' directly from the amount field to trigger submission instantly
    document.getElementById("review-amt").addEventListener("keypress", function(event) {
        if (event.key === "Enter") {
            event.preventDefault();
            submitFinalDataToSheet();
        }
    });
}

// ==========================================
// SUBMIT VERIFIED DATA TO GOOGLE SHEETS
// ==========================================
async function submitFinalDataToSheet() {
    const restaurantInput = document.getElementById("review-rest").value;
    const cylindersInput = parseInt(document.getElementById("review-cyl").value) || 0;
    const emptiesInput = parseInt(document.getElementById("review-emp").value) || 0;
    const amountInput = parseFloat(document.getElementById("review-amt").value) || 0;

    const submitBtn = document.getElementById("submit-final-btn");
    submitBtn.textContent = "Saving to Sheet...";
    submitBtn.disabled = true;

    // Package the final verified data
    const finalData = {
        driver_name: currentSelectedDriver,
        restaurants: [restaurantInput],
        cylinders: cylindersInput,
        empties: emptiesInput,
        amount: amountInput,
        confidence_flags: pendingDeliveryData.confidence_flags || []
    };

    const submitPayload = {
        action: "SUBMIT_DELIVERY",
        payload: finalData
    };

    try {
        const saveResponse = await fetch(APPS_SCRIPT_URL, {
            method: "POST",
            headers: { "Content-Type": "text/plain" },
            body: JSON.stringify(submitPayload)
        });
        
        const saveResult = await saveResponse.json();
        
        if (saveResult.success) {
            alert("Delivery logged successfully!");
            location.reload(); // Refresh the page to reset everything for the next delivery
        } else {
            alert("Error saving to sheet: " + saveResult.error);
            submitBtn.textContent = "Submit to Sheet";
            submitBtn.disabled = false;
        }
    } catch (err) {
        console.error("Save error:", err);
        alert("Network error. Could not connect to backend.");
        submitBtn.textContent = "Submit to Sheet";
        submitBtn.disabled = false;
    }
}

function resetUI() {
    recordBtn.textContent = "Tap to Speak";
    recordBtn.disabled = false;
    driverSelect.disabled = false;
    statusText.textContent = `Ready to record for ${driverSelect.value}.`;
}

// Start the app
window.onload = fetchDrivers;
