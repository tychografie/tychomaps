document.addEventListener('DOMContentLoaded', () => {
    addPremiumButtonAnimation();
    setupPremiumModal();
    setupCityGuidesToggle();
});

function setupPremiumModal() {
    const premiumModal = document.getElementById('premiumModal');
    if (premiumModal) {
        premiumModal.addEventListener('click', function(event) {
            if (event.target === this) {
                closePremiumModal();
            }
        });
    }
}

function setupCityGuidesToggle() {
    const cityGuidesToggle = document.getElementById('cityGuidesToggle');
    const cityGuidesDropdown = document.getElementById('cityGuidesDropdown');
    let isOpen = false;

    if (cityGuidesToggle && cityGuidesDropdown) {
        cityGuidesToggle.addEventListener('click', (e) => {
            e.preventDefault();
            isOpen = !isOpen;
            cityGuidesDropdown.classList.toggle('hidden', !isOpen);
        });

        document.addEventListener('click', (e) => {
            if (!cityGuidesToggle.contains(e.target) && !cityGuidesDropdown.contains(e.target)) {
                isOpen = false;
                cityGuidesDropdown.classList.add('hidden');
            }
        });
    }
}

function addPremiumButtonAnimation() {
    const style = document.createElement('style');
    style.textContent = `
        @keyframes shine {
            0% {
                transform: translateX(-100%);
            }
            100% {
                transform: translateX(100%);
            }
        }

        #premiumButton .shine-effect {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(
                to right,
                rgba(255, 255, 255, 0) 0%,
                rgba(255, 255, 255, 0.4) 50%,
                rgba(255, 255, 255, 0) 100%
            );
            animation: shine 3s infinite;
        }
    `;
    document.head.appendChild(style);

    const premiumButton = document.getElementById('premiumButton');
    if (premiumButton) {
        const shineEffect = document.createElement('div');
        shineEffect.className = 'shine-effect';
        premiumButton.appendChild(shineEffect);
    }
}

function closePremiumModal() {
    const premiumModal = document.getElementById('premiumModal');
    if (premiumModal) {
        premiumModal.classList.add('hidden');
    }
}

async function startPremium() {
    try {
        const user = await Clerk.user;
        if (!user) {
            alert('Please sign in to start your free trial.');
            return;
        }

        // Check if Paddle is loaded
        if (typeof Paddle === 'undefined') {
            throw new Error('Paddle is not loaded');
        }

        // Open Paddle checkout
        Paddle.Checkout.open({
            product: 'pro_01j5tpqxz6s2bs0c3m6k6fkz8n', // Your actual product ID
            email: user.primaryEmailAddress.emailAddress,
            passthrough: JSON.stringify({
                userId: user.id
            }),
            successCallback: function(data) {
                console.log('Checkout complete!', data);
                // Here you can call your backend to update the user's premium status
            },
            closeCallback: function(data) {
                console.log('Checkout closed', data);
            }
        });
    } catch (error) {
        console.error('Error starting premium trial:', error);
        alert('An error occurred while starting your free trial. Please try again later.');
    }
}

function openPremiumModal() {
    const premiumModal = document.getElementById('premiumModal');
    if (premiumModal) {
        premiumModal.classList.remove('hidden');
    }
}

window.addEventListener('load', async function () {
    if (window.Clerk) {
        await Clerk.load();
        const loginButton = document.getElementById('loginButton');
        const loginText = document.getElementById('loginText');
        const premiumButton = document.getElementById('premiumModalButton');

        if (Clerk.user) {
            loginText.textContent = Clerk.user.firstName || 'Account';
            loginButton.onclick = () => Clerk.openUserProfile();

            const { premium } = Clerk.user.publicMetadata;
            if (premium) {
                if (premiumButton) {
                    premiumButton.style.display = 'none';
                }
            }
        } else {
            loginText.textContent = 'Login';
            loginButton.onclick = () => window.location.href = '/sign-in';
        }
    }
});