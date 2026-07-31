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

// Handle the Record Button Click
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
        
        // Update UI
        recordBtn.textContent = "Stop Recording";
        recordBtn.classList.add("recording");
        statusText.textContent = "Listening...";
        driverSelect.disabled = true; // Lock dropdown while recording
    } catch (err) {
        console.error("Microphone access denied:", err);
        statusText.textContent = "Please allow microphone access.";
    }
}

function stopRecording() {
    if (mediaRecorder && mediaRecorder.state === "recording") {
        mediaRecorder.stop();
        mediaRecorder.stream.getTracks().forEach(track => track.stop()); // Release mic
    }
    isRecording = false;
    
    // Update UI
    recordBtn.textContent = "Processing...";
    recordBtn.classList.remove("recording");
    recordBtn.disabled = true; 
    statusText.textContent = "Sending audio to pipeline...";
}

// ==========================================
// DATA PIPELINE: Send to Apps Script
// ==========================================
async function processAudio() {
    const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
    
    // Convert Blob to Base64
    const reader = new FileReader();
    reader.readAsDataURL(audioBlob);
    
    reader.onloadend = async () => {
        const base64AudioMessage = reader.result.split(',')[1];
        const selectedDriver = driverSelect.value; // Store the dropdown selection
        
        // Step 1: Send to AI for extraction
        const processPayload = {
            action: "PROCESS_AUDIO",
            audioBase64: base64AudioMessage,
            mimeType: 'audio/webm'
        };

        try {
            statusText.textContent = "Extracting data...";
            const response = await fetch(APPS_SCRIPT_URL, {
                method: "POST",
                headers: { "Content-Type": "text/plain" },
                body: JSON.stringify(processPayload)
            });

            const result = await response.json();
            
            if (result.success) {
                statusText.textContent = "Extraction complete! Saving to sheet...";
                console.log("Extracted Data:", result.data.extracted);
                
                // Step 2: Combine AI data with UI driver name
                const finalData = result.data.extracted;
                finalData.driver_name = selectedDriver; 
                
                const submitPayload = {
                    action: "SUBMIT_DELIVERY",
                    payload: finalData
                };

                // Step 3: Send the save command
                const saveResponse = await fetch(APPS_SCRIPT_URL, {
                    method: "POST",
                    headers: { "Content-Type": "text/plain" },
                    body: JSON.stringify(submitPayload)
                });
                
                const saveResult = await saveResponse.json();
                
                if (saveResult.success) {
                    statusText.textContent = "Delivery logged successfully!";
                } else {
                    statusText.textContent = "Error saving to sheet: " + saveResult.error;
                }
                
                // Reset UI for next delivery
                setTimeout(resetUI, 3000);

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

function resetUI() {
    recordBtn.textContent = "Tap to Speak";
    recordBtn.disabled = false;
    driverSelect.disabled = false;
    statusText.textContent = `Ready to record for ${driverSelect.value}.`;
}

// Start the app
window.onload = fetchDrivers;
