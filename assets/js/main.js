(function () {
    const canvas = document.getElementById('heart-canvas');
    const ctx = canvas.getContext('2d');
    let particles = [];

    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    function heartShape(x, y, size) {
        ctx.beginPath();
        const topCurveHeight = size * 0.3;
        ctx.moveTo(x, y + topCurveHeight);
        ctx.bezierCurveTo(x, y, x - size / 2, y, x - size / 2, y + topCurveHeight);
        ctx.bezierCurveTo(x - size / 2, y + (size + topCurveHeight) / 2, x, y + (size + topCurveHeight) / 1.3, x, y + size);
        ctx.bezierCurveTo(x, y + (size + topCurveHeight) / 1.3, x + size / 2, y + (size + topCurveHeight) / 2, x + size / 2, y + topCurveHeight);
        ctx.bezierCurveTo(x + size / 2, y, x, y, x, y + topCurveHeight);
        ctx.closePath();
    }

    class Particle {
        constructor() { this.reset(); }
        reset() {
            this.x = Math.random() * canvas.width;
            this.y = canvas.height + 20 + Math.random() * 100;
            this.size = Math.random() * 10 + 5;
            this.speedY = -(Math.random() * 0.4 + 0.15);
            this.speedX = (Math.random() - 0.5) * 0.3;
            this.opacity = Math.random() * 0.18 + 0.05;
            this.rotation = Math.random() * Math.PI * 2;
            this.rotationSpeed = (Math.random() - 0.5) * 0.01;
            const hues = ['rgba(255,133,169,', 'rgba(255,173,198,', 'rgba(255,105,180,', 'rgba(212,160,168,', 'rgba(255,194,212,'];
            this.color = hues[Math.floor(Math.random() * hues.length)];
        }
        update() {
            this.y += this.speedY;
            this.x += this.speedX + Math.sin(this.y * 0.005) * 0.2;
            this.rotation += this.rotationSpeed;
            if (this.y < -30) this.reset();
        }
        draw() {
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.rotation);
            ctx.fillStyle = this.color + this.opacity + ')';
            heartShape(0, 0, this.size);
            ctx.fill();
            ctx.restore();
        }
    }

    const count = Math.min(Math.floor(window.innerWidth / 40), 35);
    for (let i = 0; i < count; i++) {
        const p = new Particle();
        p.y = Math.random() * canvas.height;
        particles.push(p);
    }

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach(p => { p.update(); p.draw(); });
        requestAnimationFrame(animate);
    }
    animate();
})();

const navbar = document.getElementById('navbar');
const scrollTopBtn = document.getElementById('scrollTop');
const sections = document.querySelectorAll('section');
const navLinksAll = document.querySelectorAll('.nav-links a:not(.nav-cta)');

function onScroll() {
    const scrollY = window.scrollY;
    navbar.classList.toggle('scrolled', scrollY > 50);
    scrollTopBtn.classList.toggle('visible', scrollY > 500);

    let current = '';
    sections.forEach(sec => {
        if (scrollY >= sec.offsetTop - 120) current = sec.getAttribute('id');
    });
    navLinksAll.forEach(link => {
        link.classList.toggle('active', link.getAttribute('href') === '#' + current);
    });
}

window.addEventListener('scroll', onScroll, { passive: true });
scrollTopBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

const menuToggle = document.getElementById('menuToggle');
const navLinks = document.getElementById('navLinks');
const mobileOverlay = document.getElementById('mobileOverlay');

function toggleMenu() {
    menuToggle.classList.toggle('active');
    navLinks.classList.toggle('open');
    mobileOverlay.classList.toggle('active');
    document.body.style.overflow = navLinks.classList.contains('open') ? 'hidden' : '';
}

menuToggle.addEventListener('click', toggleMenu);
mobileOverlay.addEventListener('click', toggleMenu);
document.querySelectorAll('.nav-links a').forEach(link => {
    link.addEventListener('click', () => { if (navLinks.classList.contains('open')) toggleMenu(); });
});

const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => { if (entry.isIntersecting) entry.target.classList.add('visible'); });
}, { threshold: 0.15, rootMargin: '0px 0px -50px 0px' });

document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

const contactForm = document.getElementById('contactForm');
const successMessage = document.getElementById('successMessage');
const btnSend = document.getElementById('btnSend');

function createHeartBurst(x, y) {
    const hearts = ['💖', '💗', '💕', '❤️', '🩷', '💘', '💝'];
    for (let i = 0; i < 12; i++) {
        const heart = document.createElement('span');
        heart.className = 'heart-burst';
        heart.textContent = hearts[Math.floor(Math.random() * hearts.length)];
        const angle = (Math.PI * 2 / 12) * i;
        const distance = 80 + Math.random() * 120;
        heart.style.left = x + 'px';
        heart.style.top = y + 'px';
        heart.style.setProperty('--tx', Math.cos(angle) * distance + 'px');
        heart.style.setProperty('--ty', (Math.sin(angle) * distance - 60) + 'px');
        heart.style.setProperty('--rot', ((Math.random() - 0.5) * 720) + 'deg');
        heart.style.fontSize = (0.8 + Math.random() * 0.8) + 'rem';
        document.body.appendChild(heart);
        setTimeout(() => heart.remove(), 1200);
    }
}

contactForm.addEventListener('submit', function (e) {
    e.preventDefault();
    
    // Đổi UI sang trạng thái đang gửi
    const originalText = btnSend.innerHTML;
    btnSend.innerHTML = '<span>Sending...</span> ⏳';
    btnSend.disabled = true;

    // Lấy dữ liệu từ form
    const formData = new FormData(contactForm);

    // Gửi data tới FormSubmit qua AJAX
    fetch(contactForm.action, {
        method: 'POST',
        body: formData,
        headers: {
            'Accept': 'application/json'
        }
    })
    .then(response => response.json())
    .then(data => {
        // Gửi thành công, chạy animation trái tim khum bị redirect
        const rect = btnSend.getBoundingClientRect();
        createHeartBurst(rect.left + rect.width / 2, rect.top + rect.height / 2);
        
        setTimeout(() => {
            contactForm.style.display = 'none';
            document.querySelector('.love-letter-header').style.display = 'none';
            successMessage.classList.add('show');
        }, 600);
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Có lỗi xảy ra, vui lòng thử lại sau! / An error occurred, please try again.');
        btnSend.innerHTML = originalText;
        btnSend.disabled = false;
    });
});

onScroll();