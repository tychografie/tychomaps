function evenmoreResults() {
    var query = document.getElementById('query').value.trim();
    if (query.length < 1) return;

    const useStatic = new URLSearchParams(window.location.search).get('useStatic') === 'true';
    const url = useStatic ? 'staticData.json' : '/api/search';

    fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ query: query })
    })
    .then(response => response.json())
    .then(data => {
        const resultsContainer = document.getElementById('results');
        resultsContainer.innerHTML = '';

        if (data.places && data.places.length) {  // Adjusted for the actual data structure
            data.places.forEach((result, index) => {  // Assuming the results are in data.places
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
        } else {
            resultsContainer.innerHTML = '<p>No results found or invalid query. <a href="/support">Help me out! 😰</a></p>';
        }
    })
    .catch(error => {
        console.error('Error:', error);
        document.getElementById('results').innerHTML = '<p>An error occurred fetching the results.</p>';
    });
}
