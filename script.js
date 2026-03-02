let questions = [];
let currentQuiz = null;
let currentResults = null;

// פונקציות אבטחה
function sanitizeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function validateInput(input, maxLength = 200) {
    if (typeof input !== 'string') return '';
    return sanitizeHTML(input.trim().substring(0, maxLength));
}

function validateQuizData(data) {
    if (!data || typeof data !== 'object') return false;
    if (!data.creator || typeof data.creator !== 'string') return false;
    if (!Array.isArray(data.questions) || data.questions.length < 5 || data.questions.length > 20) return false;
    
    for (let q of data.questions) {
        if (!q.question || typeof q.question !== 'string') return false;
        if (!Array.isArray(q.options) || q.options.length !== 4) return false;
        if (typeof q.correctAnswer !== 'number' || q.correctAnswer < 0 || q.correctAnswer > 3) return false;
        
        for (let opt of q.options) {
            if (!opt || typeof opt !== 'string') return false;
        }
    }
    
    return true;
}

// טעינה ראשונית
window.onload = function() {
    const urlParams = new URLSearchParams(window.location.search);
    const quizData = urlParams.get('quiz');
    
    if (quizData) {
        loadQuizFromURL(quizData);
    } else {
        showSection('createQuiz');
        // מתחילים עם 5 שאלות
        for (let i = 0; i < 5; i++) {
            addQuestion();
        }
    }
};

function showSection(sectionId) {
    document.querySelectorAll('.section').forEach(section => {
        section.classList.add('hidden');
    });
    document.getElementById(sectionId).classList.remove('hidden');
}

function addQuestion() {
    const questionNum = questions.length + 1;
    const questionId = 'q' + Date.now();
    
    questions.push({
        id: questionId,
        question: '',
        options: ['', '', '', ''],
        correctAnswer: 0
    });
    
    const container = document.getElementById('questionsContainer');
    const questionCard = document.createElement('div');
    questionCard.className = 'question-card';
    questionCard.id = questionId;
    questionCard.innerHTML = `
        <div class="question-header">
            <span class="question-number">שאלה ${questionNum}</span>
            ${questions.length > 5 ? `<button class="btn-remove" onclick="removeQuestion('${questionId}')">🗑️ מחק</button>` : ''}
        </div>
        <div class="form-group">
            <label>השאלה:</label>
            <input type="text" class="question-input" placeholder="לדוגמה: מה הצבע האהוב עליי?" onchange="updateQuestion('${questionId}', 'question', this.value)">
        </div>
        <div class="form-group">
            <label>תשובות אפשריות (סמן את התשובה הנכונה):</label>
            <div style="margin-top: 10px;">
                <div style="display: flex; align-items: center; margin-bottom: 8px;">
                    <input type="radio" name="${questionId}_correct" value="0" onchange="updateQuestion('${questionId}', 'correctAnswer', 0)" style="width: auto; margin-left: 10px;">
                    <input type="text" placeholder="תשובה 1" onchange="updateQuestionOption('${questionId}', 0, this.value)" style="flex: 1;">
                </div>
                <div style="display: flex; align-items: center; margin-bottom: 8px;">
                    <input type="radio" name="${questionId}_correct" value="1" onchange="updateQuestion('${questionId}', 'correctAnswer', 1)" style="width: auto; margin-left: 10px;">
                    <input type="text" placeholder="תשובה 2" onchange="updateQuestionOption('${questionId}', 1, this.value)" style="flex: 1;">
                </div>
                <div style="display: flex; align-items: center; margin-bottom: 8px;">
                    <input type="radio" name="${questionId}_correct" value="2" onchange="updateQuestion('${questionId}', 'correctAnswer', 2)" style="width: auto; margin-left: 10px;">
                    <input type="text" placeholder="תשובה 3" onchange="updateQuestionOption('${questionId}', 2, this.value)" style="flex: 1;">
                </div>
                <div style="display: flex; align-items: center; margin-bottom: 8px;">
                    <input type="radio" name="${questionId}_correct" value="3" onchange="updateQuestion('${questionId}', 'correctAnswer', 3)" style="width: auto; margin-left: 10px;">
                    <input type="text" placeholder="תשובה 4" onchange="updateQuestionOption('${questionId}', 3, this.value)" style="flex: 1;">
                </div>
            </div>
        </div>
    `;
    
    container.appendChild(questionCard);
}

