// Smooth scrolling and active navigation
document.querySelectorAll('.nav-link').forEach(link => {
    const href = link.getAttribute('href');
    if (!href || !href.startsWith('#')) return;

    link.addEventListener('click', function(e) {
        e.preventDefault();
        const targetId = href;
        const targetSection = document.querySelector(targetId);
        if (targetSection) {
            targetSection.scrollIntoView({ behavior: 'smooth' });
        }
    });
});

// Hamburger menu functionality
const hamburger = document.querySelector('.hamburger');
const navMenu = document.querySelector('.nav-menu');

if (hamburger) {
    hamburger.addEventListener('click', function() {
        if (navMenu.classList.contains('mobile-active')) {
            navMenu.classList.remove('mobile-active');
            navMenu.style.display = 'none';
        } else {
            navMenu.classList.add('mobile-active');
            navMenu.style.display = 'flex';
            navMenu.style.flexDirection = 'column';
            navMenu.style.position = 'absolute';
            navMenu.style.top = '100%';
            navMenu.style.left = '0';
            navMenu.style.width = '100%';
            navMenu.style.backgroundColor = 'var(--bg-card)';
            navMenu.style.padding = '1.5rem';
            navMenu.style.borderBottom = '1px solid var(--border-color)';
            navMenu.style.gap = '1.2rem';
        }
    });
}

// Close menu when a link is clicked
document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', function() {
        if (navMenu && navMenu.classList.contains('mobile-active')) {
            navMenu.classList.remove('mobile-active');
            navMenu.style.display = 'none';
        }
    });
});

// Intersection Observer for scroll animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver(function(entries) {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
            observer.unobserve(entry.target);
        }
    });
}, observerOptions);

// Observe all cards for animation
document.querySelectorAll('.slide-up').forEach(card => {
    observer.observe(card);
});



// Active navigation link highlighting
window.addEventListener('scroll', function() {
    let current = '';
    
    document.querySelectorAll('section').forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;
        
        if (window.scrollY >= sectionTop - 250) {
            current = section.getAttribute('id');
        }
    });
    
    document.querySelectorAll('.nav-menu .nav-link').forEach(link => {
        // Exclude theme toggle button
        if (link.id === 'theme-toggle') return;
        
        const href = link.getAttribute('href');
        if (href === `#${current}`) {
            link.style.opacity = '1';
            link.style.color = 'var(--primary-olive)';
            link.style.fontWeight = '700';
        } else {
            link.style.opacity = '0.8';
            link.style.color = 'var(--text-primary)';
            link.style.fontWeight = '500';
        }
    });
});

// Add stagger animation to cards on load
window.addEventListener('load', function() {
    const cards = document.querySelectorAll('.slide-up');
    cards.forEach((card, index) => {
        card.style.transitionDelay = `${index * 0.08}s`;
    });
});

// Keyboard navigation
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        // Close mobile menu if open
        if (navMenu && navMenu.classList.contains('mobile-active')) {
            navMenu.classList.remove('mobile-active');
            navMenu.style.display = 'none';
        }
    }
});

// Theme toggle (persisted in localStorage)
function applyTheme(theme) {
    if (theme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
        const btn = document.getElementById('theme-toggle');
        if (btn) { 
            btn.setAttribute('aria-pressed', 'true'); 
            btn.textContent = '🌙'; 
        }
    } else {
        document.documentElement.removeAttribute('data-theme');
        const btn = document.getElementById('theme-toggle');
        if (btn) { 
            btn.setAttribute('aria-pressed', 'false'); 
            btn.textContent = '☀️'; 
        }
    }
}

function initThemeToggle() {
    const saved = localStorage.getItem('theme');
    if (saved) {
        applyTheme(saved);
    } else {
        applyTheme('dark');
    }

    const toggle = document.getElementById('theme-toggle');
    if (toggle) {
        toggle.addEventListener('click', function() {
            const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
            const next = isDark ? 'light' : 'dark';
            applyTheme(next);
            localStorage.setItem('theme', next);
        });
    }
}

window.addEventListener('DOMContentLoaded', initThemeToggle);

