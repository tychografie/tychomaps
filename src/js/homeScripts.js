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

const locationIcon = document.getElementById('locateMeIcon');
const locationChipContainer = document.getElementById('locationChipContainer');
const chipText = document.getElementById('chipText');
const locateButton = document.getElementById('locateMe');

function updateLocationIcon(state) {
    switch (state) {
        case 'off':
            locationIcon.src = '/img/location-off.svg';
            break;
        case 'on':
            locationIcon.src = '/img/location-on.svg';
            break;
        case 'loading':
            locationIcon.src = '/img/loading.svg';
            break;
    }
}

function formatAddress(street, city) {
    return `of ${street} in ${city}`.split(' ').map(word => 
        `<span class="mr-1">${word}</span>`  // Verwijder inline-block als je CSS het al afhandelt
    ).join('');
}


locateButton.addEventListener('mouseover', function() {
    if (locationIcon.src.includes('location-off.svg')) {
        updateLocationIcon('on');
    }
});

locateButton.addEventListener('mouseout', function() {
    if (locationIcon.src.includes('location-on.svg') && locationChipContainer.classList.contains('hidden')) {
        updateLocationIcon('off');
    }
});

function removeLocationChip() {
    const queryInput = document.getElementById('query');
    queryInput.removeAttribute('data-latitude');
    queryInput.removeAttribute('data-longitude');
    queryInput.removeAttribute('data-address');
    queryInput.removeAttribute('data-country');
    locationChipContainer.classList.add('hidden');
    updateLocationIcon('off');
}

async function locateMe() {
    if (navigator.geolocation) {
        const tooltip = document.querySelector('#locateMe .tooltiptext');
        tooltip.classList.add('hidden');
        updateLocationIcon('loading');

        navigator.geolocation.getCurrentPosition(async (position) => {
            try {
                const { latitude, longitude } = position.coords;
                const response = await fetch(`/api/locate?latitude=${latitude}&longitude=${longitude}`);
                if (response.ok) {
                    const data = await response.json();
                    const { address, country } = data;
                    if (address) {
                        const queryInput = document.getElementById('query');
                        queryInput.dataset.latitude = latitude;
                        queryInput.dataset.longitude = longitude;
                        queryInput.dataset.address = address;
                        queryInput.dataset.country = country;

                        const [street, city] = address.split(' in ');
                        chipText.innerHTML = formatAddress(street, city);
                        locationChipContainer.classList.remove('hidden');
                        updateLocationIcon('on');
                    }
                } else {
                    throw new Error('Error occurred while getting location');
                }
            } catch (error) {
                console.error('Error:', error);
                alert(error.message);
                updateLocationIcon('off');
            }
        }, (error) => {
            console.error('Geolocation error:', error);
            alert('Error occurred while getting location');
            updateLocationIcon('off');
        });
    } else {
        alert('Geolocation is not supported by this browser.');
    }
}

// Initialize the icon state on page load
document.addEventListener('DOMContentLoaded', function() {
    updateLocationIcon(locationChipContainer.classList.contains('hidden') ? 'off' : 'on');
});

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
let animationDisabled = false;

function loadPlaceholders() {
    fetch('/js/placeholderTexts.txt')
        .then(response => response.text())
        .then(text => {
            placeholders = text.split('\n').filter(Boolean);
            rotatePlaceholder();
        });
}

function rotatePlaceholder() {
    if (placeholders.length > 0) {
        const randomIndex = Math.floor(Math.random() * placeholders.length);
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
            adjustSearchBoxHeight(); // Call the new function here
        }
    });
});

observer.observe(document.getElementById('resultsList'), {
    attributes: true
});

