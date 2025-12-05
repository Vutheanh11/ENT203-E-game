document.addEventListener('DOMContentLoaded', () => {
    const tableBody = document.getElementById('scores-body');

    function renderScores(scores) {
        tableBody.innerHTML = '';
        
        if (scores.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="4" style="text-align:center;">No scores yet!</td></tr>';
            return;
        }

        scores.forEach((entry, index) => {
            const row = document.createElement('tr');
            
            // Rank styling with medals for top 3
            let rankClass = '';
            let rankDisplay = `#${index + 1}`;
            if (index === 0) {
                rankClass = 'rank-1';
                rankDisplay = '🥇 #1';
            } else if (index === 1) {
                rankClass = 'rank-2';
                rankDisplay = '🥈 #2';
            } else if (index === 2) {
                rankClass = 'rank-3';
                rankDisplay = '🥉 #3';
            }

            row.innerHTML = `
                <td class="${rankClass}">${rankDisplay}</td>
                <td class="${rankClass}">${entry.name}</td>
                <td class="${rankClass}">${entry.score.toLocaleString()}</td>
                <td>${entry.level}</td>
            `;
            tableBody.appendChild(row);
        });
    }

    // Fetch scores from backend API (top 20 for leaderboard)
    fetch('/api/getAllScores')
        .then(res => {
            if (!res.ok) {
                throw new Error('Network response was not ok');
            }
            return res.json();
        })
        .then(data => renderScores(data))
        .catch(err => {
            console.error("Failed to fetch scores:", err);
            tableBody.innerHTML = '<tr><td colspan="4" style="text-align:center; color: #ff4444;">Failed to load scores. Backend API not available.</td></tr>';
        });
});
