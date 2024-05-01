let placeholders = [];
let currentIndex = 0;
let inputElement = document.getElementById('query');
let intervalId;

function loadPlaceholders() {
    fetch('/placeholderTexts.txt')
        .then(response => response.text())
        .then(text => {
            placeholders = text.split('\n').filter(Boolean);  // Ensure no empty strings
            rotatePlaceholder();
        });
}

function rotatePlaceholder() {
    if (placeholders.length > 0) {
        inputElement.placeholder = placeholders[currentIndex];
        currentIndex = (currentIndex + 1) % placeholders.length;
        intervalId = setTimeout(rotatePlaceholder, 3000); // Rotate every 3 seconds
    }
}

inputElement.addEventListener('focus', () => {
    clearTimeout(intervalId);
});

inputElement.addEventListener('blur', rotatePlaceholder);

document.addEventListener('DOMContentLoaded', loadPlaceholders);
