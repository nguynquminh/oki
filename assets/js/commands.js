document.addEventListener('DOMContentLoaded', function () {
    const searchInput = document.getElementById('searchInput');
    const filterBtns = document.querySelectorAll('.filter-btn');
    const commandCards = document.querySelectorAll('.command-card');

    let currentFilter = 'all';

    // Filter buttons functionality
    filterBtns.forEach(btn => {
        btn.addEventListener('click', function () {
            // Remove active class from all buttons
            filterBtns.forEach(b => b.classList.remove('active'));
            // Add active class to clicked button
            this.classList.add('active');

            currentFilter = this.dataset.filter;
            filterCommands();
        });
    });

    // Search functionality
    searchInput.addEventListener('input', function () {
        filterCommands();
    });

    function filterCommands() {
        const searchTerm = searchInput.value.toLowerCase();

        commandCards.forEach(card => {
            const category = card.dataset.category;
            const commandName = card.querySelector('.command-name').textContent.toLowerCase();
            const description = card.querySelector('.command-description').textContent.toLowerCase();

            const matchesFilter = currentFilter === 'all' || category === currentFilter;
            const matchesSearch = commandName.includes(searchTerm) || description.includes(searchTerm);

            if (matchesFilter && matchesSearch) {
                card.style.display = '';
                card.classList.add('visible');
            } else {
                card.style.display = 'none';
                card.classList.remove('visible');
            }
        });
    }

    // Mobile toggle
    const mobileToggle = document.getElementById('mobileToggle');
    const sidebar = document.getElementById('sidebar');
    const mobileOverlay = document.getElementById('mobileOverlay');

    mobileToggle.addEventListener('click', function () {
        sidebar.classList.toggle('open');
        mobileOverlay.classList.toggle('active');
    });

    mobileOverlay.addEventListener('click', function () {
        sidebar.classList.remove('open');
        mobileOverlay.classList.remove('active');
    });

    // Reveal animation
    const reveals = document.querySelectorAll('.reveal');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    reveals.forEach(el => observer.observe(el));
});