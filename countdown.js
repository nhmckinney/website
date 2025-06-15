// ✅ Your original anniversary date:
const startYear = 2024;
const anniversaryMonth = 10;  // June (0-based)
const anniversaryDay = 11;

function updateCountdown() {
    const now = new Date();
    let currentYear = now.getFullYear();

    // Build anniversary date for this year
    let nextAnniversary = new Date(currentYear, anniversaryMonth, anniversaryDay, 0, 0, 0);

    // If anniversary has passed this year, move to next year
    if (now > nextAnniversary) {
        currentYear++;
        nextAnniversary = new Date(currentYear, anniversaryMonth, anniversaryDay, 0, 0, 0);
    }

    // Calculate which anniversary we're approaching
    const anniversaryNumber = currentYear - startYear;

    // Time difference
    const diff = nextAnniversary - now;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    const seconds = Math.floor((diff / 1000) % 60);

    document.getElementById("countdown_timer").innerHTML =
        `Our ${ordinal(anniversaryNumber)} Anniversary is in <br>${days}d ${hours}h ${minutes}m ${seconds}s`;

    // Calculate days together
    const startDate = new Date(startYear, anniversaryMonth, anniversaryDay);
    const daysTogether = Math.floor((now - startDate) / (1000 * 60 * 60 * 24));
    document.getElementById("days_together").innerHTML =
        `We've been together for <br>${daysTogether} days! ❤️`;

    // Calculate next monthly anniversary
    let nextMonthlyAnniversary = new Date(now.getFullYear(), now.getMonth(), anniversaryDay);
    if (now.getDate() > anniversaryDay) {
        nextMonthlyAnniversary.setMonth(nextMonthlyAnniversary.getMonth() + 1);
    }
    // Handle cases where the anniversary day doesn't exist in the next month (e.g., Feb 30)
    if (nextMonthlyAnniversary.getDate() !== anniversaryDay) {
        nextMonthlyAnniversary.setDate(0); // Set to last day of previous month
    }
    
    const timeToNextMonth = nextMonthlyAnniversary - now;
    const daysToNextMonth = Math.floor(timeToNextMonth / (1000 * 60 * 60 * 24));

    document.getElementById("next_monthly_anniversary").innerHTML =
        `Next Monthly Anniversary: <br>${nextMonthlyAnniversary.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} (${daysToNextMonth} days away)`;
}

// Helper to turn 1 -> 1st, 2 -> 2nd, 3 -> 3rd, etc.
function ordinal(n) {
    const suffixes = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return n + (suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0]);
}

setInterval(updateCountdown, 1000);
updateCountdown();