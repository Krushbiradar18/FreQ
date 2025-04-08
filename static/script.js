document.addEventListener("DOMContentLoaded", function () {
    const fileInput = document.getElementById("fileInput");
    const dropArea = document.getElementById("drop-area");
    const fileList = document.getElementById("file-list");
    const mostFrequentSection = document.getElementById("most-frequent");
    const mediumFrequentSection = document.getElementById("medium-frequent");
    const leastFrequentSection = document.getElementById("least-frequent");
    const downloadBtn = document.getElementById("downloadBtn");
    const chartContainer = document.getElementById("chart-container");
    let questionChart = null;

    fileInput.addEventListener("change", function (event) {
        handleFiles(event.target.files);
    });

    dropArea.addEventListener("dragover", (event) => {
        event.preventDefault();
        dropArea.classList.add("highlight");
    });

    dropArea.addEventListener("dragleave", () => {
        dropArea.classList.remove("highlight");
    });

    dropArea.addEventListener("drop", (event) => {
        event.preventDefault();
        dropArea.classList.remove("highlight");
        handleFiles(event.dataTransfer.files);
    });

    function handleFiles(files) {
        const validFiles = [];
        const invalidFiles = [];

        for (let file of files) {
            if (isValidFileType(file)) {
                validFiles.push(file);
            } else {
                invalidFiles.push(file.name);
            }
        }

        if (invalidFiles.length > 0) {
            showError("Invalid file type(s): " + invalidFiles.join(", ") + ". Please upload PDF or DOCX files.");
        }

        if (validFiles.length > 0) {
            uploadFiles(validFiles);
        }
    }

    function isValidFileType(file) {
        const validTypes = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
        return validTypes.includes(file.type);
    }

    function uploadFiles(files) {
        let formData = new FormData();
        for (let file of files) {
            formData.append("files", file);
        }

        fetch("/upload", {
            method: "POST",
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                showError(data.error);
                downloadBtn.style.display = "none";
            } else {
                displayQuestions(data.questions);
                displayFiles(files);
                downloadBtn.style.display = "block";
            }
        })
        .catch(error => {
            console.error("Error:", error);
            showError("Something went wrong while uploading. Please try again.");
            downloadBtn.style.display = "none";
        });
    }

    function displayFiles(files) {
        fileList.innerHTML = ""; // Clear previous list

        for (let file of files) {
            const fileItem = document.createElement("div");
            fileItem.classList.add("file-item");
            fileItem.innerHTML = `
                <p>${file.name}</p>
                <button class="delete-btn">Delete</button>
            `;

            fileItem.querySelector(".delete-btn").addEventListener("click", function () {
                fileItem.remove();
                checkFileListEmpty();
            });

            fileList.appendChild(fileItem);
        }
    }

    function checkFileListEmpty() {
        if (fileList.children.length === 0) {
            fileList.innerHTML = "<p>No files uploaded</p>";
        }
    }

    function displayQuestions(questions) {
        mostFrequentSection.innerHTML = "<h3>Most Frequent</h3>";
        mediumFrequentSection.innerHTML = "<h3>Medium Frequent</h3>";
        leastFrequentSection.innerHTML = "<h3>Least Frequent</h3>";

        if (questions.length === 0) {
            downloadBtn.style.display = "none";
            return;
        }

        questions.sort((a, b) => b.frequency - a.frequency);

        questions.forEach((q, index) => {
            let div = document.createElement("div");
            div.classList.add("question");
            div.innerHTML = `<p>${q.question}</p> <span>Frequency: ${q.frequency}</span>`;

            if (index < questions.length * 0.3) {
                mostFrequentSection.appendChild(div);
            } else if (index < questions.length * 0.6) {
                mediumFrequentSection.appendChild(div);
            } else {
                leastFrequentSection.appendChild(div);
            }
        });

        chartContainer.style.display = "block";
    }

    downloadBtn.addEventListener("click", function () {
        fetch("/export/pdf")
        .then(response => {
            if (!response.ok) {
                throw new Error("Failed to generate PDF.");
            }
            return response.blob();
        })
        .then(blob => {
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "question_analysis.pdf";
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        })
        .catch(error => {
            console.error("Error downloading PDF:", error);
            showError("Failed to download PDF. Please try again later.");
        });
    });

    // Global modal popup handler
    window.showError = function (message) {
        const modal = document.getElementById("errorModal");
        const messageBox = document.getElementById("errorMessage");

        if (modal && messageBox) {
            messageBox.textContent = message;
            modal.style.display = "block";
        } else {
            alert(message); // Fallback
        }
    };
});