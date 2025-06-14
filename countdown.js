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
        `Our ${ordinal(anniversaryNumber)} Anniversary is in ${days}d ${hours}h ${minutes}m ${seconds}s`;
}

// Helper to turn 1 -> 1st, 2 -> 2nd, 3 -> 3rd, etc.
function ordinal(n) {
    const suffixes = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return n + (suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0]);
}

setInterval(updateCountdown, 1000);
updateCountdown();