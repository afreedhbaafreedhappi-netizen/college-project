// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Add scroll effect to navbar
window.addEventListener('scroll', () => {
    const nav = document.querySelector('.glass-nav');
    if (window.scrollY > 50) {
        nav.style.background = 'rgba(5, 5, 5, 0.95)';
        nav.style.backdropFilter = 'blur(20px)';
    } else {
        nav.style.background = 'rgba(5, 5, 5, 0.8)';
    }
});

// Animate stats on scroll
const observerOptions = {
    threshold: 0.5,
    rootMargin: '0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const stats = entry.target.querySelectorAll('.stat-number');
            stats.forEach(stat => {
                const target = parseFloat(stat.textContent);
                let current = 0;
                const increment = target / 50;
                const timer = setInterval(() => {
                    current += increment;
                    if (current >= target) {
                        stat.textContent = target + (target % 1 === 0 ? '' : '%');
                        clearInterval(timer);
                    } else {
                        stat.textContent = Math.floor(current) + (target % 1 === 0 ? '' : '%');
                    }
                }, 20);
            });
        }
    });
}, observerOptions);

const heroStats = document.querySelector('.hero-stats');
if (heroStats) observer.observe(heroStats);

// Add ripple effect to buttons
document.querySelectorAll('.btn-glow, .btn-primary, .btn-outline').forEach(button => {
    button.addEventListener('click', function(e) {
        const ripple = document.createElement('span');
        ripple.classList.add('ripple');
        const rect = this.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        ripple.style.left = `${x}px`;
        ripple.style.top = `${y}px`;
        this.appendChild(ripple);
        setTimeout(() => ripple.remove(), 600);
    });
});

// Add ripple style
const style = document.createElement('style');
style.textContent = `
    .btn-glow, .btn-primary, .btn-outline {
        position: relative;
        overflow: hidden;
    }
    .ripple {
        position: absolute;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.5);
        transform: scale(0);
        animation: ripple-animation 0.6s linear;
        pointer-events: none;
    }
    @keyframes ripple-animation {
        to {
            transform: scale(4);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Typing effect for hero title (optional)
const heroTitle = document.querySelector('.hero-title');
if (heroTitle) {
    const originalText = heroTitle.innerHTML;
    heroTitle.innerHTML = '';
    let i = 0;
    const typingEffect = setInterval(() => {
        if (i < originalText.length) {
            heroTitle.innerHTML += originalText.charAt(i);
            i++;
        } else {
            clearInterval(typingEffect);
        }
    }, 50);
}