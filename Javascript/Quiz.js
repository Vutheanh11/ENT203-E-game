let mathTimer;
let timeLeft = 30;
let currentAnswer = 0;

export function startMathQuiz(successCallback, failureCallback) {
    const modal = document.getElementById('math-modal');
    const questionEl = document.getElementById('math-question');
    const timerEl = document.getElementById('timer-display');
    const inputEl = document.getElementById('math-answer');
    const submitBtn = document.getElementById('submit-answer');
    
    modal.classList.remove('hidden');
    inputEl.value = '';
    inputEl.focus();
    
    // Generate Question
    const operators = ['+', '-', '*', '/'];
    const operator = operators[Math.floor(Math.random() * operators.length)];
    let a, b;

    switch(operator) {
        case '+':
            a = Math.floor(Math.random() * 50) + 1;
            b = Math.floor(Math.random() * 50) + 1;
            currentAnswer = a + b;
            break;
        case '-':
            a = Math.floor(Math.random() * 50) + 20;
            b = Math.floor(Math.random() * a); // Ensure positive result
            currentAnswer = a - b;
            break;
        case '*':
            a = Math.floor(Math.random() * 12) + 1;
            b = Math.floor(Math.random() * 12) + 1;
            currentAnswer = a * b;
            break;
        case '/':
            b = Math.floor(Math.random() * 10) + 2;
            currentAnswer = Math.floor(Math.random() * 10) + 1;
            a = b * currentAnswer; // Ensure clean division
            break;
    }

    questionEl.textContent = `${a} ${operator} ${b} = ?`;

    // Start Timer
    timeLeft = 30;
    timerEl.textContent = `${timeLeft}s`;
    
    if (mathTimer) clearInterval(mathTimer);
    mathTimer = setInterval(() => {
        timeLeft--;
        timerEl.textContent = `${timeLeft}s`;
        if (timeLeft <= 0) {
            clearInterval(mathTimer);
            endMathQuiz(false, successCallback, failureCallback);
        }
    }, 1000);

    // Event Listeners (Need to be careful not to add multiple listeners)
    // A cleaner way is to assign onclick directly or manage listeners externally.
    // For simplicity here, we'll use a one-off handler wrapper or just replace the element to clear listeners.
    // But replacing element is heavy. Let's just use a named function and remove it?
    // Or just assign `onclick` property which overwrites previous one.
    
    submitBtn.onclick = () => checkAnswer(successCallback, failureCallback);
    
    // For Enter key, we need to be careful.
    inputEl.onkeypress = (e) => {
        if (e.key === 'Enter') checkAnswer(successCallback, failureCallback);
    };
}

function checkAnswer(successCallback, failureCallback) {
    const input = parseInt(document.getElementById('math-answer').value);
    if (input === currentAnswer) {
        endMathQuiz(true, successCallback, failureCallback);
    } else {
        endMathQuiz(false, successCallback, failureCallback);
    }
}

function endMathQuiz(success, successCallback, failureCallback) {
    clearInterval(mathTimer);
    document.getElementById('math-modal').classList.add('hidden');
    
    // Clear handlers
    document.getElementById('submit-answer').onclick = null;
    document.getElementById('math-answer').onkeypress = null;

    if (success) {
        successCallback();
    } else {
        alert("Time's up or Wrong Answer! No upgrade for you.");
        failureCallback();
    }
}
