let placeholders = [];
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
        const randomIndex = Math.floor(Math.random() * placeholders.length); // Randomly select index
        inputElement.placeholder = placeholders[randomIndex];
        intervalId = setTimeout(rotatePlaceholder, 3000); // Rotate every 3 seconds
    }
}

inputElement.addEventListener('focus', () => {
    clearTimeout(intervalId);
});

inputElement.addEventListener('blur', () => {
    rotatePlaceholder();  // Resume rotation when input loses focus
});

document.addEventListener('DOMContentLoaded', loadPlaceholders);
