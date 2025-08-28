document.addEventListener("DOMContentLoaded", async () => {
    const siteList = document.getElementById("siteList");
    const newSiteInput = document.getElementById("newSite");
    const addSiteButton = document.getElementById("addSite");

    // Get current tab's URL and set as default
    const [tab] = await browser.tabs.query({
        active: true,
        currentWindow: true,
    });
    if (tab?.url) {
        const url = new URL(tab.url);
        newSiteInput.value = url.hostname;
    }

    // Load existing allowed sites
    const { allowedSites = [] } = await browser.storage.sync.get(
        "allowedSites"
    );

    // Function to update the UI with current sites
    function updateSiteList() {
        siteList.innerHTML = "";
        allowedSites.forEach((site) => {
            const siteItem = document.createElement("div");
            siteItem.className = "site-item";
            siteItem.innerHTML = `
                <span>${site}</span>
                <button class="remove-btn" data-site="${site}">Remove</button>
            `;
            siteList.appendChild(siteItem);
        });

        // Add click handlers for remove buttons
        document.querySelectorAll(".remove-btn").forEach((button) => {
            button.addEventListener("click", async (e) => {
                const site = e.target.dataset.site;
                const index = allowedSites.indexOf(site);
                if (index > -1) {
                    allowedSites.splice(index, 1);
                    await browser.storage.sync.set({ allowedSites });
                    updateSiteList();
                    // Notify background script
                    browser.runtime.sendMessage({
                        type: "updateAllowedSites",
                        allowedSites,
                    });
                }
            });
        });
    }

    // Add new site
    addSiteButton.addEventListener("click", async () => {
        const site = newSiteInput.value.trim();
        if (site && !allowedSites.includes(site)) {
            allowedSites.push(site);
            await browser.storage.sync.set({ allowedSites });
            newSiteInput.value = "";
            updateSiteList();
            // Notify background script
            browser.runtime.sendMessage({
                type: "updateAllowedSites",
                allowedSites,
            });
        }
    });

    // Initialize the site list
    updateSiteList();
});
