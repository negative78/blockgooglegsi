let allowedSites = [];

async function loadAllowedSites() {
    const data = await browser.storage.sync.get("allowedSites");
    allowedSites = data.allowedSites || [];
}

// Load allowed sites from storage
browser.runtime.onInstalled.addListener(async () => {
    await loadAllowedSites();
    console.log("Google Sign-In Popup Blocker installed.");
});

// Listen for messages from popup
browser.runtime.onMessage.addListener(async (message) => {
    if (message.type === "updateAllowedSites") {
        allowedSites = message.allowedSites;
    }
});

// Create a blocking webRequest listener
browser.webRequest.onBeforeRequest.addListener(
    (details) => {
        if (details.url.includes("accounts.google.com/gsi/")) {
            // Extract the domain from the initiator URL
            const originUrl = details.originUrl;
            if (originUrl) {
                const domain = new URL(originUrl).hostname;
                if (allowedSites.includes(domain)) {
                    console.log("Allowing Google Sign-In popup for:", domain);
                    return { cancel: false };
                }
            }
            console.log("Blocked Google Sign-In popup:", details.url);
            return { cancel: true };
        }
        return { cancel: false };
    },
    {
        urls: ["*://accounts.google.com/gsi/*"],
        types: [
            "script",
            "xmlhttprequest",
            "sub_frame",
            "main_frame",
            "image",
            "other",
        ],
    },
    ["blocking"]
);