function removeQuestion(questionId) {
    questions = questions.filter(q => q.id !== questionId);
    document.getElementById(questionId).remove();
    updateQuestionNumbers();
}

function updateQuestionNumbers() {
    const cards = document.querySelectorAll('.question-card');
    cards.forEach((card, index) => {
        const numberSpan = card.querySelector('.question-number');
        numberSpan.textContent = `שאלה ${index + 1}`;
    });
}

function updateQuestion(questionId, field, value) {
    const question = questions.find(q => q.id === questionId);
    if (question) {
        if (field === 'question') {
            question[field] = validateInput(value, 150);
        } else {
            question[field] = value;
        }
    }
}

function updateQuestionOption(questionId, optionIndex, value) {
    const question = questions.find(q => q.id === questionId);
    if (question && optionIndex >= 0 && optionIndex < 4) {
        question.options[optionIndex] = validateInput(value, 100);
    }
}

function generateQuiz() {
    const creatorName = validateInput(document.getElementById('creatorName').value, 50);
    
    if (!creatorName) {
        alert('אנא הכנס את שמך');
        return;
    }
    
    const validQuestions = questions.filter(q => {
        return q.question && q.options.every(opt => opt.trim() !== '');
    });
    
    if (validQuestions.length < 5) {
        alert('אנא מלא את כל 5 השאלות עם 4 תשובות לכל שאלה');
        return;
    }
    
    if (validQuestions.length > 20) {
        alert('מקסימום 20 שאלות');
        return;
    }
    
    // בדיקה שסימנו תשובה נכונה לכל שאלה
    for (let q of validQuestions) {
        if (q.correctAnswer === undefined || q.correctAnswer === null) {
            alert('אנא סמן תשובה נכונה לכל שאלה');
            return;
        }
    }
    
    // ניקוי נתונים
    const cleanQuestions = validQuestions.map(q => ({
        question: validateInput(q.question, 150),
        options: q.options.map(opt => validateInput(opt, 100)),
        correctAnswer: parseInt(q.correctAnswer)
    }));
    
    const quizData = {
        creator: creatorName,
        questions: cleanQuestions,
        results: []
    };
    
    try {
        const encoded = btoa(encodeURIComponent(JSON.stringify(quizData)));
        
        // בדיקת גודל URL
        if (encoded.length > 8000) {
            alert('השאלון ארוך מדי. נסה לקצר את השאלות והתשובות');
            return;
        }
        
        const shareUrl = window.location.origin + window.location.pathname + '?quiz=' + encoded;
        
        document.getElementById('shareLink').value = shareUrl;
        showSection('shareQuiz');
        
        // שמירה ב-localStorage
        try {
            localStorage.setItem('currentQuiz', JSON.stringify(quizData));
        } catch (e) {
            console.warn('לא ניתן לשמור ב-localStorage');
        }
    } catch (e) {
        alert('שגיאה ביצירת השאלון. נסה שוב');
    }
}

function copyLink() {
    const shareLink = document.getElementById('shareLink');
    
    // שימוש ב-Clipboard API המודרני
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(shareLink.value)
            .then(() => alert('הקישור הועתק! 📋'))
            .catch(() => {
                // fallback
                shareLink.select();
                try {
                    document.execCommand('copy');
                    alert('הקישור הועתק! 📋');
                } catch (e) {
                    alert('לא ניתן להעתיק. העתק ידנית');
                }
            });
    } else {
        // fallback לדפדפנים ישנים
        shareLink.select();
        try {
            document.execCommand('copy');
            alert('הקישור הועתק! 📋');
        } catch (e) {
            alert('לא ניתן להעתיק. העתק ידנית');
        }
    }
}

function loadQuizFromURL(encodedData) {
    try {
        // בדיקת גודל
        if (encodedData.length > 10000) {
            throw new Error('נתונים גדולים מדי');
        }
        
        const decoded = JSON.parse(decodeURIComponent(atob(encodedData)));
        
        // אימות מבנה הנתונים
        if (!validateQuizData(decoded)) {
            throw new Error('נתונים לא תקינים');
        }
        
        // ניקוי נתונים
        currentQuiz = {
            creator: validateInput(decoded.creator, 50),
            questions: decoded.questions.map(q => ({
                question: validateInput(q.question, 150),
                options: q.options.map(opt => validateInput(opt, 100)),
                correctAnswer: parseInt(q.correctAnswer)
            })),
            results: Array.isArray(decoded.results) ? decoded.results : []
        };
        
        displayQuiz();
    } catch (e) {
        alert('שגיאה בטעינת השאלון - הקישור לא תקין');
        showSection('createQuiz');
        for (let i = 0; i < 5; i++) {
            addQuestion();
        }
    }
}

