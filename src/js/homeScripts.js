
function openFeedbackPopup() {
    var feedbackPopup = document.getElementById('feedbackPopup');
    feedbackPopup.classList.remove('hidden');
}

function closeFeedbackPopup() {
    var feedbackPopup = document.getElementById('feedbackPopup');
    feedbackPopup.classList.add('hidden');
}

function submitFeedback() {
    var feedbackText = document.getElementById('feedbackText').value;
    closeFeedbackPopup();
}

function toggleClearButton() {
    var queryInput = document.getElementById('query');
    var clearButton = document.getElementById('clearButton');
    clearButton.style.display = queryInput.value.trim() !== '' ? 'block' : 'none';
}

function clearInput() {
    document.getElementById('query').value = '';
    toggleClearButton();
}

async function locateMe() {
    if (navigator.geolocation) {
        const locationIcon = document.getElementById('locateMeIcon');
        locationIcon.src = '/img/loading.svg';

        navigator.geolocation.getCurrentPosition(async (position) => {
            try {
                const { latitude, longitude } = position.coords;
                const response = await fetch(`/api/locate?latitude=${latitude}&longitude=${longitude}`);
                if (response.ok) {
                    const data = await response.json();
                    const { address, country } = data;
                    if (address) {
                        const queryInput = document.getElementById('query');
                        const locationChipContainer = document.getElementById('locationChipContainer');
                        const locationChip = document.getElementById('locationChip');
                        const chipText = document.getElementById('chipText');

                        queryInput.dataset.latitude = latitude;
                        queryInput.dataset.longitude = longitude;
                        queryInput.dataset.address = address;
                        queryInput.dataset.country = country;

                        chipText.textContent = `Around ${address}`;
                        locationChipContainer.classList.remove('hidden');
                    }
                } else {
                    alert('Error occurred while getting location');
                }
            } catch (error) {
                console.error('Error:', error);
                alert('Error occurred while getting location');
            } finally {
                locationIcon.src = '/img/location.svg';
            }
        }, (error) => {
            console.error('Geolocation error:', error);
            alert('Error occurred while getting location');
            locationIcon.src = '/img/location.svg';
        });
    } else {
        alert('Geolocation is not supported by this browser.');
    }
}

function removeLocationChip() {
    const queryInput = document.getElementById('query');
    const locationChipContainer = document.getElementById('locationChipContainer');
    queryInput.removeAttribute('data-latitude');
    queryInput.removeAttribute('data-longitude');
    queryInput.removeAttribute('data-address');
    queryInput.removeAttribute('data-country');
    locationChipContainer.classList.add('hidden');
}

document.addEventListener('DOMContentLoaded', function () {
    fetch("/api/mapsRequests")
    .then(function(response) {
        return response.json();
    })
    .then(function(data) {
        var totalMapsRequests = data.totalMapsRequests;
        var totalUsers = data.totalUsers;
        document.getElementById('totalUsers').textContent = totalUsers;
        document.getElementById('totalPlaces').textContent = totalMapsRequests;
        document.getElementById('totalClaim').classList.remove('hidden');
        var totalClaim = document.getElementById('totalClaim');
        totalClaim.style.transition = 'opacity 1s';
        setTimeout(function() {
            totalClaim.style.opacity = 1;
        }, 100);
    })
    .catch(function(error) {
        console.error('Error:', error);
    });

    var clearButton = document.getElementById('clearButton');
    clearButton.style.display = 'none';

    clearButton.addEventListener('click', function () {
        clearButton.style.display = 'none';
    });

    if (window.location.href.includes('useDebug=true')) {
        var mapsQueryDiv = document.getElementById('mapsQuery');
        mapsQueryDiv.classList.remove('hidden');
    }

    fetch("/api/images").then(function(data){
        data.json().then(function(images){
            const imagePath = '/places/';
            const randomImage = images[Math.floor(Math.random() * images.length)];
            const imageName = formatImageName(randomImage);

            const imageContainer = document.querySelector('.sidebar-image');
            imageContainer.src = imagePath + randomImage;
            imageContainer.alt = imageName;
            imageContainer.className = "object-cover rounded-md sidebar-image md:w-full md:min-h-full min-w-full max-h-44 animation-delayed";

            const imageCaption = document.querySelector('.imagetext');
            imageCaption.textContent = imageName;

            document.getElementById('query').addEventListener('keydown', function (event) {
                if (event.key === 'Enter') {
                    sendQuery();
                }
            });
        });
    });
});

function formatImageName(filename) {
    return filename.replace(/^\d+-/, '').replace(/-/g, ' ').replace('.jpg', '').replace('.jpeg', '');
}
let placeholders = [];
let inputElement = document.getElementById('query');
let intervalId;
let animationDisabled = false; // New flag to disable animation

function loadPlaceholders() {
    fetch('/js/placeholderTexts.txt')
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
    if (!animationDisabled) {
        resetTransform();
    }
});

inputElement.addEventListener('blur', () => {
    rotatePlaceholder();  // Resume rotation when input loses focus
});

document.addEventListener('DOMContentLoaded', loadPlaceholders);

let resultsLoaded = false;
let searchBarFocused = false;

const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
        if (mutation.attributeName === "class") {
            const resultsList = document.getElementById('resultsList');
            if (!resultsList.classList.contains('hidden')) {
                resultsLoaded = true;
            }
        }
    });
});

observer.observe(document.getElementById('resultsList'), {
    attributes: true
});

function handleMouseMove(event) {
    if (resultsLoaded || searchBarFocused || animationDisabled) return;

    const searchBox = document.getElementById('seachBox');
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    const maxRotation = 8; // Reduced max rotation by 20%

    const x = (event.clientX - centerX) / centerX * maxRotation;
    const y = (event.clientY - centerY) / centerY * maxRotation;

    searchBox.style.transform = `perspective(1000px) rotateY(${x}deg) rotateX(${-y}deg)`;
}

function resetTransform() {
    const searchBox = document.getElementById('seachBox');
    searchBox.style.transform = '';
    animationDisabled = true; // Disable future animations
}

document.addEventListener('mousemove', handleMouseMove);

const searchBar = document.getElementById('query');
searchBar.addEventListener('focus', () => {
    searchBarFocused = true;
    resetTransform();
});
searchBar.addEventListener('blur', () => {
    searchBarFocused = false;
});

if (window.DeviceOrientationEvent) {
    window.addEventListener('deviceorientation', (event) => {
        if (resultsLoaded || searchBarFocused || animationDisabled) return;

        const searchBox = document.getElementById('seachBox');
        const maxRotation = 8; // Reduced max rotation by 20%
        const x = event.gamma / 90 * maxRotation; // gamma goes from -90 to 90
        const y = event.beta / 180 * maxRotation; // beta goes from -180 to 180

        searchBox.style.transform = `perspective(1000px) rotateY(${x}deg) rotateX(${-y}deg)`;
    }, true);
}

function closePremiumModal() {
    document.getElementById('premiumModal').classList.add('hidden');
}

function startFreeWeek() {
    // Add your logic for starting a free week here
    alert('🪩 Were still in demo mode, pro-mode (sorting, see all & unlimited search) unlocked. ❤️');
}

function openPremiumModal() {
    document.getElementById('premiumModal').classList.remove('hidden');
}

