let allowedSites = [];

function generateRules() {
    const baseRule = {
        id: 1,
        priority: 1,
        action: { type: "block" },
        condition: {
            urlFilter: "accounts.google.com/gsi/",
            resourceTypes: [
                "script",
                "xmlhttprequest",
                "sub_frame",
                "main_frame",
                "image",
                "other",
            ],
            excludedInitiatorDomains: allowedSites,
        },
    };
    return [baseRule];
}

// Load allowed sites from storage
async function loadAllowedSites() {
    const data = await chrome.storage.sync.get("allowedSites");
    allowedSites = data.allowedSites || [];
}

chrome.runtime.onInstalled.addListener(async () => {
    await loadAllowedSites();

    // Set up initial rules
    await chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: [1],
        addRules: generateRules(),
    });

    console.log("Google Sign-In Popup Blocker installed and rules applied.");
});

// Listen for messages from popup
chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
    if (message.type === "updateAllowedSites") {
        allowedSites = message.allowedSites;

        // Update the dynamic rules when allowlist changes
        await chrome.declarativeNetRequest.updateDynamicRules({
            removeRuleIds: [1],
            addRules: generateRules(),
        });
    }
});

chrome.webNavigation.onBeforeNavigate.addListener((details) => {
    if (details.url.includes("accounts.google.com/gsi/")) {
        // Extract the domain from the initiator URL
        const initiator = details.initiator;
        if (initiator) {
            const domain = new URL(initiator).hostname;
            if (allowedSites.includes(domain)) {
                console.log("Allowing Google Sign-In popup for:", domain);
                return;
            }
        }
        console.log("Blocked Google Sign-In popup:", details.url);
    }
});
