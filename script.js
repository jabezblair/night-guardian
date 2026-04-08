// CLOCK
setInterval(() => {
    let t = document.getElementById("time");
    if (t) {
        t.innerText = new Date().toLocaleTimeString();
    }
}, 1000);

// IMAGE PREVIEW
function loadImage() {
    let file = document.getElementById("imageUpload").files[0];

    if (!file) return;

    let reader = new FileReader();
    reader.onload = e => {
        document.getElementById("preview").innerHTML =
            `<img src="${e.target.result}" class="h-full w-full object-cover rounded">`;
    };
    reader.readAsDataURL(file);
}

async function analyzeImage() {

    let file = document.getElementById("imageUpload").files[0];
    let water = document.getElementById("waterInput").value;
    let meals = document.getElementById("mealInput").value;

    // 🚨 VALIDATION
    if (!file) {
        alert("Please upload an image first!");
        return;
    }

    if (!water || !meals) {
        alert("Enter water & meals!");
        return;
    }

    document.getElementById("loading").classList.remove("hidden");

    let form = new FormData();
    form.append("image", file, "image.jpg");
    form.append("water", water);
    form.append("meals", meals);

    try {
        let res = await fetch("https://nonconsumable-unevenly-ryleigh.ngrok-free.dev/analyze", {
            method: "POST",
            body: form
        });

        let data = await res.json();

        console.log(data); // 🔥 DEBUG

        // 🚨 ERROR CHECK
        if (data.error) {
            alert("Backend Error!");
            return;
        }

        document.getElementById("sleep").innerText =
            `${data.sleep_status} (${data.sleep_score}/10)`;

        document.getElementById("water").innerText =
            `${data.hydration_score}/10`;

        document.getElementById("food").innerText =
            `${data.nutrition_score}/10`;

        document.getElementById("overall").innerText =
            `${data.overall}/10`;

        // SAVE FOR CHAT
        localStorage.setItem("lastReport", `
Sleep: ${data.sleep_status} (${data.sleep_score}/10)
Hydration: ${data.hydration_score}/10
Nutrition: ${data.nutrition_score}/10
Overall: ${data.overall}/10
`);

        if (data.alert) showAlert();

    } catch (err) {
        console.error(err);
        alert("Backend not connected ❌");
    }

    document.getElementById("loading").classList.add("hidden");
}

// RANDOM METRICS
function simulate() {
    setInterval(() => {
        set("sleep");
        set("water");
        set("food");
    }, 3000);
}

function set(id) {
    let el = document.getElementById(id);
    if (el) {
        el.innerText = Math.floor(Math.random() * 100) + "%";
    }
}
function handleChatEnter(e) {
    if (e.key === "Enter") {
        sendChatMessage();
    }
}
function addMessage(message, type) {
    const chatBox = document.getElementById("chatMessages");

    let div = document.createElement("div");
    div.className = type === "user" ? "user-msg" : "bot-msg";
    div.innerText = message;

    chatBox.appendChild(div);
    chatBox.scrollTop = chatBox.scrollHeight;
}

// Enter key
function handleChatEnter(e) {
    if (e.key === "Enter") {
        sendChatMessage();
    }
}
let ctx = document.getElementById("sleepChart");

new Chart(ctx, {
    type: 'line',
    data: {
        labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
        datasets: [{
            label: "Sleep Score",
            data: [6, 7, 5, 8, 6, 9, 7],
            borderWidth: 2
        }]
    },
    options: {
        scales: {
            y: { beginAtZero: true, max: 10 }
        }
    }
});
// Menu click
function quickMessage(text) {
    document.getElementById("chatInput").value = text;
    sendChatMessage();
}
let progress = 0;
let loader = setInterval(() => {
    progress += 10;
    document.getElementById("progress").style.width = progress + "%";

    if (progress >= 100) {
        clearInterval(loader);
        document.getElementById("loader").style.display = "none";
    }
}, 200); 
let videoStream;

