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
    'seasons-post': {
        title: "I yearn to experience every season with you",
        meta: "Personal • August 2026 • 3 min read",
        img: "https://lh3.googleusercontent.com/d/17k45bP4cOR4V6p3c75rOLn8oJPH7ObwE",
        content: `
            <p style="font-style: italic; line-height: 1.8; text-align: center; max-width: 600px; margin: 0 auto; font-family: var(--font-heading);">
            Habang sumisilip ang liwanag sa pag-ikot ng mundo<br>
            Dito sa bulaklak na to, inukit ang pangako sa'yo<br>
            Isang tapat na pag-ibig na kailanman ay hindi kukupas<br>
            Hudyat ng simula ng kwento nating walang wakas.<br><br>

            Sabik akong salubungin ang lambing ng Tagsibol<br>
            Hawak ang kamay mo habang mundo’y tahimik pa<br>
            Marinig ang pag-asa sa bawat umaga<br>
            Walang ibang hiling kundi makasama ka tuwina<br><br>

            Sabik ako sa init at liwanag ng Tag-araw<br>
            Kung saan ang saya'y malaya at umaapaw<br>
            Tawanan nating parang kantang walang kupas<br>
            Lahat ng lungkot nawawala sa'yong bawat yakap<br><br>

            Sabik ako sa banayad na hangin ng Taglagas<br>
            Kapag mga tuyong dahon ay nagsisimulang malagas<br>
            Sabay maglalakad sa ilalim ng hubad na mga sanga<br>
            Banayad ang paghinga kapiling ka<br><br>

            Sabik ako sa matinding ginaw ng Taglamig<br>
            Kung kailan mahaba ang gabi at tahimik ang paligid<br>
            Hawak-kamay nating itataboy ang bawat unos<br>
            Init ng pag-ibig natin ang mananaig hanggang lubos<br><br>

            Gusto kong mabuhay sa bawat taong daraan<br>
            Hindi lang sa init ng araw, kundi pati sa gitna ng ulan<br>
            Sa paglipas ng panahon, hindi magbabago to<br>
            Sabik akong maranasan ang bawat panahon kasama mo
            </p>
        `
    },
    'academic-post': {
        title: "What studying physics is really like.",
        meta: "Academic • August 2026 • 5 min read",
        img: "https://lh3.googleusercontent.com/d/1aETEUnCPy9J3RS-o7h8v_GTsoitA1p3s",
        content: `
            <p>Most people probably imagine studying physics as solving problems at the back of a textbook, covering a whiteboard with equations, and eventually having that one big <em>“eureka”</em> moment when everything suddenly makes sense. Sometimes it is like that. But most of the time, it is much less exciting. A lot of it is sitting in front of the same problem for hours, trying different things, getting stuck, and wondering why something that looked simple on paper isn't working when you actually try to do it.</p>
            <p>Studying gravitational physics and black hole dynamics has made me realize that understanding the theory is only part of the work. The other part is being patient enough to deal with everything that comes with actually using it. When I'm writing simulations for dark matter around a Kerr-Newman black hole, I'm rarely sitting there feeling like I'm uncovering some great secret about the universe. Most of the time, I'm trying to figure out why a calculation suddenly gives me <code>NaN</code>, why an integration isn't converging, or why the result looks completely wrong even though I thought I did everything correctly.</p>
            <p>There are days when I spend hours checking the same equations, going through my code line by line, changing parameters, and running the simulation again just to get another error. Sometimes I find the problem quickly. Other times, I realize that something I had been working on for hours came from a small mistake that I could have avoided in the first place. And honestly, it can get frustrating. There are moments when I question whether I actually understand what I'm doing.</p>
            <p>But then, every once in a while, something finally works. The code runs. The simulation finishes. A plot appears on the screen, and for once, it actually looks like what I expected. Those moments aren't dramatic. There isn't really a <em>“eureka!”</em> moment with music playing in the background. It's usually just me staring at the screen for a while, realizing that the thing I had been struggling with finally makes sense.</p>
            <p>I think that's what studying physics has really been like for me. It's not always about knowing the answer. Sometimes, it's about being willing to stay with the problem long enough to find it.</p>
        `
    },
    /* 'black-hole-time-post': {
        title: "Why Time Behaves Differently Near a Black Hole",
        meta: "Academic • August 2026 • 8 min read",
        img: "https://lh3.googleusercontent.com/d/1H-YIuIdKzRgPmHtgKyImPlnxpP0jY6ib",
        content: `
            <h2>Why Time Behaves Differently Near a Black Hole</h2>
            <blockquote><strong>“Time is relative.” — Albert Einstein</strong></blockquote>
            <p>We often think of time as the one thing in the universe that never changes. A second is a second, an hour is an hour, and a day is a day. No matter where we are, we intuitively imagine that time flows at the same rate for everyone. This idea is so deeply connected to our everyday experience that it is difficult to imagine anything else. Yet, more than a century ago, Albert Einstein showed that this simple picture of time is not quite correct. Time is not universal. It depends on the observer, their motion, and even the gravitational environment in which they exist.</p>
            <p>One of the most fascinating places where this becomes apparent is near a black hole.</p>
            <p>A black hole is often described as an object with gravity so strong that not even light can escape from it. While this is true, it does not fully capture what makes black holes remarkable. A black hole does not simply pull objects inward; it profoundly changes the geometry of spacetime around it. Because time is part of spacetime, the passage of time itself is affected.</p>
            <p>This phenomenon is known as <strong>gravitational time dilation</strong>.</p>
            <p>To understand it, imagine two people with identical clocks. One person remains far away from a black hole, while the other travels toward it. They synchronize their clocks before separating. From the perspective of the person far away, the clock carried by the person approaching the black hole begins to run more slowly. The closer the person gets to the black hole, the greater the difference becomes.</p>
            <p>At first, this sounds as though the clock itself is being physically damaged by gravity. But that is not what is happening. If the person near the black hole looks at their own clock, everything appears perfectly normal. Their seconds still feel like seconds, their heartbeat feels normal, and their thoughts proceed normally. The difference only becomes apparent when their clock is compared with another clock located farther away.</p>
            <p>The reason lies in Einstein's theory of <strong>general relativity</strong>.</p>
            <p>Before Einstein, Newtonian physics treated space and time as essentially separate and absolute. Time was imagined as something that flowed uniformly throughout the universe. Einstein's theory replaced this picture with the idea of <strong>spacetime</strong>—a four-dimensional combination of three dimensions of space and one dimension of time.</p>
            <p>Matter and energy influence the geometry of spacetime, and that geometry determines how objects and light move through it.</p>
            <p>Einstein expressed this relationship mathematically through his famous field equation:</p>
            <p class="blog-equation">Gμν = (8πG / c⁴) Tμν</p>
            <p>Although the equation looks intimidating, its basic idea can be expressed much more simply:</p>
            <p class="blog-equation"><strong>Matter and energy curve spacetime.</strong></p>
            <p>The left side describes the geometry of spacetime, while the right side describes matter and energy. A massive object such as Earth therefore changes the geometry around it. A star produces a stronger effect. A black hole produces an extreme distortion of spacetime.</p>
            <p>And because time is part of spacetime, the geometry of spacetime affects how different observers measure elapsed time.</p>
            <p>We can see this mathematically by considering a simple black hole: a <strong>non-rotating, uncharged black hole</strong>, described by the Schwarzschild solution. The Schwarzschild metric is:</p>
            <p class="blog-equation">ds² = −(1 − 2GM/rc²)c²dt² + (1 − 2GM/rc²)⁻¹dr² + r²dΩ²</p>
            <p>For someone unfamiliar with relativity, this equation may look complicated, but we do not need to understand every part of it to understand the central idea. The important factor is:</p>
            <p class="blog-equation">1 − 2GM/rc²</p>
            <p>Here, G is the gravitational constant, M is the mass of the black hole, r is the distance from its center, and c is the speed of light.</p>
            <p>If an observer remains at a fixed distance from the black hole, the spatial-motion terms can be ignored for the moment. The relationship between the time measured by that observer's own clock, called <strong>proper time</strong> (dτ), and the time coordinate (dt) used by a distant observer becomes:</p>
            <p class="blog-equation"><strong>dτ = √(1 − 2GM/rc²) dt</strong></p>
            <p>This equation is one of the simplest ways to see gravitational time dilation.</p>
            <p>The quantity dτ represents the small amount of time measured by the clock near the black hole. The quantity dt represents the corresponding time coordinate associated with a distant observer. The square-root factor determines how different the two measurements are.</p>
            <p>Far away from the black hole, r is very large. In that situation:</p>
            <p class="blog-equation">2GM/rc² ≈ 0</p>
            <p>so the equation becomes approximately:</p>
            <p class="blog-equation">dτ ≈ dt</p>
            <p>In other words, far from the black hole, the difference is extremely small.</p>
            <p>As the observer moves closer, however, r becomes smaller. The quantity 2GM/rc² becomes larger, causing the square-root factor to become smaller. Therefore:</p>
            <p class="blog-equation">dτ &lt; dt</p>
            <p>The clock closer to the black hole accumulates less proper time compared with the distant observer.</p>
            <p>We can illustrate this without using a real black hole. Suppose the gravitational time-dilation factor at some location were:</p>
            <p class="blog-equation">√(1 − 2GM/rc²) = 0.5</p>
            <p>Then:</p>
            <p class="blog-equation">dτ = 0.5 dt</p>
            <p>If one hour passes according to the distant observer, only thirty minutes pass according to the clock near the black hole.</p>
            <p>The person near the black hole would not experience those thirty minutes as being unusually slow. Their clock would still appear completely normal to them. If they waited for one minute according to their own clock, they would experience exactly one normal minute.</p>
            <p>This is one of the most important ideas in relativity: <strong>there is no contradiction in two observers experiencing different amounts of elapsed time.</strong></p>
            <p>The difference becomes especially dramatic near the black hole's <strong>event horizon</strong>.</p>
            <p>For a non-rotating, uncharged black hole, the event horizon is located at the Schwarzschild radius:</p>
            <p class="blog-equation"><strong>rₛ = 2GM/c²</strong></p>
            <p>This equation tells us something remarkable. The Schwarzschild radius depends only on the mass of the black hole. The more massive the black hole, the larger its event horizon.</p>
            <p>For example, if an object were compressed sufficiently so that its mass occupied a region smaller than its Schwarzschild radius, an event horizon would form.</p>
            <p>As r approaches rₛ, the time-dilation factor √(1 − 2GM/rc²) approaches zero. In Schwarzschild coordinates, a distant observer therefore sees a clock approaching the event horizon become increasingly slow.</p>
            <p>This is where the popular idea that <strong>“time stops at a black hole”</strong> comes from.</p>
            <p>However, saying that time literally stops at the event horizon can be misleading.</p>
            <p>Imagine an astronaut falling toward a black hole. From the perspective of a distant observer, the astronaut appears to slow down as they approach the event horizon. The light coming from the astronaut also becomes increasingly redshifted and delayed. Eventually, the distant observer receives signals from the astronaut that are extraordinarily stretched and faint.</p>
            <p>But the astronaut experiences something very different.</p>
            <p>According to their own clock, time continues normally. They do not suddenly freeze when crossing the event horizon. They experience a finite amount of proper time during their journey and, for a sufficiently large black hole, could cross the event horizon without noticing anything particularly special at that exact location.</p>
            <p>This apparent contradiction is resolved by recognizing that <strong>the distant observer and the falling astronaut are not measuring the same notion of elapsed time</strong>.</p>
            <p>The distant observer's coordinate description makes the crossing appear to take an infinitely long amount of time, while the astronaut's proper time tells them that the crossing occurs after a finite duration.</p>
            <p>This distinction between coordinate time and proper time is essential to understanding black holes.</p>
            <p>It also reveals something profound about the nature of time itself.</p>
            <p>Time is not a universal clock hanging somewhere in the background of the universe. Every observer carries their own clock, and that clock measures the amount of proper time along their particular path through spacetime. Two observers can begin together, separate, follow different paths, and later reunite having experienced different amounts of elapsed time.</p>
            <p>This idea is not restricted to black holes.</p>
            <p>Earth itself produces gravitational time dilation. A clock closer to Earth's surface experiences a slightly stronger gravitational field than a clock farther away. Consequently, the clocks do not tick at exactly the same rate.</p>
            <p>The difference is extremely small under ordinary conditions, but modern technology has to account for it. Satellite navigation systems, for example, rely on extremely precise clocks, and relativistic effects must be included to maintain accurate positioning.</p>
            <p>Black holes simply provide an environment where this otherwise tiny effect becomes extraordinarily large.</p>
            <p>There is another important point worth emphasizing. When physicists say that time “slows down” near a black hole, they do not mean that gravity is physically slowing the mechanisms inside a clock. If we placed an atomic clock near the black hole, its atoms would still behave normally according to their local environment. A mechanical clock would still tick normally. A person's heartbeat would still feel normal.</p>
            <p>The difference exists when we compare measurements made at different locations in curved spacetime.</p>
            <p>In this sense, gravitational time dilation is not really about clocks.</p>
            <p><strong>It is about spacetime itself.</strong></p>
            <p>This is what makes the phenomenon so profound.</p>
            <p>A clock is simply a device that counts physical processes. If time itself were universal, every clock everywhere would always agree after being synchronized. General relativity tells us that this is not the case. The geometry of spacetime determines how much proper time passes along different paths.</p>
            <p>We can therefore think of the equation dτ = √(1 − 2GM/rc²) dt not merely as an equation describing a clock, but as an equation describing how spacetime relates the experiences of different observers.</p>
            <p>The closer we move toward a black hole, the more dramatically the geometry of spacetime affects the relationship between their clocks.</p>
            <p>This leads to an extraordinary thought experiment.</p>
            <p>Imagine that Alice travels close to a massive black hole while Bob remains far away. Alice spends what she experiences as one hour near the black hole before returning. Depending on the circumstances, Bob could experience much more time during the same journey.</p>
            <p>Alice might return to find that years have passed for Bob while she has aged by only a much smaller amount.</p>
            <p>The idea sounds like science fiction, but the underlying physics comes directly from general relativity. The practical problem is that remaining extremely close to a black hole without falling through the event horizon would require enormous acceleration, and real black-hole environments are far more complicated than the simple idealized equations suggest.</p>
            <p>Nevertheless, the principle remains.</p>
            <p>Different paths through spacetime can contain different amounts of proper time.</p>
            <p>And this brings us back to Einstein's simple statement:</p>
            <blockquote><strong>“Time is relative.”</strong></blockquote>
            <p>It is easy to interpret those words as simply meaning that different people have different opinions about time. That is not what Einstein meant.</p>
            <p>He meant something much deeper.</p>
            <p>The amount of time that passes between events can depend on the observer's motion and position in a gravitational field. There is no single universal clock that dictates exactly how much time must pass for everyone in the universe.</p>
            <p>Near a black hole, this principle becomes impossible to ignore.</p>
            <p>The black hole bends spacetime so intensely that the difference between the passage of time for observers at different locations can become enormous. Light becomes strongly redshifted. Clocks separated by different gravitational environments accumulate different amounts of proper time. And the event horizon creates a boundary beyond which information cannot escape to the distant universe.</p>
            <p>Yet perhaps the most fascinating lesson is not that <strong>time becomes slow near a black hole</strong>.</p>
            <p>It is that there is no single universal rate at which time must flow in the first place.</p>
            <p>For each observer, their own clock always seems normal. Their own second remains a second. Their own heartbeat remains a heartbeat. What changes is the relationship between their experience and the experience of another observer following a different path through spacetime.</p>
            <p>A black hole therefore does more than challenge our understanding of gravity. It challenges our most basic intuition about reality.</p>
            <p>We grow up believing that space is simply the place where things happen and that time is the universal clock that tells us when they happen. Einstein showed us that this picture is incomplete.</p>
            <p>Space and time are connected.</p>
            <p>Gravity changes spacetime.</p>
            <p>And because time is part of spacetime, <strong>gravity changes the way time is experienced and measured.</strong></p>
            <p>That is why time behaves differently near a black hole.</p>
            <p>Not because the universe has found a way to break the clock, but because <strong>the clock has always been part of the universe it is trying to measure.</strong></p>
        `
    }, */
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
        title: "Sonder on a Train",
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
            <p>Hindi naging madali ang daan. Maraming gabing puyat sa pag-aaral, pagcodes para sa mga simulation, at pagderive ng equations. (Funny story, informal writing) There was this one time when I was solving Sturm Liouville theory related problem, welp, di ko talaga makuha yung sagot and out of hope, well, I decided to sleep. But guess what? At 3 AM, nagising ako coz all I could think about were the equations na lumilipad hahaha. Anyway, going back... Ngunit sa likod ng bawat hirap, mayroong halakhak at mga tagumpay na kasama ang mga kaibigan. Ang mga larawang ito ang patunay na naging masaya at makahulugan ang apat na taon na iyon. Bawat kuha ay may kuwento ng pagsisikap at ligaya.</p>
            <p>Ngayong natapos na ang yugtong ito, baon ko ang mga alaala ng bawat tawanan sa hallway, bawat kaba bago ang exam, at ang walang kapantay na saya kapag sa wakas ay nakuha ang tamang sagot. Maraming salamat sa apat na taon, PUP!</p>
        `
    },
    'changed-habits-post': {
        title: "Marahil pati aninong ito, ay nagbago na",
        meta: "Personal • August 2026 • 3 min read",
        img: "https://lh3.googleusercontent.com/d/15IYjjbInP-htjFskwHeCzc1Q7ajoBBEi",
        content: `
            <blockquote><strong>“You won't catch me in any clubs, but you'll definitely find me at some coffee shops sitting in the corner alone quietly while sipping my fav drink.”</strong></blockquote>
            <p>I saw this line in a TikTok post, and it made me wonder how much I have changed.</p>
            <p>It feels really different now. Back in high school, I enjoyed going to fiestas and partying with friends, drinking liquor, staying out late, and laughing non-stop. I liked the feeling of having everyone around, not really thinking too much about tomorrow, and just enjoying whatever was happening at the moment. Those were good times, and I don't regret them. They were part of who I was back then. But somehow, as the years passed, I started finding myself more comfortable with quieter things. I don't feel the same need to always be somewhere crowded or surrounded by people just to have a good time. That doesn't mean I don't enjoy hanging out with my friends anymore. I still do, and I still enjoy the conversations, the jokes, and the random moments we share. I just don't feel like I always need a crowd or a party to enjoy myself. Now, a simple coffee, a quiet place, and a little time to myself can feel just as fulfilling.</p>
            <p>Kung tutuusin, hindi ko rin alam kung gaano ako nagbago. Siguro pati ang anino ko, iba na rin ang anyo kaysa dati.</p>
            <p>Maybe that's what growing up is-slowly becoming someone different. Not in some dramatic way, but in small things you don't really notice until you look back. The places you feel comfortable in start to change, the things you look forward to become different, and even the way you spend your free time starts to feel unfamiliar compared to before.</p>
            <p>We keep changing whether we notice it or not, and I don't know what kind of person I'll become years from now. I don't know what places I'll go to, who I'll spend my time with, or what things I'll find important by then. But in ten years, I still want to be the same Carl my mom used to know. I hope that even as my habits, the places I go, and the way I spend my time change, I keep the parts of myself that matter. I want to grow, but I don't want to grow so far away from myself that I forget where I came from.</p>
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