// --- Combined Search & Category Filtering ---
function initFiltering() {
    const searchInput = document.getElementById('search-input');
    const filterBtns = document.querySelectorAll('.filter-btn');
    const cards = document.querySelectorAll('.project-card, .cert-card');

    function filterWorks() {
        const searchQuery = searchInput ? searchInput.value.toLowerCase().trim() : '';
        const activeBtn = document.querySelector('.filter-btn.active');
        const activeFilter = activeBtn ? activeBtn.getAttribute('data-filter') : 'all';

        cards.forEach(card => {
            const heading = card.querySelector('h3, h4');
            const title = heading ? heading.textContent.toLowerCase() : '';
            
            const descPara = card.querySelector('.description, .desc');
            const desc = descPara ? descPara.textContent.toLowerCase() : '';
            
            const metaSpan = card.querySelector('.project-meta');
            const meta = metaSpan ? metaSpan.textContent.toLowerCase() : '';
            
            const category = card.getAttribute('data-category') || '';

            const matchesSearch = title.includes(searchQuery) || desc.includes(searchQuery) || meta.includes(searchQuery);
            const matchesFilter = activeFilter === 'all' || category === activeFilter;

            if (matchesSearch && matchesFilter) {
                card.classList.remove('hidden');
                card.style.opacity = '1';
                card.style.transform = 'scale(1)';
            } else {
                card.classList.add('hidden');
            }
        });
    }

    if (searchInput) {
        searchInput.addEventListener('input', filterWorks);
    }

    filterBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            filterBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            filterWorks();
        });
    });
}

window.addEventListener('DOMContentLoaded', initFiltering);