async function startCamera() {
    const video = document.getElementById("video");

    try {
        videoStream = await navigator.mediaDevices.getUserMedia({ video: true });
        video.srcObject = videoStream;

        video.onloadedmetadata = () => {
            video.play();
            startDetectionLoop();
        };

    } catch (err) {
        alert("Camera access denied ❌");
        console.error(err);
    }
}
function startDetectionLoop() {
    setInterval(async () => {

        const video = document.getElementById("video");

        // 🚨 FIX: Ensure video is ready
        if (video.videoWidth === 0) return;

        let canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        let ctx = canvas.getContext("2d");
        ctx.drawImage(video, 0, 0);

        canvas.toBlob(async (blob) => {

            if (!blob) return;

            let form = new FormData();
            form.append("image", blob, "frame.jpg"); // ✅ IMPORTANT FIX

            try {
                let res = await fetch("https://nonconsumable-unevenly-ryleigh.ngrok-free.dev/analyze", {
                    method: "POST",
                    body: form
                });

                let data = await res.json();

                console.log("Detection:", data);

                if (data.alert) {
                    showAlert();
                }

            } catch (err) {
                console.error("Detection error:", err);
            }

        }, "image/jpeg");

    }, 2500); // every 2.5 sec
}

async function captureFrame() {
    let video = document.getElementById("video");

    let canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    let ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0);

    let blob = await new Promise(res => canvas.toBlob(res));

    let form = new FormData();
    form.append("image", blob);

    let res = await fetch("https://nonconsumable-unevenly-ryleigh.ngrok-free.dev/analyze", {
        method: "POST",
        body: form
    });

    let data = await res.json();

    if (data.alert) {
        showAlert();
    }
} 
function showAlert() {
    let box = document.getElementById("alertBox");
    box.classList.remove("hidden");

    setTimeout(() => {
        box.classList.add("hidden");
    }, 3000);
}

// Send message
async function sendMessage() {
    const input = document.getElementById("chatInput");
    let message = input.value.trim();

    if (!message) return;

    addMessage(message, "user");
    input.value = "";

    showTyping();

    try {
        let res = await fetch("https://nonconsumable-unevenly-ryleigh.ngrok-free.dev/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message })
        });

        let data = await res.json();

        removeTyping();
        addMessage(data.reply, "bot");

    } catch {
        removeTyping();
        addMessage("❌ Backend not connected", "bot");
    }
}

// BACKEND IMAGE
async function sendToBackend(file) {
    let form = new FormData();
    form.append("image", file);

    try {
        await fetch("https://nonconsumable-unevenly-ryleigh.ngrok-free.dev /upload", {
            method: "POST",
            body: form
        });
    } catch {
        console.log("Backend not running");
    }
}
async function sendChatMessage() {
    const input = document.getElementById("chatInput");
    const chatBox = document.getElementById("chatMessages");

    let message = input.value.trim();
    if (!message) return;

    chatBox.innerHTML += `
        <div class="bg-blue-500/20 p-3 rounded-xl ml-auto mb-2 text-right">
            ${message}
        </div>`;

    input.value = "";

    try {
        let res = await fetch("https://nonconsumable-unevenly-ryleigh.ngrok-free.dev/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message })
        });

        let data = await res.json();

        chatBox.innerHTML += `
        <div class="bg-purple-500/20 p-3 rounded-xl mb-2">
            🤖 ${data.reply}
        </div>`;
    } catch (err) {
        chatBox.innerHTML += `
        <div class="bg-red-500/20 p-3 rounded-xl mb-2">
            ❌ Backend not connected
        </div>`;
    }

    chatBox.scrollTop = chatBox.scrollHeight;
}
// ALERT CHECK
async function checkBackend() {
    try {
        let res = await fetch("https://nonconsumable-unevenly-ryleigh.ngrok-free.dev/status");
        let data = await res.json();

        alert(data.alert ? "🚨 Drowsiness Detected!" : "✅ You are fine");
    } catch {
        alert("❌ Backend not connected");
    }
}

// CHAT
async function sendChatMessage() {
    const input = document.getElementById("chatInput");
    const chatBox = document.getElementById("chatMessages");

    let message = input.value.trim();
    if (!message) return;

    chatBox.innerHTML += `
        <div class="bg-blue-500/20 p-3 rounded-xl ml-auto mb-2">
            ${message}
        </div>`;

    input.value = "";

    try {
        let res = await fetch("https://nonconsumable-unevenly-ryleigh.ngrok-free.dev/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message })
        });

        let data = await res.json();

        chatBox.innerHTML += `
        <div class="bg-purple-500/20 p-3 rounded-xl mb-2">
            ${data.reply}
        </div>`;
    } catch {
        chatBox.innerHTML += `
        <div class="bg-red-500/20 p-3 rounded-xl mb-2">
            ❌ Backend not connected
        </div>`;
    }

    chatBox.scrollTop = chatBox.scrollHeight;
}
