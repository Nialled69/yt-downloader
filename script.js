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
            if (videoId) openModal(videoId);
            else alert("Invalid YouTube URL");
        } else {
            try {
                const response = await fetch(`http://localhost:3000/search?query=${encodeURIComponent(query)}`);
                const data = await response.json();
                if (data.videoId) {
                    openModal(data.videoId);
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
});
