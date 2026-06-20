/* NEXORA THEME TOGGLE*/

document.addEventListener("DOMContentLoaded", () => {

    const body = document.body;

    const toggleBtn = document.getElementById("themeToggle");

    /*  LOAD SAVED THEME */

    const savedTheme = localStorage.getItem("nexoraTheme");

    if (savedTheme) {

        body.classList.remove("dark-theme", "light-theme");

        body.classList.add(savedTheme);

    } else {

        body.classList.add("dark-theme");

    }

    /* UPDATE ICON */

    function updateIcon() {

        if (!toggleBtn) return;

        if (body.classList.contains("light-theme")) {

            toggleBtn.innerHTML =
                '<i class="bi bi-moon-fill"></i>';

        } else {

            toggleBtn.innerHTML =
                '<i class="bi bi-sun-fill"></i>';

        }
    }

    updateIcon();

    /* TOGGLE THEME */

    if (toggleBtn) {

        toggleBtn.addEventListener("click", () => {

            if (body.classList.contains("dark-theme")) {

                body.classList.remove("dark-theme");

                body.classList.add("light-theme");

                localStorage.setItem(
                    "nexoraTheme",
                    "light-theme"
                );

            } else {

                body.classList.remove("light-theme");

                body.classList.add("dark-theme");

                localStorage.setItem(
                    "nexoraTheme",
                    "dark-theme"
                );

            }

            updateIcon();

        });

    }

});

const languageSelect =
document.getElementById("languageSelect");

if(languageSelect){

    const savedLanguage =
    localStorage.getItem("nexoraLanguage");

    if(savedLanguage){

        languageSelect.value =
        savedLanguage;
    }

    languageSelect.addEventListener(
        "change",
        ()=>{

            localStorage.setItem(
                "nexoraLanguage",
                languageSelect.value
            );

        }
    );
}
/* ==========================================================
OPTIONAL DUMMY DEMO FUNCTION

REMOVE WHEN BACKEND IS CONNECTED

This simply makes the dashboard feel alive
during frontend demonstrations.
========================================================== */

const discoverBtn = document.getElementById("discoverBtn");

if (discoverBtn) {

    discoverBtn.addEventListener("click", () => {

        const sqlBox =
            document.getElementById("generatedSQL");

        const insights =
            document.getElementById("insightsContainer");

        if (sqlBox) {

            sqlBox.textContent = `
              SELECT region,
              SUM(sales) AS total_sales
              FROM sales_data
              GROUP BY region
              ORDER BY total_sales DESC;
            `;
        }

        if (insights) {

            insights.innerHTML = `

            <div class="insight-item positive">
                South region generated the highest revenue.
            </div>

            <div class="insight-item positive">
                Revenue increased by 14%.
            </div>

            <div class="insight-item warning">
                Electronics category slowed in Q4.
            </div>

            <div class="insight-item positive">
                Hidden customer segment identified.
            </div>

            `;
        }

    });

}
