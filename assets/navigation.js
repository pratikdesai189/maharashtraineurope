/**
 * navigation.js — Shared Navigation & Footer Component
 * Maharashtra in Europe
 *
 * Injects the <nav> and <footer> into every page.
 * Auto-detects the current page to:
 *   1. Highlight the correct active nav link.
 *   2. Resolve correct asset paths (root vs sub-folder).
 *   3. Initialise the mobile hamburger menu.
 */

(function () {
    'use strict';

    /* ── PATH UTILITIES ──────────────────────────────────────────── */
    const path = window.location.pathname;

    // Detect if we are in a sub-folder (e.g. /sahayak/ or /community/)
    // Root pages use "assets/", sub-pages use "../assets/"
    const isRoot = path === '/' || path === '/index.html' || path.split('/').filter(Boolean).length === 0;
    const assetBase = isRoot ? 'assets/' : '../assets/';
    const rootBase  = isRoot ? '/'        : '/';

    /* ── ACTIVE LINK DETECTION ───────────────────────────────────── */
    // Returns Tailwind classes for the active vs inactive nav link state
    function navLink(href, label, extraClasses) {
        const cleanPath  = path.replace(/\/index\.html$/, '/').replace(/([^/])$/, '$1/');
        const cleanHref  = href.replace(/([^/])$/, '$1/');
        const isActive   = cleanPath === cleanHref || (href === '/' && (path === '/' || path === '/index.html'));

        const activeClass   = 'text-orange-600 border-b-2 border-orange-600';
        const inactiveClass = 'hover:text-orange-600';
        const cls           = isActive ? activeClass : inactiveClass;

        return `<a href="${href}" class="${cls} ${extraClasses || ''}">${label}</a>`;
    }

    // Mobile menu active class is simpler — just bold orange text
    function mobileNavLink(href, label) {
        const cleanPath  = path.replace(/\/index\.html$/, '/').replace(/([^/])$/, '$1/');
        const cleanHref  = href.replace(/([^/])$/, '$1/');
        const isActive   = cleanPath === cleanHref || (href === '/' && (path === '/' || path === '/index.html'));

        const activeClass   = 'text-orange-600 font-bold';
        const inactiveClass = 'hover:text-orange-600';

        return `<a href="${href}" class="${isActive ? activeClass : inactiveClass}">${label}</a>`;
    }

    /* ── NAV HTML ────────────────────────────────────────────────── */
    const NAV_LINKS = [
        { href: '/',                label: 'Home' },
        { href: '/#diaspora-news',  label: 'News' },
        { href: '/sahayak/',        label: 'Sahayak' },
        { href: '/community/',      label: 'Community' },
        { href: '/students/',       label: 'Student Hub' },
        { href: '/maharashtra/',    label: 'Maharashtra' },
    ];

    const desktopLinks = NAV_LINKS.map(l => navLink(l.href, l.label)).join('\n                ');
    const mobileLinks  = NAV_LINKS.map(l => mobileNavLink(l.href, l.label)).join('\n                ');

    const navHTML = `
<nav class="bg-white py-3 px-4 md:px-6 shadow-sm sticky top-0 z-50" id="site-nav">
    <div class="max-w-7xl mx-auto flex items-center justify-between">
        <a href="/" class="flex items-center gap-3 group" aria-label="Maharashtra in Europe — Home">
            <!-- Logo with hover-to-enlarge tooltip (Option A) -->
            <div class="logo-tooltip-wrapper">
                <img src="${assetBase}logo.png" alt="Maharashtra in Europe Logo"
                    class="w-10 h-10 md:w-12 md:h-12 object-contain rounded-full cursor-pointer" style="transition:transform .2s ease" onmouseover="this.style.transform='scale(1.08)'" onmouseout="this.style.transform='scale(1)'">
                <div class="logo-tooltip">
                    <div class="logo-tooltip-card">
                        <img src="${assetBase}logo.png" alt="Maharashtra in Europe">
                        <p class="tooltip-title">Maharashtra in Europe</p>
                        <p class="tooltip-tagline">"Where the Sahyadri meets the Alps"</p>
                    </div>
                </div>
            </div>
            <div>
                <p class="font-bold text-sm md:text-lg leading-tight text-orange-600 group-hover:text-orange-700 transition-colors">Maharashtra <span class="text-gray-700 group-hover:text-gray-900 transition-colors">in Europe</span></p>
                <p class="text-[9px] md:text-[10px] text-orange-500 italic tracking-wide font-medium opacity-80">Where the Sahyadri meets the Alps</p>
            </div>
        </a>
        <!-- Desktop Menu -->
        <div class="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">
                ${desktopLinks}
        </div>

        <div class="flex items-center gap-2 md:gap-4">
            <a href="https://www.instagram.com/mheu.in?igsh=cDcwYnozOGRvNTRm&utm_source=qr" target="_blank"
                class="hidden sm:flex bg-orange-600 text-white px-4 py-2 rounded-full text-sm font-semibold items-center gap-2 hover:bg-orange-700 transition">
                <i data-lucide="users" class="w-4 h-4"></i> Join
            </a>
            <button id="menu-toggle" class="md:hidden p-2 text-gray-600 focus:outline-none" aria-label="Toggle navigation menu">
                <i data-lucide="menu" id="menu-icon" class="w-6 h-6"></i>
            </button>
        </div>
    </div>

    <!-- Mobile Menu Dropdown -->
    <div id="mobile-menu" class="md:hidden bg-white border-t mt-3">
        <div class="flex flex-col gap-4 p-4 text-sm font-medium text-gray-600">
                ${mobileLinks}
            <a href="https://www.instagram.com/mheu.in?igsh=cDcwYnozOGRvNTRm&utm_source=qr" target="_blank"
                class="bg-orange-600 text-white px-4 py-2 rounded-lg font-bold text-center">Join Community</a>
        </div>
    </div>
</nav>`;

    /* ── FOOTER HTML ─────────────────────────────────────────────── */
    const footerHTML = `
<footer class="bg-white py-12 md:py-16 px-4 md:px-6 border-t" id="site-footer">
    <div class="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-8">
        <div class="col-span-1 sm:col-span-2">
            <div class="flex items-center gap-3 mb-6">
                <img src="${assetBase}logo.png" alt="Maharashtra in Europe Logo" class="w-10 h-10 object-contain rounded-full">
                <div>
                    <p class="font-bold text-base md:text-lg leading-tight text-orange-600">Maharashtra <span class="text-gray-700">in Europe</span></p>
                    <p class="marathi text-[8px] md:text-[10px] text-gray-500">॥ महाराष्ट्रा ते युरोप, एकत्र समुदाय ॥</p>
                </div>
            </div>
            <p class="text-gray-500 text-xs leading-relaxed mb-3">Uniting Indians in Europe through support, opportunities and Maharashtrian values.</p>
            <p class="text-orange-500 text-xs italic font-medium mb-5 opacity-80">"Where the Sahyadri meets the Alps"</p>
            <div class="flex gap-3 mt-2">
                <!-- Instagram -->
                <a href="https://www.instagram.com/mheu.in?igsh=cDcwYnozOGRvNTRm&utm_source=qr" target="_blank"
                    title="Instagram"
                    class="p-2 bg-gray-100 rounded-full text-gray-600 hover:bg-orange-600 hover:text-white transition">
                    <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                </a>
                <!-- WhatsApp -->
                <a href="#" target="_blank" title="WhatsApp"
                    class="p-2 bg-gray-100 rounded-full text-gray-600 hover:bg-green-500 hover:text-white transition">
                    <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                </a>
                <!-- Facebook -->
                <a href="#" target="_blank" title="Facebook"
                    class="p-2 bg-gray-100 rounded-full text-gray-600 hover:bg-blue-600 hover:text-white transition">
                    <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                </a>
                <!-- LinkedIn -->
                <a href="https://www.linkedin.com/company/mheu/" target="_blank" title="LinkedIn"
                    class="p-2 bg-gray-100 rounded-full text-gray-600 hover:bg-blue-700 hover:text-white transition">
                    <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                </a>
            </div>
        </div>
        <div>
            <h5 class="font-bold text-xs mb-6 uppercase text-gray-400">Quick Links</h5>
            <ul class="space-y-3 text-xs text-gray-600">
                <li><a href="#" class="hover:text-orange-600">About Us</a></li>
                <li><a href="#" class="hover:text-orange-600">Our Mission</a></li>
            </ul>
        </div>
        <div>
            <h5 class="font-bold text-xs mb-6 uppercase text-gray-400">Explore</h5>
            <ul class="space-y-3 text-xs text-gray-600">
                <li><a href="/" class="hover:text-orange-600">Home</a></li>
                <li><a href="/sahayak/" class="hover:text-orange-600">Sahayak</a></li>
                <li><a href="/community/" class="hover:text-orange-600">Community</a></li>
                <li><a href="/students/" class="hover:text-orange-600">Student Hub</a></li>
                <li><a href="/maharashtra/" class="hover:text-orange-600">About Maharashtra</a></li>
            </ul>
        </div>
        <div>
            <h5 class="font-bold text-xs mb-6 uppercase text-gray-400">Contact</h5>
            <ul class="space-y-4 text-xs text-gray-600">
                <li class="flex gap-3"><i data-lucide="map-pin" class="w-4 h-4 text-orange-600"></i> Stuttgart, Germany</li>
                <li class="flex gap-3"><i data-lucide="mail" class="w-4 h-4 text-orange-600"></i> info@maharashtraineurope.com</li>
            </ul>
        </div>
    </div>
    <!-- Domain alias note -->
    <div class="mt-10 pt-5 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-2">
        <p class="text-xs text-gray-400">© 2026 Maharashtra in Europe. All rights reserved.</p>
        <p class="text-xs text-gray-400">
            Also accessible at
            <a href="https://mheu.in" target="_blank" rel="noopener"
                class="text-orange-500 font-semibold hover:underline">mheu.in</a>
            — both domains are the same community.
        </p>
    </div>
</footer>`;

    /* ── INJECTION ───────────────────────────────────────────────── */
    // Insert nav as the very first child of <body>
    document.body.insertAdjacentHTML('afterbegin', navHTML);

    // Insert footer as the last child of <body> (before the closing tag)
    document.body.insertAdjacentHTML('beforeend', footerHTML);

    // Render Lucide icons that were just injected into nav + footer.
    // Lucide is loaded synchronously in <head> so it's available here.
    if (typeof lucide !== 'undefined') lucide.createIcons();

    /* ── MOBILE HAMBURGER LOGIC ──────────────────────────────────── */
    // Runs after DOM is ready (nav already injected above synchronously)
    function initHamburger() {
        const menuToggle = document.getElementById('menu-toggle');
        const mobileMenu = document.getElementById('mobile-menu');
        const menuIcon   = document.getElementById('menu-icon');

        if (!menuToggle || !mobileMenu || !menuIcon) return;

        menuToggle.addEventListener('click', function () {
            mobileMenu.classList.toggle('open');
            const isOpen = mobileMenu.classList.contains('open');
            menuIcon.setAttribute('data-lucide', isOpen ? 'x' : 'menu');
            if (typeof lucide !== 'undefined') lucide.createIcons();
        });
    }

    // The script runs synchronously so the nav is already in the DOM.
    // We still guard with DOMContentLoaded in case the script is ever
    // moved to <head> in the future.
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initHamburger);
    } else {
        initHamburger();
    }

})();