function displayQuiz() {
    const titleElement = document.getElementById('quizTitle');
    titleElement.textContent = `השאלון של ${currentQuiz.creator}`;
    
    const container = document.getElementById('quizQuestions');
    container.innerHTML = '';
    
    currentQuiz.questions.forEach((q, index) => {
        const questionCard = document.createElement('div');
        questionCard.className = 'question-card';
        
        const questionNumber = document.createElement('div');
        questionNumber.className = 'question-number';
        questionNumber.textContent = `שאלה ${index + 1}`;
        
        const formGroup = document.createElement('div');
        formGroup.className = 'form-group';
        
        const questionLabel = document.createElement('label');
        questionLabel.style.marginBottom = '15px';
        questionLabel.style.display = 'block';
        questionLabel.style.fontSize = '1.1em';
        questionLabel.textContent = q.question;
        
        formGroup.appendChild(questionLabel);
        
        q.options.forEach((option, optIndex) => {
            const optionDiv = document.createElement('div');
            optionDiv.style.marginBottom = '10px';
            
            const label = document.createElement('label');
            label.style.display = 'flex';
            label.style.alignItems = 'center';
            label.style.cursor = 'pointer';
            label.style.padding = '10px';
            label.style.background = 'white';
            label.style.borderRadius = '8px';
            label.style.border = '2px solid #e0e0e0';
            label.style.transition = 'all 0.3s';
            
            const radio = document.createElement('input');
            radio.type = 'radio';
            radio.name = `answer_${index}`;
            radio.value = optIndex;
            radio.style.width = 'auto';
            radio.style.marginLeft = '10px';
            
            const span = document.createElement('span');
            span.style.flex = '1';
            span.textContent = option;
            
            label.appendChild(radio);
            label.appendChild(span);
            optionDiv.appendChild(label);
            formGroup.appendChild(optionDiv);
        });
        
        questionCard.appendChild(questionNumber);
        questionCard.appendChild(formGroup);
        container.appendChild(questionCard);
    });
    
    showSection('takeQuiz');
}

function submitQuiz() {
    const participantName = validateInput(document.getElementById('participantName').value, 50);
    
    if (!participantName) {
        alert('אנא הכנס את שמך');
        return;
    }
    
    // בדיקה שענו על כל השאלות
    for (let i = 0; i < currentQuiz.questions.length; i++) {
        const selected = document.querySelector(`input[name="answer_${i}"]:checked`);
        if (!selected) {
            alert('אנא ענה על כל השאלות');
            return;
        }
    }
    
    let score = 0;
    const answers = [];
    
    currentQuiz.questions.forEach((q, index) => {
        const selectedOption = document.querySelector(`input[name="answer_${index}"]:checked`);
        const userAnswerIndex = selectedOption ? parseInt(selectedOption.value) : -1;
        const isCorrect = userAnswerIndex === q.correctAnswer;
        
        if (isCorrect) score++;
        
        answers.push({
            question: q.question,
            userAnswer: userAnswerIndex >= 0 ? q.options[userAnswerIndex] : 'לא נענתה',
            correctAnswer: q.options[q.correctAnswer],
            isCorrect: isCorrect
        });
    });
    
    currentResults = {
        name: participantName,
        score: score,
        total: currentQuiz.questions.length,
        answers: answers
    };
    
    // שמירת התוצאות
    if (!currentQuiz.results) currentQuiz.results = [];
    
    // הגבלת מספר תוצאות
    if (currentQuiz.results.length >= 100) {
        currentQuiz.results = currentQuiz.results.slice(-99);
    }
    
    currentQuiz.results.push({
        name: participantName,
        score: score,
        total: currentQuiz.questions.length,
        timestamp: new Date().toISOString()
    });
    
    try {
        localStorage.setItem('currentQuiz', JSON.stringify(currentQuiz));
    } catch (e) {
        console.warn('לא ניתן לשמור תוצאות');
    }
    
    displayResults();
}

