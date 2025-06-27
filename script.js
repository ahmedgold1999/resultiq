document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('examForm');
    const resultsDiv = document.getElementById('results');
    const errorDiv = document.getElementById('error');
    const submitBtn = document.querySelector('.submit-btn');
    const btnText = document.querySelector('.btn-text');
    const loadingSpinner = document.querySelector('.loading-spinner');

    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const examNumber = document.getElementById('examNumber').value.trim();
        
        if (!examNumber) {
            showError('يرجى إدخال الرقم الامتحاني');
            return;
        }

        // Show loading state
        showLoading();
        hideResults();
        hideError();

        try {
            // Make API call
            const response = await fetch(`https://serapi3.najah.iq/exam-result/${examNumber}`);
            
            if (!response.ok) {
                throw new Error('فشل في الحصول على النتائج');
            }

            const data = await response.json();
            
            // Hide loading and show results
            hideLoading();
            displayResults(data);
            
        } catch (error) {
            hideLoading();
            showError('حدث خطأ في الحصول على النتائج. يرجى التأكد من الرقم الامتحاني والمحاولة مرة أخرى.');
            console.error('Error:', error);
        }
    });

    function showLoading() {
        btnText.style.display = 'none';
        loadingSpinner.style.display = 'block';
        submitBtn.disabled = true;
    }

    function hideLoading() {
        btnText.style.display = 'block';
        loadingSpinner.style.display = 'none';
        submitBtn.disabled = false;
    }

    function showError(message) {
        document.getElementById('errorMessage').textContent = message;
        errorDiv.style.display = 'block';
        resultsDiv.style.display = 'none';
    }

    function hideError() {
        errorDiv.style.display = 'none';
    }

    function hideResults() {
        resultsDiv.style.display = 'none';
    }

    function displayResults(data) {
        // Display student information
        document.getElementById('studentName').textContent = data.aname || 'غير محدد';
        document.getElementById('governorate').textContent = data.goV_NAME || 'غير محدد';
        document.getElementById('school').textContent = data.scH_NAME || 'غير محدد';
        document.getElementById('gender').textContent = data.sexcode || 'غير محدد';
        
        // Display status
        const statusElement = document.getElementById('status');
        statusElement.textContent = data.stucases || 'غير محدد';
        statusElement.className = 'status ' + (data.stucases === 'ناجح' ? 'success' : 'fail');

        // Display grades
        const gradesTable = document.getElementById('gradesTable');
        gradesTable.innerHTML = '';

        // Add header row
        const headerRow = document.createElement('div');
        headerRow.className = 'grade-row header';
        headerRow.innerHTML = `
            <div>المادة</div>
            <div>الدرجة</div>
            <div>الدرجة المصححة</div>
        `;
        gradesTable.appendChild(headerRow);

        // Add grade rows
        for (let i = 1; i <= 9; i++) {
            const subject = data[`subnamE${i}`];
            const grade = data[`suB${i}`];
            const correctedGrade = data[`csuB${i}`];

            if (subject && subject.trim() !== '' && grade !== '' && correctedGrade !== '-1') {
                const gradeRow = document.createElement('div');
                gradeRow.className = 'grade-row';
                
                const gradeClass = getGradeClass(parseInt(grade));
                const correctedGradeClass = getGradeClass(parseInt(correctedGrade));
                
                gradeRow.innerHTML = `
                    <div class="subject-name">${subject}</div>
                    <div class="grade ${gradeClass}">${grade}</div>
                    <div class="grade ${correctedGradeClass}">${correctedGrade}</div>
                `;
                gradesTable.appendChild(gradeRow);
            }
        }

        // Display summary
        document.getElementById('totalGrade').textContent = data.finalgrd || '0';
        document.getElementById('percentage').textContent = (data.finalrate || '0') + '%';

        // Show results
        resultsDiv.style.display = 'block';
        
        // Smooth scroll to results
        resultsDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function getGradeClass(grade) {
        if (grade >= 80) return 'high';
        if (grade >= 60) return 'medium';
        return 'low';
    }

    // Add input validation
    document.getElementById('examNumber').addEventListener('input', function(e) {
        // Remove any non-numeric characters
        e.target.value = e.target.value.replace(/[^0-9]/g, '');
    });

    // Add enter key support
    document.getElementById('examNumber').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            form.dispatchEvent(new Event('submit'));
        }
    });
});

