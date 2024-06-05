function sendQuery() {
    const mapsQuery = document.getElementById('mapsQuery');
    var button = document.getElementById('search-button');

    button.disabled = true;
    const totalClaim = document.getElementById('totalClaim');
    totalClaim.style.opacity = '0';

    const options = ['asking locals', 'asking bartenders', 'asking students', 'asking taxi drivers', 'asking surfers', 'asking designers', 'asking bakers', 'asking chefs'];
    let currentIndex = 0;

    function updateButtonText() {
        if (button.disabled) {
        button.innerHTML = `
            <div style="display: flex; justify-content: center; align-items: center;">
                <svg class="animate-spin h-5 w-5 mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                ${options[currentIndex]}
            </div>
        `;
        currentIndex = (currentIndex + 1) % options.length;
        }
    }

        // Call the function immediately
        updateButtonText();

        // Set interval to continue updating the button text every 1000ms
        setInterval(updateButtonText, 1000);

    var query = document.getElementById('query').value.trim();
    const latitude = document.getElementById('query').dataset.latitude || null;
    const longitude = document.getElementById('query').dataset.longitude || null;
    const country = document.getElementById('query').dataset.country || null;

    if (query.length < 3) {
        button.innerHTML = "Can't search for nothin' 🙌";
        button.disabled = false;
        setTimeout(() => {
            button.innerHTML = 'Search';
        }, 2000);
        return;
    }

    const queryWords = query.split(' ');
    if (queryWords.length === 1 && (latitude === null || longitude === null)) {
        button.innerHTML = "What or where? 🤔";
        button.disabled = false;
        setTimeout(() => {
            button.innerHTML = 'Search';
        }, 2000);
        return;
    }

    fetch('/api/search', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ query: query, country: country, latitude: latitude, longitude: longitude, staticMode: new URLSearchParams(window.location.search).get('useStatic') })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to fetch');
        }
        return response.json();
    })
    .then(data => {
        if (!data || !data.places) {
            throw new Error('Invalid data structure from API');
        }
        // Proceed with processing data
        const resultsContainer = document.getElementById('results');
        resultsContainer.innerHTML = '';
        const totalPlaces = data.places.length;
        const totalElement = document.getElementById('total');
        totalElement.textContent = totalPlaces;
        totalClaim.classList.add('hidden');
        
        if (data.places && data.places.length) {
            data.places.forEach((result, index) => {
                setTimeout(() => {
                    const resultItem = document.createElement('a');
                    resultItem.className = 'result-item';
                    resultItem.href = result.googleMapsUri;
                    resultItem.target = "_blank";
                    resultItem.innerHTML = `
                    <div class="top-row hover:bg-neutral-950 flex justify-between p-5 rounded-md bg-neutral-800 text-white text-lg">
                        <div class="flex items-center space-x-3">
                            <span class="place-name">${result.displayName.text}</span>
                            ${result.opening_hours && result.opening_hours.open_now ?
                            '<span class="relative grid select-none items-center whitespace-nowrap rounded-lg bg-neutral-900 py-1.5 px-3 font-sans text-xs font-bold uppercase text-white">Open Now</span>' : ''}
                        </div>
                        <span class="rating">${result.rating}</span>
                    </div>
                    `;
                    resultsContainer.appendChild(resultItem);
                }, 100 * index);
            });
            button.innerHTML = 'Search';
            button.disabled = false;
            document.getElementById('resultsList').classList.remove('hidden');

            mapsQuery.textContent += data.aiResponse;
        } else {
            resultsContainer.innerHTML = '<p>No results found or invalid query. <u><a href="/support">Help me out! 😰</a></u></p>';
            button.innerHTML = 'Search';
            button.disabled = false;
            mapsQuery.textContent = data.aiResponse;
        }
    })
    .catch(error => {
        console.error('Error:', error);
        let errorMessage = '<p>Unexpected error occurred. Please try again later.</p>';
        if (error instanceof SyntaxError) {
            errorMessage = '<p>Failed to process server response. Please report this issue.</p>';
        } else if (error.message.includes('Failed to fetch')) {
            errorMessage = '<p>Unable to connect to server. Check your internet connection or try again later.</p>';
        }
        document.getElementById('results').innerHTML = errorMessage;
        button.innerHTML = 'Search';
        mapsQuery.textContent = "Error in fetching data.";
        button.disabled = false;
    });
}

document.getElementById('removeLocationChip').addEventListener('click', removeLocationChip);
