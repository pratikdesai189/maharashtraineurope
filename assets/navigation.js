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
        { href: '/',           label: 'Home' },
        { href: '#',           label: 'News' },
        { href: '/sahayak/',   label: 'Sahayak' },
        { href: '/community/', label: 'Community' },
        { href: '#',           label: 'Events' },
        { href: '#',           label: 'Directory' },
        { href: '#',           label: 'Jobs' },
        { href: '#',           label: 'Student Corner' },
    ];

    const desktopLinks = NAV_LINKS.map(l => navLink(l.href, l.label)).join('\n                ');
    const mobileLinks  = NAV_LINKS.map(l => mobileNavLink(l.href, l.label)).join('\n                ');

    const navHTML = `
<nav class="bg-white py-3 px-4 md:px-6 shadow-sm sticky top-0 z-50" id="site-nav">
    <div class="max-w-7xl mx-auto flex items-center justify-between">
        <div class="flex items-center gap-3">
            <img src="${assetBase}logo.png" alt="Maharashtra in Europe Logo" class="w-10 h-10 md:w-12 md:h-12 object-contain">
            <div>
                <p class="font-bold text-sm md:text-lg leading-tight text-orange-600">Maharashtra <span class="text-gray-700">in Europe</span></p>
                <p class="marathi text-[8px] md:text-[10px] text-gray-500">॥ महाराष्ट्रा ते युरोप, एकत्र समुदाय ॥</p>
            </div>
        </div>

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
                <img src="${assetBase}logo.png" alt="Maharashtra in Europe Logo" class="w-10 h-10 object-contain">
                <div>
                    <p class="font-bold text-base md:text-lg leading-tight text-orange-600">Maharashtra <span class="text-gray-700">in Europe</span></p>
                    <p class="marathi text-[8px] md:text-[10px] text-gray-500">॥ महाराष्ट्रा ते युरोप, एकत्र समुदाय ॥</p>
                </div>
            </div>
            <p class="text-gray-500 text-xs leading-relaxed mb-6">Uniting Indians in Europe through support, opportunities and Maharashtrian values.</p>
            <div class="flex gap-3">
                <a href="https://www.instagram.com/mheu.in?igsh=cDcwYnozOGRvNTRm&utm_source=qr" target="_blank"
                    class="p-2 bg-gray-100 rounded-full text-gray-600 hover:bg-orange-600 hover:text-white transition">
                    <i data-lucide="instagram" class="w-4 h-4"></i>
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
</footer>`;

    /* ── INJECTION ───────────────────────────────────────────────── */
    // Insert nav as the very first child of <body>
    document.body.insertAdjacentHTML('afterbegin', navHTML);

    // Insert footer as the last child of <body> (before the closing tag)
    document.body.insertAdjacentHTML('beforeend', footerHTML);

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
