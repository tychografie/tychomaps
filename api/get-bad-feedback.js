document.addEventListener('DOMContentLoaded', async () => {
    const response = await fetch('/api/get-bad-feedback');
    const data = await response.json();
    renderFeedbackList(data);
});

async function renderFeedbackList(data) {
    const feedbackList = document.getElementById('feedback-list');
    feedbackList.innerHTML = '';
    data.forEach(item => {
        const row = document.createElement('div');
        row.className = 'flex items-center p-4 border-b border-gray-200';
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = item.feedbackHandled === 1;
        checkbox.className = 'mr-4';
        checkbox.addEventListener('change', () => handleCheckboxChange(item._id.$oid, checkbox.checked));
        
        const queryText = document.createElement('span');
        queryText.textContent = item.query;
        
        row.appendChild(checkbox);
        row.appendChild(queryText);
        feedbackList.appendChild(row);
    });
}

async function handleCheckboxChange(id, isChecked) {
    await fetch('/api/handle-feedback', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id, feedbackHandled: isChecked })
    });
}