function handleMouseMove(event) {
    if (resultsLoaded || searchBarFocused || animationDisabled || window.innerWidth <= 768) return;

    const searchBox = document.getElementById('seachBox');
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    const maxRotation = 5; // Reduced max rotation to prevent excessive movement
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

// Function to populate recent discoveries
function populateRecentDiscoveries() {
    const recentDiscoveries = [
        { name: "Petra's Sommerkafé", location: "Langelille, Netherlands", text: "Petra’s Summer Café is a hidden gem with delicious homemade cakes, warm hospitality, and a charming terrace perfect for a cycling break or a cozy chat. A must-visit!", rating: 4.9, image: "https://lh5.googleusercontent.com/p/AF1QipMH3p6Vise9opoZlIM_9FTTlX03ZsEordZwZUjU=w408-h543-k-no", mapsLink: "https://maps.app.goo.gl/bikaH2h2G3qr8stw5" },
        { name: "La Forge des Halles", location: "Chambéry, France", text: "Once an iron forge, now transformed into a lively market hub full of local crafts and artisanal delights.", rating: 4.9, image: "https://www.lecturesplurielles.com/wp-content/uploads/2021/02/Lecture-plurielles-a-la-forge.jpg", mapsLink: "https://maps.app.goo.gl/EXGt26Ktu43mshBC8" },
        { name: "Wangedikanda Peak", location: "Kalupahana, Sri Lanka", text: "Breathtaking views and a challenging hike, leading adventurers to the stunning summit of a lesser-known mountain gem.", rating: 4.9, image: "https://lh3.googleusercontent.com/p/AF1QipPdnYZTG9TBHv0jXsA-3U9QtR5Oxz_Tgfe5STd3=s200", mapsLink: "https://maps.app.goo.gl/mqPJNn5m4SCNofuY9" },
        { name: "Old Post office Cafe Gallery", location: "Kincraig, Scotland", text: "Art café that blends creativity and history, a cozy spot in a former village post office.", rating: 4.9, image: "https://lh3.googleusercontent.com/p/AF1QipMdtBgEv8gBQbKW-3TycahbQWKgX28pXJp7rq96=s200", mapsLink: "https://maps.app.goo.gl/cHjLLj9ttHmk7z1s8" },
        { name: "C's House Homestay (ホームステイ)", location: "Nagano, Japan", text: "Suzie and Toru's guesthouse near the Snow Monkey Park offers warm hospitality, cozy rooms, and a perfect location—feels just like home!", rating: 5.0, image: "https://lh3.googleusercontent.com/p/AF1QipOTtEuz5FZ5Kqs2LIUyBcX4vqfkJY8BRM7LWEXc=s200", mapsLink: "https://maps.app.goo.gl/KfPYGPYJtjdWEHJx7" },

    ];

    const container = document.getElementById('recentDiscoveries');
    recentDiscoveries.forEach(place => {
        const placeElement = document.createElement('a');
        placeElement.href = place.mapsLink;
        placeElement.target = "_blank";
        placeElement.className = 'flex items-stretch bg-white shadow-sm transition-transform duration-300 ease-in-out hover:scale-[1.02]';
        
        const imageElement = document.createElement('img');
        imageElement.src = place.image;
        imageElement.alt = place.name;
        imageElement.className = 'w-24 object-cover rounded-tl-md rounded-bl-md';
        
        const infoElement = document.createElement('div');
        infoElement.className = 'p-4 flex-grow rounded-tr-md rounded-br-md border-t border-r border-b border-gray-200';
        infoElement.innerHTML = `
            <h3 class="belanosima-regular">${place.name}</h3>
            <p class="text-sm text-gray-600">${place.text}</p>
            <p class="text-sm">Rating: ${place.rating} ${place.location ? `- ${place.location}` : ''}</p>
            ${place.distance !== undefined ? `<p class="text-sm">Distance: ${formatDistance(place.distance)}</p>` : ''}
        `;
        
        placeElement.appendChild(imageElement);
        placeElement.appendChild(infoElement);
        container.appendChild(placeElement);
    });
}



// Function to capitalize every word in a string
function capitalizeWords(str) {
    return str.replace(/\b\w/g, l => l.toUpperCase());
}

// Function to populate recent searches
async function populateRecentSearches() {
    try {
        const response = await fetch('/api/search?recentSearches=true');
        if (!response.ok) {
            throw new Error('Failed to fetch recent searches');
        }
        const recentSearches = await response.json();
        console.log("Received recent searches:", recentSearches);

        const container = document.getElementById('recentSearches');
        container.innerHTML = ''; // Clear existing content

        recentSearches.forEach(search => {
            console.log("Processing search:", search);
            const searchElement = document.createElement('li');
            searchElement.className = 'mb-2 bg-white rounded-md p-4 transition-transform duration-300 ease-in-out hover:scale-[1.02] border border-gray-200 flex items-center cursor-pointer';
            searchElement.innerHTML = `
                <span class="mr-2">${search.aiEmoji || ''}</span>
                <span class="flex-grow">${capitalizeWords(search.originalQuery)}</span>
                <span class="text-xs text-gray-500">${search.aiType}</span>
            `;
            searchElement.style.listStyleType = 'none';
            searchElement.addEventListener('click', () => performSearch(search.originalQuery));
            container.appendChild(searchElement);
        });
    } catch (error) {
        console.error('Error populating recent searches:', error);
    }
}

function performSearch(query) {
    document.getElementById('query').value = query;
    sendQuery(); // This function should be available from sendQuery.js
}

// Call these functions when the page loads
document.addEventListener('DOMContentLoaded', () => {
    populateRecentDiscoveries();
    populateRecentSearches();
    adjustSearchBoxHeight(); // Initial call to set correct height

    // Check for query parameter
    const urlParams = new URLSearchParams(window.location.search);
    const query = urlParams.get('q');
    if (query) {
        document.getElementById('query').value = decodeURIComponent(query);
        sendQuery();
    }
});

// Add this function to adjust the search box height
function adjustSearchBoxHeight() {
    const searchBox = document.getElementById('seachBox');
    const resultsList = document.getElementById('resultsList');
    const windowHeight = window.innerHeight;
    const windowWidth = window.innerWidth;

    if (!resultsList.classList.contains('hidden')) {
        // If results are shown, remove the min-height
        searchBox.style.minHeight = 'auto';
    } else {
        // Adjust height based on screen size
        if (windowWidth > 1920 && windowHeight > 1080) {
            // For very large screens
            searchBox.style.minHeight = '50vh';
        } else if (windowWidth > 1440 && windowHeight > 900) {
            // For large screens
            searchBox.style.minHeight = '60vh';
        } else {
            // For normal and smaller screens
            searchBox.style.minHeight = '70vh';
        }
    }
}

// Call this function on window resize
window.addEventListener('resize', adjustSearchBoxHeight);

// Modify the sendQuery function (if it's in this file, otherwise add it)
function sendQuery() {
    const query = document.getElementById('query').value.trim();
    const encodedQuery = encodeURIComponent(query);
    const newUrl = `${window.location.origin}${window.location.pathname}?q=${encodedQuery}`;
    window.history.pushState({ query: query }, '', newUrl);

    // ... existing query sending logic ...
    
    // After sending the query and showing results:
    adjustSearchBoxHeight();
}

function checkMobileAndDisableAnimation() {
    if (window.innerWidth <= 768) {
        animationDisabled = true;
        resetTransform();
    } else {
        animationDisabled = false;
    }
}

window.addEventListener('resize', checkMobileAndDisableAnimation);
document.addEventListener('DOMContentLoaded', checkMobileAndDisableAnimation);

function formatDistance(distance) {
    console.log('Formatting distance:', distance); // Debug log
    if (distance !== undefined && distance !== null && !isNaN(distance)) {
        return distance.toFixed(2) + ' km';
    }
    return 'Unknown';
}

// Modify the populateRecentDiscoveries function
function populateRecentDiscoveries() {
    const recentDiscoveries = [
        { name: "La Forge des Halles", location: "Chambéry, France", text: "Once an iron forge, now transformed into a lively market hub full of local crafts and artisanal delights.", rating: 4.9, image: "https://www.lecturesplurielles.com/wp-content/uploads/2021/02/Lecture-plurielles-a-la-forge.jpg", mapsLink: "https://maps.app.goo.gl/EXGt26Ktu43mshBC8" },
        { name: "Wangedikanda Peak", location: "Kalupahana, Sri Lanka", text: "Breathtaking views and a challenging hike, leading adventurers to the stunning summit of a lesser-known mountain gem.", rating: 4.9, image: "https://lh3.googleusercontent.com/p/AF1QipPdnYZTG9TBHv0jXsA-3U9QtR5Oxz_Tgfe5STd3=s200", mapsLink: "https://maps.app.goo.gl/cHjLLj9ttHmk7z1s8" },
        { name: "Old Post office Cafe Gallery", location: "Kincraig, Scotland", text: "Art café that blends creativity and history, a cozy spot in a former village post office.", rating: 4.9, image: "https://lh3.googleusercontent.com/p/AF1QipMdtBgEv8gBQbKW-3TycahbQWKgX28pXJp7rq96=s200", mapsLink: "https://maps.app.goo.gl/cHjLLj9ttHmk7z1s8" },
        { name: "C's House Homestay (ホームステイ)", location: "Nagano, Japan", text: "Suzie and Toru's guesthouse near the Snow Monkey Park offers warm hospitality, cozy rooms, and a perfect location—feels just like home!", rating: 5.0, image: "https://lh3.googleusercontent.com/p/AF1QipOTtEuz5FZ5Kqs2LIUyBcX4vqfkJY8BRM7LWEXc=s200", mapsLink: "https://maps.app.goo.gl/KfPYGPYJtjdWEHJx7" },

    ];

    const container = document.getElementById('recentDiscoveries');
    container.innerHTML = ''; // Clear existing content

    recentDiscoveries.forEach(place => {
        console.log('Processing place:', place); // Debug log
        const placeElement = document.createElement('a');
        placeElement.href = place.mapsLink;
        placeElement.target = "_blank";
        placeElement.className = 'flex items-stretch bg-white shadow-sm transition-transform duration-300 ease-in-out hover:scale-[1.02]';
        
        const imageElement = document.createElement('img');
        imageElement.src = place.image;
        imageElement.alt = place.name;
        imageElement.className = 'w-24 object-cover rounded-tl-md rounded-bl-md';
        
        const infoElement = document.createElement('div');
        infoElement.className = 'p-4 flex-grow rounded-tr-md rounded-br-md border-t border-r border-b border-gray-200';
        infoElement.innerHTML = `
            <h3 class="belanosima-regular">${place.name}</h3>
            <p class="text-sm text-gray-600">${place.text}</p>
            <p class="text-sm">Rating: ${place.rating} ${place.location ? `- ${place.location}` : ''}</p>
            ${place.distance !== undefined ? `<p class="text-sm">Distance: ${formatDistance(place.distance)}</p>` : ''}
        `;
        
        placeElement.appendChild(imageElement);
        placeElement.appendChild(infoElement);
        container.appendChild(placeElement);
    });
}