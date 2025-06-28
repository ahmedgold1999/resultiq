document.addEventListener("DOMContentLoaded", function() {
    const form = document.getElementById("examForm");
    const resultsDiv = document.getElementById("results");
    const errorDiv = document.getElementById("error");
    const submitBtn = document.querySelector(".submit-btn");
    const btnText = document.querySelector(".btn-text");
    const loadingSpinner = document.querySelector(".loading-spinner");
    const themeButtons = document.querySelectorAll(".theme-btn");
    
    // Action buttons
    const searchAgainBtn = document.getElementById("searchAgainBtn");
    const downloadPdfBtn = document.getElementById("downloadPdfBtn");
    const downloadImageBtn = document.getElementById("downloadImageBtn");
    const printBtn = document.getElementById("printBtn");

    let currentStudentData = null;

    // Theme switching logic
    function applyTheme(theme) {
        document.body.className = "";
        themeButtons.forEach(btn => btn.classList.remove("active"));
        
        if (theme !== "default") {
            document.body.classList.add(`theme-${theme}`);
        }
        
        const activeBtn = document.querySelector(`[data-theme="${theme}"]`);
        if (activeBtn) {
            activeBtn.classList.add("active");
        }
        
        localStorage.setItem("selectedTheme", theme);
    }

    // Load saved theme on page load
    const savedTheme = localStorage.getItem("selectedTheme") || "default";
    applyTheme(savedTheme);

    themeButtons.forEach(button => {
        button.addEventListener("click", () => {
            const theme = button.dataset.theme;
            applyTheme(theme);
        });
    });

    // Form submission
    form.addEventListener("submit", async function(e) {
        e.preventDefault();
        
        const examNumber = document.getElementById("examNumber").value.trim();
        
        if (!examNumber) {
            showError("يرجى إدخال الرقم الامتحاني");
            return;
        }

        showLoading();
        hideResults();
        hideError();

        try {
            const response = await fetch(`https://serapi3.najah.iq/exam-result/${examNumber}`);
            
            if (!response.ok) {
                throw new Error("فشل في الحصول على النتائج");
            }

            const data = await response.json();
            currentStudentData = data;
            
            hideLoading();
            displayResults(data);
            
        } catch (error) {
            hideLoading();
            showError("حدث خطأ في الحصول على النتائج. يرجى التأكد من الرقم الامتحاني والمحاولة مرة أخرى.");
            console.error("Error:", error);
        }
    });

    // Action button events
    searchAgainBtn.addEventListener("click", function() {
        hideResults();
        hideError();
        document.getElementById("examNumber").value = "";
        document.getElementById("examNumber").focus();
        
        // Smooth scroll to top
        document.querySelector(".form").scrollIntoView({ 
            behavior: "smooth", 
            block: "center" 
        });
    });

    downloadPdfBtn.addEventListener("click", function() {
        if (currentStudentData) {
            downloadAsPDF();
        }
    });

    downloadImageBtn.addEventListener("click", function() {
        if (currentStudentData) {
            downloadAsImage();
        }
    });

    printBtn.addEventListener("click", function() {
        if (currentStudentData) {
            printResults();
        }
    });

    function showLoading() {
        btnText.style.display = "none";
        loadingSpinner.style.display = "block";
        submitBtn.disabled = true;
    }

    function hideLoading() {
        btnText.style.display = "flex";
        loadingSpinner.style.display = "none";
        submitBtn.disabled = false;
    }

    function showError(message) {
        document.getElementById("errorMessage").textContent = message;
        errorDiv.style.display = "block";
        resultsDiv.style.display = "none";
    }

    function hideError() {
        errorDiv.style.display = "none";
    }

    function hideResults() {
        resultsDiv.style.display = "none";
    }

    function displayResults(data) {
        // Display student information
        document.getElementById("studentName").textContent = data.aname || "غير محدد";
        document.getElementById("governorate").textContent = data.goV_NAME || "غير محدد";
        document.getElementById("school").textContent = data.scH_NAME || "غير محدد";
        document.getElementById("gender").textContent = data.sexcode || "غير محدد";
        
        // Display status
        const statusElement = document.getElementById("status");
        statusElement.textContent = data.stucases || "غير محدد";
        statusElement.className = "status " + (data.stucases === "ناجح" ? "success" : "fail");

        // Display grades (without corrected grade column)
        const gradesTable = document.getElementById("gradesTable");
        gradesTable.innerHTML = "";

        // Add header row
        const headerRow = document.createElement("div");
        headerRow.className = "grade-row header";
        headerRow.innerHTML = `
            <div>المادة</div>
            <div>الدرجة</div>
        `;
        gradesTable.appendChild(headerRow);

        // Add grade rows
        for (let i = 1; i <= 9; i++) {
            const subject = data[`subnamE${i}`];
            const grade = data[`suB${i}`];

            if (subject && subject.trim() !== "" && grade !== "" && grade !== "-1") {
                const gradeRow = document.createElement("div");
                gradeRow.className = "grade-row";
                
                const gradeClass = getGradeClass(parseInt(grade));
                
                gradeRow.innerHTML = `
                    <div class="subject-name">${subject}</div>
                    <div class="grade ${gradeClass}">${grade}</div>
                `;
                gradesTable.appendChild(gradeRow);
            }
        }

        // Display summary
        document.getElementById("totalGrade").textContent = data.finalgrd || "0";
        document.getElementById("percentage").textContent = (data.finalrate || "0") + "%";

        // Show results
        resultsDiv.style.display = "block";
        
        // Smooth scroll to results
        resultsDiv.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    function getGradeClass(grade) {
        if (grade >= 80) return "high";
        if (grade >= 60) return "medium";
        return "low";
    }

    // Download as PDF function
    async function downloadAsPDF() {
        try {
            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF('p', 'mm', 'a4');
            
            // Add Arabic font support (simplified)
            pdf.setFont("helvetica");
            pdf.setFontSize(16);
            
            // Header
            pdf.text("نتائج الامتحانات - وزارة التربية العراقية", 105, 20, { align: "center" });
            
            let yPosition = 40;
            
            // Student info
            pdf.setFontSize(14);
            pdf.text(`اسم الطالب: ${currentStudentData.aname}`, 20, yPosition);
            yPosition += 10;
            pdf.text(`المحافظة: ${currentStudentData.goV_NAME}`, 20, yPosition);
            yPosition += 10;
            pdf.text(`المدرسة: ${currentStudentData.scH_NAME}`, 20, yPosition);
            yPosition += 10;
            pdf.text(`الجنس: ${currentStudentData.sexcode}`, 20, yPosition);
            yPosition += 10;
            pdf.text(`النتيجة: ${currentStudentData.stucases}`, 20, yPosition);
            yPosition += 20;
            
            // Grades
            pdf.text("الدرجات:", 20, yPosition);
            yPosition += 15;
            
            for (let i = 1; i <= 9; i++) {
                const subject = currentStudentData[`subnamE${i}`];
                const grade = currentStudentData[`suB${i}`];
                
                if (subject && subject.trim() !== "" && grade !== "" && grade !== "-1") {
                    pdf.text(`${subject}: ${grade}`, 20, yPosition);
                    yPosition += 8;
                }
            }
            
            yPosition += 10;
            pdf.text(`المجموع الكلي: ${currentStudentData.finalgrd}`, 20, yPosition);
            yPosition += 8;
            pdf.text(`المعدل: ${currentStudentData.finalrate}%`, 20, yPosition);
            
            // Save PDF
            pdf.save(`نتيجة_${currentStudentData.aname}.pdf`);
            
        } catch (error) {
            console.error("Error generating PDF:", error);
            alert("حدث خطأ في تحميل ملف PDF");
        }
    }

    // Download as Image function
    async function downloadAsImage() {
        try {
            const studentCard = document.getElementById("studentInfoCard");
            const gradesSection = document.querySelector(".grades-section");
            
            // Create a container with both sections
            const container = document.createElement("div");
            container.style.background = "white";
            container.style.padding = "20px";
            container.style.fontFamily = "Cairo, sans-serif";
            container.style.direction = "rtl";
            
            // Clone and append student info
            const studentClone = studentCard.cloneNode(true);
            container.appendChild(studentClone);
            
            // Clone and append grades
            const gradesClone = gradesSection.cloneNode(true);
            container.appendChild(gradesClone);
            
            // Temporarily add to body
            document.body.appendChild(container);
            
            // Generate image
            const canvas = await html2canvas(container, {
                backgroundColor: "#ffffff",
                scale: 2,
                useCORS: true
            });
            
            // Remove temporary container
            document.body.removeChild(container);
            
            // Download image
            const link = document.createElement("a");
            link.download = `نتيجة_${currentStudentData.aname}.png`;
            link.href = canvas.toDataURL();
            link.click();
            
        } catch (error) {
            console.error("Error generating image:", error);
            alert("حدث خطأ في تحميل الصورة");
        }
    }

    // Print function
    function printResults() {
        const printWindow = window.open("", "_blank");
        const printContent = `
            <!DOCTYPE html>
            <html lang="ar" dir="rtl">
            <head>
                <meta charset="UTF-8">
                <title>نتيجة ${currentStudentData.aname}</title>
                <style>
                    body { font-family: Arial, sans-serif; direction: rtl; margin: 20px; }
                    .header { text-align: center; margin-bottom: 30px; }
                    .info-section { margin-bottom: 20px; }
                    .grades-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                    .grades-table th, .grades-table td { border: 1px solid #ddd; padding: 8px; text-align: center; }
                    .grades-table th { background-color: #f2f2f2; }
                    .summary { margin-top: 20px; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>نتائج الامتحانات - وزارة التربية العراقية</h1>
                    <h2>نتائج الدراسة المتوسطة للعام الدراسي 2025/2024</h2>
                </div>
                
                <div class="info-section">
                    <h3>معلومات الطالب</h3>
                    <p><strong>الاسم:</strong> ${currentStudentData.aname}</p>
                    <p><strong>المحافظة:</strong> ${currentStudentData.goV_NAME}</p>
                    <p><strong>المدرسة:</strong> ${currentStudentData.scH_NAME}</p>
                    <p><strong>الجنس:</strong> ${currentStudentData.sexcode}</p>
                    <p><strong>النتيجة:</strong> ${currentStudentData.stucases}</p>
                </div>
                
                <div class="grades-section">
                    <h3>الدرجات</h3>
                    <table class="grades-table">
                        <thead>
                            <tr>
                                <th>المادة</th>
                                <th>الدرجة</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${generateGradesTableRows()}
                        </tbody>
                    </table>
                </div>
                
                <div class="summary">
                    <p><strong>المجموع الكلي:</strong> ${currentStudentData.finalgrd}</p>
                    <p><strong>المعدل:</strong> ${currentStudentData.finalrate}%</p>
                </div>
            </body>
            </html>
        `;
        
        printWindow.document.write(printContent);
        printWindow.document.close();
        printWindow.print();
    }

    function generateGradesTableRows() {
        let rows = "";
        for (let i = 1; i <= 9; i++) {
            const subject = currentStudentData[`subnamE${i}`];
            const grade = currentStudentData[`suB${i}`];
            
            if (subject && subject.trim() !== "" && grade !== "" && grade !== "-1") {
                rows += `<tr><td>${subject}</td><td>${grade}</td></tr>`;
            }
        }
        return rows;
    }

    // Social media sharing functions
    window.shareWhatsApp = function() {
        if (currentStudentData) {
            const message = `نتيجة ${currentStudentData.aname}:\nالمجموع: ${currentStudentData.finalgrd}\nالمعدل: ${currentStudentData.finalrate}%\nالنتيجة: ${currentStudentData.stucases}`;
            const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
            window.open(url, "_blank");
        } else {
            const message = "موقع نتائج الامتحانات - وزارة التربية العراقية";
            const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
            window.open(url, "_blank");
        }
    };

    window.shareTelegram = function() {
        if (currentStudentData) {
            const message = `نتيجة ${currentStudentData.aname}:\nالمجموع: ${currentStudentData.finalgrd}\nالمعدل: ${currentStudentData.finalrate}%\nالنتيجة: ${currentStudentData.stucases}`;
            const url = `https://t.me/share/url?text=${encodeURIComponent(message)}`;
            window.open(url, "_blank");
        } else {
            const message = "موقع نتائج الامتحانات - وزارة التربية العراقية";
            const url = `https://t.me/share/url?text=${encodeURIComponent(message)}`;
            window.open(url, "_blank");
        }
    };

    // Input validation
    document.getElementById("examNumber").addEventListener("input", function(e) {
        e.target.value = e.target.value.replace(/[^0-9]/g, "");
    });

    // Enter key support
    document.getElementById("examNumber").addEventListener("keypress", function(e) {
        if (e.key === "Enter") {
            form.dispatchEvent(new Event("submit"));
        }
    });

    // Add smooth animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: "0px 0px -50px 0px"
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = "1";
                entry.target.style.transform = "translateY(0)";
            }
        });
    }, observerOptions);

    // Observe elements for animation
    document.querySelectorAll(".grade-row, .info-item, .summary-item").forEach(el => {
        el.style.opacity = "0";
        el.style.transform = "translateY(20px)";
        el.style.transition = "all 0.6s ease";
        observer.observe(el);
    });
});

