document.addEventListener("DOMContentLoaded", () => {
    const modal = document.getElementById("myModal");
    const modalText = document.getElementById("modal-text");
    const closeBtn = document.querySelector(".close");
    const searchBtn = document.querySelector(".search-btn");
    const inputBox = document.getElementById("URL");
    const previewIframe = document.getElementById("yt_preview");
    const formatSelect = document.getElementById("format-select");
    const qualitySelect = document.getElementById("quality-select");
    const videoQualities = ["240p", "360p", "480p", "720p", "1080p"];
    const audioBitrates = ["128kbps", "192kbps", "256kbps", "320kbps"];
    const downloadBtn = document.getElementById("download-btn");
    const progressContainer = document.getElementById("progress-container");
    const progressBar = document.getElementById("progress-bar");
    const progressText = document.getElementById("progress-text");
    var vidID = "";

    function updateQualityOptions(format) {
        qualitySelect.innerHTML = "";

        const options = (format === "mp4" || format === "mkv") ? videoQualities : audioBitrates;
        options.forEach((optionValue) => {
            const option = document.createElement("option");
            option.value = optionValue;
            option.textContent = optionValue;
            qualitySelect.appendChild(option);
        });
    }

    function getVideoId(url) {
        const regex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
        const match = url.match(regex);
        return match ? match[1] : null;
    }

    function openModal(videoId) {
        previewIframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`;
        modal.style.display = "flex";
        modalText.innerText = "I want to download the above Youtube video in ";
        updateQualityOptions(formatSelect.value);
    }

    function closeModal() {
        modal.style.display = "none";
        previewIframe.src = "";
    }

    formatSelect.addEventListener("change", () => {
        updateQualityOptions(formatSelect.value);
    });

    searchBtn.addEventListener("click", async () => {
        const query = inputBox.value.trim();
        if (!query) {
            alert("Please enter a link or search keyword");
            return;
        }

        if (query.startsWith("https://")) {
            const videoId = getVideoId(query);
            vidID = videoId;
            console.log(vidID);
            if (videoId) openModal(videoId);
            else alert("Invalid YouTube URL");
        } else {
            try {
                const response = await fetch(`http://localhost:3000/search?query=${encodeURIComponent(query)}`);
                const data = await response.json();
                if (data.videoId) {
                    vidID = data.videoId;
                    openModal(data.videoId);
                    console.log(vidID);
                } else {
                    alert("No videos found");
                }
            } catch (error) {
                alert("Error fetching data");
            }
        }
    });

    closeBtn.addEventListener("click", closeModal);
    window.addEventListener("click", (event) => {
        if (event.target === modal) closeModal();
    });

    downloadBtn.addEventListener("click", async () => {
        downloadBtn.style.display = "none";
        progressContainer.style.display = "block";
        
        const eventSource = new EventSource("/progress");
        
        eventSource.onmessage = (event) => {
            const data = event.data.trim();
        
            if (data === "complete") {
                progressBar.style.width = "100%";
                progressText.innerText = "Downloading !";
                setTimeout(() => {
                    progressContainer.style.display = "none";
                }, 2000);
                eventSource.close();
                return;
            }
        
            const progress = parseInt(data);
            if (!isNaN(progress)) {
                progressBar.style.transition = "width 0.4s ease-in-out";
                progressBar.style.width = `${progress}%`;
                progressText.innerText = `Encrypting: ${progress}%`;
            }
        };
        
        eventSource.onerror = (error) => {
            console.error("Progress tracking error:", error);
            eventSource.close();
        };

        try {
            const response = await fetch("/download", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ url: vidID }),
            });
        
            if (!response.ok) throw new Error("Download request failed");
        
            const data = await response.json();
            if (data.path) {
                const a = document.createElement("a");
                a.href = data.path;
                a.download = `${vidID}_${Date.now()}.mp4`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                setTimeout(() => {
                    window.location.href = "http://localhost:3000";
                }, 4000);             
            } else {
                console.error("No file path received.");
            }

        } catch (error) {
            console.error("Error:", error);
        }
        
    });
});
