const statusElement = document.querySelector("#status");
function render(message) {
    if (message.type === "STATE_UPDATED" && statusElement) {
        statusElement.textContent = `Status: ${message.state.status}`;
    }
}
const message = { type: "GET_STATE" };
chrome.runtime.sendMessage(message, render);
export {};
