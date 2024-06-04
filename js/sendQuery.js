function sendQuery() {
    const mapsQuery = document.getElementById('mapsQuery');
    var button = document.getElementById('search-button');

    button.disabled = true;
    const options = ['asking locals', 'asking bartenders', 'asking students', 'asking taxi drivers', 'asking surfers', 'asking designers', 'asking bakers', 'asking chefs'];
    let currentIndex = 0;

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
    setInterval(() => {
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
    }, 1000);

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
        .then(response => response.json())
        .then(data => {
            const resultsContainer = document.getElementById('results');
            resultsContainer.innerHTML = '';
            const totalPlaces = data.places?.length;
            const totalElement = document.getElementById('total');
            totalElement.textContent = totalPlaces - 5;

            if (data.places && data.places.length) {
                data.places.slice(0, 30).forEach((result, index) => {
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
            document.getElementById('results').innerHTML = '<p>An error occurred fetching the results.</p>';
            button.innerHTML = 'Search';
            mapsQuery.textContent = data.aiResponse;
            button.disabled = false;
        });
}

document.getElementById('removeLocationChip').addEventListener('click', removeLocationChip);
