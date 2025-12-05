let mathTimer;
let timeLeft = 60;
let currentAnswer = "";

const quizData = [
    // I. Vocabulary
    { q: "I usually buy ________ before I enter the hall.", a: "ticket" },
    { q: "My favorite type of film is an ________.", a: "action movie" },
    { q: "We watched the ________ of the new Spider-Man movie.", a: "trailer" },
    { q: "Let’s go to the ________ tonight!", a: "cinema" }, // or movie theater
    { q: "I always eat ________ when watching a movie.", a: "popcorn" },
    { q: "The new ________ near my house is very big.", a: "movie theater" }, // or cinema

    // II. Grammar – Present Continuous for Future
    { q: "We ________ (go) to the movies tonight.", a: "are going" },
    { q: "She ________ (buy) tickets for the 7 PM show.", a: "is buying" },
    { q: "They ________ (meet) us at the cinema later.", a: "are meeting" },
    { q: "I ________ (bring) some snacks.", a: "am bringing" },

    // III. Reading
    { q: "What type of movie are Anna and her friends going to watch?", a: "comedy" },
    { q: "Why is Anna buying the tickets online?", a: "cheaper" },
    { q: "What time do they meet?", a: "6:30 PM" },
    { q: "What will they do after the movie?", a: "go to a café" },

    // Multiple Choice (Simplified for text input, or just asking for the letter/word)
    // Let's adapt these to fill-in-the-blank or direct questions for simplicity in this UI
    { q: "We need to be at the cinema ____ 7:30. (at/in/on)", a: "at" },
    { q: "The movie was so exciting ____ everyone loved it. (because/that)", a: "that" },
    { q: "I usually check the movie ____ to see what is showing. (menu/schedule)", a: "schedule" },
    { q: "The seats here are more comfortable ____ the old one. (than/then)", a: "than" },
    { q: "She didn’t go ____ she was sick. (because/so)", a: "because" },

    // VII. Conversation
    { q: "What ____ are we going to watch tonight?", a: "movie" },
    { q: "I heard it’s very ____.", a: "funny" },
    { q: "Did you buy the ____ already?", a: "tickets" },
    { q: "Yes, I also chose good ____.", a: "seats" },
    { q: "I’ll buy some ____ before we go in.", a: "popcorn" },
    { q: "I’m excited about ____ it!", a: "watching" },

    // VIII. Going to / Will
    { q: "We ____ (watch) a horror movie tonight. (use going to)", a: "are going to watch" },
    { q: "I think you ____ (love) this film. (use will)", a: "will love" },
    { q: "They ____ (buy) tickets online. (use going to)", a: "are going to buy" },
    { q: "It’s raining, so I ____ (take) an umbrella. (use will)", a: "will take" },
    { q: "My friends and I ____ (meet) at 6 PM. (use going to)", a: "are going to meet" },

    // Extra Grammar
    { q: "We might ____ (stay) an extra day. (stay/staying)", a: "stay" },
    { q: "It’s very cloudy. It ____ rain this afternoon. (is going to/will)", a: "is going to" },
    { q: "Look at that black cloud! It ____ rain! (is going to/might)", a: "is going to" },

    // Unit 2
    { q: "A short trip on Saturday and Sunday is a ____.", a: "weekend getaway" },
    { q: "If you want peace, you prefer a trip that’s ____.", a: "relaxing" },
    { q: "A trip where you learn history is ____.", a: "educational" },
    { q: "I’d rather stay in a hotel ____ go camping.", a: "than" },
    { q: "She prefers ____ (go) on vacation in the mountains.", a: "to go" },
    { q: "I’d rather ____ (stay) home than go to a crowded beach.", a: "stay" },
    { q: "I ___ stay in a five-star hotel than a cheap hostel. (prefer/'d rather)", a: "'d rather" }, // or 'd rather
    { q: "She ___ to take a cruise next summer. (prefers/'d prefer)", a: "'d prefer" }, // or prefers
    { q: "You ___ book the hotel now. ('d rather/'d better)", a: "'d better" },
    { q: "Have you decided? Yes, we ____ to Hawaii next month. (are going/will go)", a: "are going" },
    { q: "I forgot to book! Don't worry, I ____ it right now. (will do/am going to do)", a: "will do" }
];

export function startMathQuiz(successCallback, failureCallback) {
    const modal = document.getElementById('math-modal');
    const questionEl = document.getElementById('math-question');
    const timerEl = document.getElementById('timer-display');
    const inputEl = document.getElementById('math-answer');
    const submitBtn = document.getElementById('submit-answer');
    
    // Update Modal Title for English Quiz
    modal.querySelector('h2').textContent = "English Challenge!";
    modal.querySelector('p').textContent = "Answer correctly to get an upgrade!";
    inputEl.type = "text"; // Change input to text
    inputEl.placeholder = "Answer...";

    modal.classList.remove('hidden');
    inputEl.value = '';
    inputEl.focus();
    
    // Pick Random Question
    const randomQ = quizData[Math.floor(Math.random() * quizData.length)];
    currentAnswer = randomQ.a.toLowerCase(); // Store answer in lowercase for comparison
    
    questionEl.textContent = randomQ.q;

    // Start Timer (60s)
    timeLeft = 60;
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

    submitBtn.onclick = () => checkAnswer(successCallback, failureCallback);
    
    inputEl.onkeypress = (e) => {
        if (e.key === 'Enter') checkAnswer(successCallback, failureCallback);
    };
}

function checkAnswer(successCallback, failureCallback) {
    const input = document.getElementById('math-answer').value.trim().toLowerCase();
    
    // Simple check: exact match or contains the key phrase if it's long
    // For strictness, let's require exact match or allow some flexibility if needed.
    // Given the specific answers, exact match (trimmed) is best.
    
    // Handle multiple valid answers (e.g., "cinema / movie theater")
    // If currentAnswer contains "/", split and check
    
    let isCorrect = false;
    if (currentAnswer.includes('/')) {
        const possibleAnswers = currentAnswer.split('/').map(s => s.trim());
        if (possibleAnswers.includes(input)) isCorrect = true;
    } else {
        if (input === currentAnswer) isCorrect = true;
    }

    // Special case for "A comedy" vs "comedy"
    if (!isCorrect && currentAnswer.includes(input) && input.length > 3) {
         // Allow partial if it makes sense, but let's stick to strict for now unless user complains.
         // Actually, let's allow if the input is the main keyword.
         // e.g. Answer: "are going to watch", Input: "going to watch" -> maybe?
         // Let's keep it strict for now based on the provided key.
    }

    if (isCorrect) {
        endMathQuiz(true, successCallback, failureCallback);
    } else {
        // Show correct answer on failure?
        alert(`Wrong! The correct answer was: ${currentAnswer}`);
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