// --- Interactive Gravity Demo (Telemetry clean-up) ---
function initGravityDemo() {
    const canvas = document.getElementById('gravity-demo');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const W = canvas.width;
    const H = canvas.height;
    
    // Central mass parameters
    const M = 12000; // mass scalar
    const G = 0.5;   // gravitational constant
    const cx = W / 2, cy = H / 2;

    // Particle state
    let px = W * 0.2, py = H * 0.5;
    let vx = 0, vy = -0.8;

    let running = true;
    let loopId = null;

    function step() {
        if (!running) return;
        ctx.clearRect(0, 0, W, H);

        // Draw gravity field lines (subtle background circles)
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.02)';
        ctx.lineWidth = 1;
        for (let rCircle = 40; rCircle < Math.max(W, H); rCircle += 40) {
            ctx.beginPath();
            ctx.arc(cx, cy, rCircle, 0, Math.PI * 2);
            ctx.stroke();
        }

        // Draw central mass
        ctx.beginPath();
        const sunGrad = ctx.createRadialGradient(cx, cy, 2, cx, cy, 14);
        sunGrad.addColorStop(0, '#FFF59D');
        sunGrad.addColorStop(0.3, '#FBC02D');
        sunGrad.addColorStop(1, 'rgba(245, 127, 23, 0.2)');
        ctx.fillStyle = sunGrad;
        ctx.arc(cx, cy, 14, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.beginPath();
        ctx.fillStyle = '#FFF59D';
        ctx.arc(cx, cy, 6, 0, Math.PI * 2);
        ctx.fill();

        // Compute vector from particle to center
        const dx = cx - px;
        const dy = cy - py;
        const r2 = dx * dx + dy * dy;
        const r = Math.sqrt(r2) || 1;

        // Gravitational acceleration magnitude
        const a = G * M / (r2 + 25);
        const ax = (dx / r) * a;
        const ay = (dy / r) * a;

        // Integrate
        vx += ax * 0.016;
        vy += ay * 0.016;
        px += vx * 0.016 * 60;
        py += vy * 0.016 * 60;

        // Draw particle
        ctx.beginPath();
        const partGrad = ctx.createRadialGradient(px, py, 1, px, py, 6);
        partGrad.addColorStop(0, '#E0F7FA');
        partGrad.addColorStop(0.4, '#00ACC1');
        partGrad.addColorStop(1, 'rgba(0, 172, 193, 0)');
        ctx.fillStyle = partGrad;
        ctx.arc(px, py, 6, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.beginPath();
        ctx.fillStyle = '#E0F7FA';
        ctx.arc(px, py, 2, 0, Math.PI * 2);
        ctx.fill();

        // Draw velocity vector line
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(0, 172, 193, 0.4)';
        ctx.lineWidth = 1.5;
        ctx.moveTo(px, py);
        ctx.lineTo(px + vx * 25, py + vy * 25);
        ctx.stroke();

        if (r < 18) {
            running = false;
            setTimeout(resetOrbit, 1200);
        } else if (r > Math.max(W, H) * 0.9) {
            running = false;
            setTimeout(resetOrbit, 1200);
        }

        loopId = requestAnimationFrame(step);
    }

    function resetOrbit() {
        px = W * 0.2; 
        py = H * 0.5; 
        vx = 0; 
        vy = -0.8;
        if (!running) {
            running = true;
            cancelAnimationFrame(loopId);
            step();
        }
    }

    // click to apply impulse toward/away from cursor
    canvas.addEventListener('click', function(e) {
        const rect = canvas.getBoundingClientRect();
        const mx = ((e.clientX - rect.left) / rect.width) * W;
        const my = ((e.clientY - rect.top) / rect.height) * H;
        
        vx += (px - mx) * 0.01;
        vy += (py - my) * 0.01;
    });

    const resetBtn = document.getElementById('gravity-reset');
    if (resetBtn) {
        resetBtn.addEventListener('click', resetOrbit);
    }

    step();
}

window.addEventListener('DOMContentLoaded', initGravityDemo);

// Set Year
const yearSpan = document.getElementById('year');
if (yearSpan) {
    yearSpan.textContent = new Date().getFullYear();
}

// Profile image slideshow auto-rotation
const profileImages = document.querySelectorAll('.profile-container .profile-img');
if (profileImages.length > 1) {
    let currentIndex = 0;
    setInterval(() => {
        profileImages[currentIndex].classList.remove('active');
        currentIndex = (currentIndex + 1) % profileImages.length;
        profileImages[currentIndex].classList.add('active');
    }, 4500); // changes image every 4.5 seconds
}

// PUP graduation card slideshow (1-second fps)
const pupCardImg = document.querySelector('#pup-blog-card .blog-image');
if (pupCardImg) {
    const pupImages = [
        "https://lh3.googleusercontent.com/d/1mrGtdU1wxrwaxlw63338d5DtwF8B4Bu_",
        "https://lh3.googleusercontent.com/d/1uWgDrois3OgReBCgwnEERvUJZBiivDxJ",
        "https://lh3.googleusercontent.com/d/1p9EKbLLgXgXpGXCUZG9zVjiPGTUBzKgy",
        "https://lh3.googleusercontent.com/d/1OmlTOoolf095jENYbhUg9CQx5j89zutz",
        "https://lh3.googleusercontent.com/d/18PDyuPctgQJPMqCrOTelUgcBR75JH9WF",
        "https://lh3.googleusercontent.com/d/1sRBLd1MpjeRvAsuBSVbsACqy1hw7PkG_",
        "https://lh3.googleusercontent.com/d/10dA6i5P1QqgTKzrokNsltYHfvHBR6JRx",
        "https://lh3.googleusercontent.com/d/19QTIEgCiUj5MPdT9QsLV888v4aunL4sm",
        "https://lh3.googleusercontent.com/d/1rHDpspGMcpN_uHXA20MEnPUeMtvrenW6",
        "https://lh3.googleusercontent.com/d/1WFwrFv_9fcRubsKqEkyfQKg0Qyw8PeH1",
        "https://lh3.googleusercontent.com/d/1DTzg3NQnOFGzZlBUgx2oa10yYWrcYND0"
    ];
    let currentPupIndex = 0;
    setInterval(() => {
        currentPupIndex = (currentPupIndex + 1) % pupImages.length;
        pupCardImg.style.backgroundImage = `url('${pupImages[currentPupIndex]}')`;
    }, 1000);
}

// Blog Modal Functionality
const blogPosts = {
    'academic-post': {
        title: "The Art of Embracing Frustration: What Studying Physics is Really Like",
        meta: "Academic • August 2026 • 5 min read",
        img: "https://lh3.googleusercontent.com/d/1aETEUnCPy9J3RS-o7h8v_GTsoitA1p3s",
        content: `
            <p>Most people think studying physics is about solving neat, idealized problems at the back of a textbook, or having sudden, dramatic "eureka" moments under a starry night. They picture whiteboards covered in flawless derivations that look immediately beautiful. In reality, it is a long, slow process of learning how to sit with frustration. You spend days staring at a single integration problem or a line of code that refuses to compile, wondering if you actually understand any of it at all.</p>
            <p>Specializing in gravitational physics and black hole dynamics has taught me that the hardest part isn't the complex theory itself; it's the sheer endurance required. When I am writing simulation scripts to calculate dark matter spikes around a Kerr-Newman black hole, I don't feel like a genius unlocking the secrets of the cosmos. Most of the time, I feel like a mechanic trying to figure out why a coordinate conversion is throwing a NaN error or why the numerical integrator is diverging at the boundary conditions. It is tedious, repetitive, and testing.</p>
            <p>You spend hours debugging, checking your signs, rewriting loops, and questioning your parameters. You might fill pages of scratch paper with math that leads to a dead end, only to realize you made a simple algebraic error on the second line. But that is exactly what makes the rare moments of success feel so rewarding. When the code finally runs without errors, when the curves on the plot finally line up with the theoretical predictions, it is a quiet, incredibly satisfying feeling. You realize that through all the headaches, you managed to model a small piece of physical reality. That slow, hard-earned clarity is what keeps me sitting at my desk night after night.</p>
        `
    },
    'komorebi-post': {
        title: "Komorebi: The Light that Dances Between Leaves",
        meta: "Personal • August 2026 • 3 min read",
        img: "https://lh3.googleusercontent.com/d/15eM1rKWwpZkz3Fvy4iRs4mRuMRxETTQH",
        content: `
            <p>There is a Japanese word that has always stuck with me: <i>Komorebi</i> (木漏れ日). It refers to the sunlight filtering through the leaves of trees. It's not just a word for the light itself, but for the movement, the way the wind moves the branches and shifts the patterns of light and shadow on the ground below. It describes a moment that is temporary, changing second by second as the earth rotates and the leaves sway.</p>
            <p>Watching this happen is one of the few things that can completely pull me out of my own head. When you spend most of your day staring at a laptop screen or analyzing data, your vision starts to feel narrow and rigid. Stepping outside and sitting under a canopy of trees changes that. You watch the sunbeams break through the gaps, catching tiny dust motes in the air, creating warm patches on the grass that disappear as quickly as they appear. The light doesn't fight the leaves; it just finds whatever spaces are left open.</p>
            <p>Watching this quiet dance makes all the noise in my head slow down. It doesn't solve whatever problem I am stuck on, but it makes the problem feel less heavy. It's a reminder that there is a whole world happening outside of my studies and my worries, one that doesn't care about coordinates, calculations, or deadlines. It operates on its own time, quiet and steady, and just sitting under it for a few minutes is enough to make me feel ready to go back inside and try again.</p>
        `
    },
    'tinnitus-post': {
        title: "The Ringing of Silence: Thoughts on Tinnitus",
        meta: "Personal • July 2026 • 3 min read",
        img: "https://lh3.googleusercontent.com/d/1Dg68hA9E9maHs4B95H0EYyadElJjIVbb",
        content: `
            <p>I don't really like the sound of tinnitus. It is a persistent, high-pitched hum that lives in the background of my life, occupying the space where absolute silence is supposed to be. When a room gets quiet, or when I lie down to go to sleep at night, the ringing seems to grow louder. It is a steady, unchanging frequency, a reminder of a sound that isn't actually in the room, but only exists inside my own ears.</p>
            <p>For a long time, it was incredibly frustrating. When you are trying to study or focus on a difficult task, you want quiet. But when quiet is filled with a constant ringing, it feels like you can never truly rest. You try to drown it out with static noise, white noise, or the hum of a desk fan, but you know it is still there, waiting for the moment you turn the fan off.</p>
            <p>But over time, living with it has changed how I think about silence. I've realized that waiting for a perfectly quiet room or a perfectly quiet mind is a losing battle. Silence isn't the absence of noise; it's the ability to find quiet within the noise. Instead of fighting the ringing or letting it make me anxious, I've learned to just let it exist. It has taught me a strange kind of patience. Accepting the ringing in my ears is a small, daily exercise in accepting the things I cannot control, and finding a way to be at peace even when things aren't perfectly quiet.</p>
        `
    },
    'train-post': {
        title: "Sonder on a Train: Space-Time and Connection",
        meta: "Personal • June 2026 • 3 min read",
        img: "https://lh3.googleusercontent.com/d/1atFJEVCO1X9yINlAr6d56PVAfPtbhxFO",
        content: `
            <p style="font-style: italic; line-height: 1.8; text-align: center; max-width: 500px; margin: 0 auto; font-family: var(--font-heading);">
            Everytime I sit inside a train,<br>
            Thoughts start to crowd my brain,<br>
            These people with unique memories and experiences,<br>
            Each has different stories, dreams, and views<br><br>
            
            Nearly 8 billion souls,<br>
            Every soul seeks connection,<br>
            With their family, friends, loved ones, strangers<br>
            Interacting and blending<br><br>
            
            The world is truly complex,<br>
            In the midst of this vast universe,<br>
            I'm dancing, wandering,<br>
            Asking: "What if I don’t succeed?"<br><br>
            
            The fear of dying alone,<br>
            Or living beyond ordinary,<br>
            Of not leaving a mark,<br>
            Of literally not being remembered<br><br>
            
            But the way to overcome this fear,<br>
            Is to understand you don’t need<br>
            the world to recognize your existence,<br>
            It will continue rotating, spinning, and curving space time,<br>
            The world won’t change a bit once you die<br><br>
            
            But to those who care about you,<br>
            Theirs will never be the same,<br>
            You don’t need to matter to everyone,<br>
            Having a few important people in your life is just fine<br><br>
            
            And being the best you can for them,<br>
            Is enough to leave a real impact,<br>
            That’s all you need,<br>
            In the entirety of your existence.
            </p>
        `
    },
    'epoch-post': {
        title: "Privilege of the Moment: Thoughts on Our Epoch",
        meta: "Personal • August 2026 • 3 min read",
        img: "https://lh3.googleusercontent.com/d/1Kvbj5rGJoZPvoR56OM2ifwv1sBmWP6ZS",
        content: `
            <p>I captured this photo during a quiet sunset, watching the sky turn a deep, burning orange behind the silhouette of power lines and rooftops. As I stood there watching the colors change, I couldn't help but think: "What a privilege it is to be living such moment in this epoch." We live in a time that often feels overwhelming, fast-paced, and filled with endless noise, making it easy to lose track of the simple fact of being alive.</p>
            <p>When you look at a sky like this, it makes you pause. It is a reminder that despite all the complications of the modern world, the earth still puts on these incredible displays every single evening. There is a strange, beautiful privilege in being here to see it. It is a moment of pure presence, where the worries of tomorrow or the regrets of yesterday don't seem to matter as much. Just standing under that warm, shifting light feels like enough.</p>
            <p>This photo serves as a small anchor for me. Whenever I get caught up in the stress of work, studies, or the general rush of daily life, I look back at it. It is a reminder to slow down, to step outside, and to appreciate the quiet, unforced beauty of the world we find ourselves in. We don't need to conquer the world to find peace; sometimes, we just need to be present enough to witness it.</p>
        `
    },
    'pup-post': {
        title: "Apat na taon, PUP!",
        meta: "Personal • August 2026 • 3 min read",
        images: [
            "https://lh3.googleusercontent.com/d/1mrGtdU1wxrwaxlw63338d5DtwF8B4Bu_",
            "https://lh3.googleusercontent.com/d/1uWgDrois3OgReBCgwnEERvUJZBiivDxJ",
            "https://lh3.googleusercontent.com/d/1p9EKbLLgXgXpGXCUZG9zVjiPGTUBzKgy",
            "https://lh3.googleusercontent.com/d/1OmlTOoolf095jENYbhUg9CQx5j89zutz",
            "https://lh3.googleusercontent.com/d/18PDyuPctgQJPMqCrOTelUgcBR75JH9WF",
            "https://lh3.googleusercontent.com/d/1sRBLd1MpjeRvAsuBSVbsACqy1hw7PkG_",
            "https://lh3.googleusercontent.com/d/10dA6i5P1QqgTKzrokNsltYHfvHBR6JRx",
            "https://lh3.googleusercontent.com/d/19QTIEgCiUj5MPdT9QsLV888v4aunL4sm",
            "https://lh3.googleusercontent.com/d/1rHDpspGMcpN_uHXA20MEnPUeMtvrenW6",
            "https://lh3.googleusercontent.com/d/1WFwrFv_9fcRubsKqEkyfQKg0Qyw8PeH1",
            "https://lh3.googleusercontent.com/d/1DTzg3NQnOFGzZlBUgx2oa10yYWrcYND0"
        ],
        content: `
            <p>Sa loob ng apat na taon sa Polytechnic University of the Philippines (PUP), maraming bagay ang nagbago, lumawak, at nagkaroon ng kulay. Nagsimula ang lahat sa simpleng pangarap at kuryusidad, na kalaunan ay naging mahaba at makahulugang paglalakbay. Sa apat na taon na iyon, natutunan kong mahalin ang liknayan.</p>
            <p>Hindi naging madali ang daan. Maraming gabing puyat sa pag-aaral, pagcodes para sa mga simulation, at pagderive ng equations. RE: Funny story (informal Writing). Isa sa nakakatawang nangyari sa akin is that one night when I was solving Sturm-Liouville theory problem wherein I can't get the solution and out of hope, I decided to sleep. Pero guess what, 3 AM nagising ako kasi napanaginipan ko yung problem and lumilipad yung mga equations hahaha. Anyway, going back... Ngunit sa likod ng bawat hirap, mayroong halakhak at mga tagumpay na kasama ang mga kaibigan. Ang mga larawang ito ang patunay na naging masaya at makahulugan ang apat na taon na iyon. Bawat kuha ay may kuwento ng pagsisikap at ligaya.</p>
            <p>Ngayong natapos na ang yugtong ito, baon ko ang mga alaala ng bawat tawanan sa hallway, bawat kaba bago ang exam, at ang walang kapantay na saya kapag sa wakas ay nakuha ang tamang sagot. Maraming salamat sa apat na taon, PUP!</p>
        `
    },
    'changed-habits-post': {
        title: "Marahil pati aninong ito, ay nagbago na",
        meta: "Personal • August 2026 • 3 min read",
        img: "https://lh3.googleusercontent.com/d/15IYjjbInP-htjFskwHeCzc1Q7ajoBBEi",
        content: `
            <p>"You won't catch me in any clubs, but you'll definitely find me at some coffee shops sitting in the corner alone quietly while sipping my fav drink." I saw this line in a TikTok post, and it made me wonder how much I have changed.</p>
            <p>It feels really different now. I prefer hanging out without liquor now, finding quieter places and slower moments instead. Kung tutuusin, hindi ko rin alam kung gaano ako nagbago. Siguro pati ang anino ko, iba na rin ang anyo kaysa dati.</p>
            <p>But in ten years, I still want to be the same Carl my mom used to know. I hope that even as my habits, places, and the way I spend my time change, I keep the parts of myself that matter. I want to grow without becoming unrecognizable to the people who have always known me.</p>
        `
    }
};

let modalSlideshowInterval = null;

function openBlogModal(postId) {
    if (modalSlideshowInterval) {
        clearInterval(modalSlideshowInterval);
        modalSlideshowInterval = null;
    }

    const post = blogPosts[postId];
    if (!post) return;

    document.getElementById('modal-title').textContent = post.title;
    document.getElementById('modal-meta').textContent = post.meta;
    document.getElementById('modal-text').innerHTML = post.content;

    const modalImg = document.getElementById('modal-img');
    
    if (Array.isArray(post.images)) {
        let currentSlideIndex = 0;
        modalImg.src = post.images[0];
        
        modalSlideshowInterval = setInterval(() => {
            currentSlideIndex = (currentSlideIndex + 1) % post.images.length;
            modalImg.src = post.images[currentSlideIndex];
        }, 1000);
    } else {
        modalImg.src = post.img;
    }

    const modal = document.getElementById('blog-modal');
    modal.classList.add('active');
    document.body.style.overflow = 'hidden'; // prevent background scrolling
}

function closeBlogModal(event) {
    if (modalSlideshowInterval) {
        clearInterval(modalSlideshowInterval);
        modalSlideshowInterval = null;
    }
    const modal = document.getElementById('blog-modal');
    modal.classList.remove('active');
    document.body.style.overflow = ''; // restore scrolling
}