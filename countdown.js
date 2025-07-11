// ✅ Your original anniversary date:
const startYear = 2024;
const anniversaryMonth = 10; // November (0-indexed)
const anniversaryDay = 11;

// Helper to turn 1 -> 1st, 2 -> 2nd, 3 -> 3rd, etc.
function ordinal(n) {
    const suffixes = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return n + (suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0]);
}

function updateAllCounters() {
    const now = new Date();

    // --- Anniversary Countdown ---
    let currentYear = now.getFullYear();
    let nextAnniversary = new Date(currentYear, anniversaryMonth, anniversaryDay, 0, 0, 0);

    if (now > nextAnniversary) {
        currentYear++;
        nextAnniversary = new Date(currentYear, anniversaryMonth, anniversaryDay, 0, 0, 0);
    }

    const anniversaryNumber = currentYear - startYear;
    const diffAnniversary = nextAnniversary - now;

    const daysAnniversary = Math.floor(diffAnniversary / (1000 * 60 * 60 * 24));
    const hoursAnniversary = Math.floor((diffAnniversary / (1000 * 60 * 60)) % 24);
    const minutesAnniversary = Math.floor((diffAnniversary / (1000 * 60)) % 60);
    const secondsAnniversary = Math.floor((diffAnniversary / 1000) % 60);

    const countdownTimerElement = document.getElementById("countdown_timer");
    if (countdownTimerElement) {
        countdownTimerElement.innerHTML =
            `Our ${ordinal(anniversaryNumber)} Anniversary is in <br>${daysAnniversary}d ${hoursAnniversary}h ${minutesAnniversary}m ${secondsAnniversary}s`;
    }

    // --- Days Together ---
    const startDate = new Date(startYear, anniversaryMonth, anniversaryDay);
    const daysTogether = Math.floor((now - startDate) / (1000 * 60 * 60 * 24));
    const daysTogetherElement = document.getElementById("days_together");
    if (daysTogetherElement) {
        daysTogetherElement.innerHTML =
            `We've been together for <br>${daysTogether} days! ❤️`;
    }

    // --- Next Monthly Anniversary ---
    let nextMonthlyAnniversary = new Date(now.getFullYear(), now.getMonth(), anniversaryDay);
    // If the current day is past the anniversary day of the current month, move to next month
    if (now.getDate() > anniversaryDay) {
        nextMonthlyAnniversary.setMonth(nextMonthlyAnniversary.getMonth() + 1);
    }
    // Handle cases where anniversaryDay might not exist in the next month (e.g., Feb 30th)
    // By setting to day 0 of the next month, it automatically goes to the last day of the current month
    if (nextMonthlyAnniversary.getDate() !== anniversaryDay && anniversaryDay > 28) { // Only adjust if original day is high
        nextMonthlyAnniversary = new Date(now.getFullYear(), now.getMonth() + (now.getDate() > anniversaryDay ? 1 : 0) + 1, 0);
    }


    const timeToNextMonth = nextMonthlyAnniversary - now;
    const daysToNextMonth = Math.floor(timeToNextMonth / (1000 * 60 * 60 * 24));

    const nextMonthlyAnniversaryElement = document.getElementById("next_monthly_anniversary");
    if (nextMonthlyAnniversaryElement) {
        nextMonthlyAnniversaryElement.innerHTML =
            `Next Monthly Anniversary: <br>${nextMonthlyAnniversary.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} (${daysToNextMonth} days away)`;
    }

    // --- Anniversary Progress Bar ---
    const anniversaryProgressBar = document.getElementById('anniversaryProgressBar');
    if (anniversaryProgressBar) {
        const startOfCurrentCycle = (now >= new Date(now.getFullYear(), anniversaryMonth, anniversaryDay)) ?
                                    new Date(now.getFullYear(), anniversaryMonth, anniversaryDay) :
                                    new Date(now.getFullYear() - 1, anniversaryMonth, anniversaryDay);

        const endOfCurrentCycle = new Date(startOfCurrentCycle.getFullYear() + 1, anniversaryMonth, anniversaryDay);

        const totalCycleDuration = endOfCurrentCycle.getTime() - startOfCurrentCycle.getTime();
        const elapsedInCycle = now.getTime() - startOfCurrentCycle.getTime();

        let progress = 0;
        if (totalCycleDuration > 0) {
            progress = (elapsedInCycle / totalCycleDuration) * 100;
        }
        progress = Math.max(0, Math.min(100, progress));

        anniversaryProgressBar.style.width = progress.toFixed(2) + '%';
        anniversaryProgressBar.textContent = Math.round(progress) + '%';
    }
}

// Initial call to display values immediately
updateAllCounters();

// Update every second
setInterval(updateAllCounters, 1000);