function displayResults() {
    const percentage = Math.round((currentResults.score / currentResults.total) * 100);
    document.getElementById('scoreText').textContent = `${percentage}%`;
    
    let message = '';
    if (percentage >= 90) message = '🌟 מדהים! אתה מכיר אותי מעולה!';
    else if (percentage >= 70) message = '👍 יפה מאוד! אתה מכיר אותי טוב!';
    else if (percentage >= 50) message = '😊 לא רע! יש לך ידע בסיסי';
    else message = '🤔 נראה שצריך להכיר יותר...';
    
    document.getElementById('scoreMessage').textContent = message;
    
    const reviewContainer = document.getElementById('answersReview');
    reviewContainer.innerHTML = '';
    
    const title = document.createElement('h3');
    title.textContent = 'סקירת התשובות:';
    reviewContainer.appendChild(title);
    
    currentResults.answers.forEach((answer, index) => {
        const answerDiv = document.createElement('div');
        answerDiv.className = `answer-review ${answer.isCorrect ? 'correct' : 'incorrect'}`;
        
        const questionText = document.createElement('strong');
        questionText.textContent = `שאלה ${index + 1}: `;
        answerDiv.appendChild(questionText);
        
        const questionContent = document.createTextNode(answer.question);
        answerDiv.appendChild(questionContent);
        answerDiv.appendChild(document.createElement('br'));
        
        const userAnswerLabel = document.createElement('strong');
        userAnswerLabel.textContent = 'התשובה שלך: ';
        answerDiv.appendChild(userAnswerLabel);
        
        const userAnswerText = document.createTextNode(answer.userAnswer || '(לא ענית)');
        answerDiv.appendChild(userAnswerText);
        answerDiv.appendChild(document.createElement('br'));
        
        if (!answer.isCorrect) {
            const correctLabel = document.createElement('strong');
            correctLabel.textContent = 'התשובה הנכונה: ';
            answerDiv.appendChild(correctLabel);
            
            const correctText = document.createTextNode(answer.correctAnswer);
            answerDiv.appendChild(correctText);
            answerDiv.appendChild(document.createElement('br'));
        }
        
        const resultLabel = document.createElement('strong');
        resultLabel.textContent = answer.isCorrect ? '✅ נכון!' : '❌ לא נכון';
        answerDiv.appendChild(resultLabel);
        
        reviewContainer.appendChild(answerDiv);
    });
    
    showSection('results');
}

function viewLeaderboard() {
    const leaderboardList = document.getElementById('leaderboardList');
    leaderboardList.innerHTML = '';
    
    if (!currentQuiz.results || currentQuiz.results.length === 0) {
        const emptyMsg = document.createElement('p');
        emptyMsg.textContent = 'עדיין אין תוצאות אחרות';
        leaderboardList.appendChild(emptyMsg);
    } else {
        const sorted = [...currentQuiz.results].sort((a, b) => b.score - a.score);
        
        sorted.forEach((result, index) => {
            const item = document.createElement('div');
            item.className = 'leaderboard-item';
            
            const rank = document.createElement('span');
            rank.className = 'leaderboard-rank';
            rank.textContent = `#${index + 1}`;
            
            const name = document.createElement('span');
            name.className = 'leaderboard-name';
            name.textContent = validateInput(result.name, 50);
            
            const percentage = Math.round((result.score / result.total) * 100);
            const score = document.createElement('span');
            score.className = 'leaderboard-score';
            score.textContent = `${percentage}% (${result.score}/${result.total})`;
            
            item.appendChild(rank);
            item.appendChild(name);
            item.appendChild(score);
            leaderboardList.appendChild(item);
        });
    }
    
    showSection('leaderboard');
}

function backToResults() {
    showSection('results');
}

function resetQuiz() {
    questions = [];
    currentQuiz = null;
    currentResults = null;
    document.getElementById('questionsContainer').innerHTML = '';
    document.getElementById('creatorName').value = '';
    window.history.pushState({}, '', window.location.pathname);
    showSection('createQuiz');
    // מתחילים עם 5 שאלות
    for (let i = 0; i < 5; i++) {
        addQuestion();
    }
}
