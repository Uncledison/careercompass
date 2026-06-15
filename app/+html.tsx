import { ScrollViewStyleReset } from 'expo-router/html';
import { type PropsWithChildren } from 'react';

/**
 * This file is web-only and used to configure the root HTML for every
 * web page during static rendering.
 * The contents of this function only run in Node.js environments and
 * do not have access to the DOM or browser APIs.
 */
export default function Root({ children }: PropsWithChildren) {
    return (
        <html lang="ko">
            <head>
                <meta charSet="utf-8" />
                <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
                <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no, user-scalable=0, viewport-fit=cover" />
                <link rel="manifest" href="/manifest.json" />

                <title>자녀 진로탐색·진로가이드 | AI 진로적성검사 Career Compass</title>
                <meta name="description" content="우리 아이 맞춤 진로탐색. 성격 유형부터 추천 직업까지 AI가 분석하는 자녀 진로가이드. 5분 진로적성 검사로 강점에 맞는 진로를 찾아보세요." />
                <meta name="keywords" content="자녀 진로탐색, 자녀 진로가이드, 진로적성검사, 청소년 진로검사, 진로 찾기, AI 진로검사, 직업 추천, Career Compass" />
                <meta name="robots" content="index,follow" />
                <link rel="canonical" href="https://career.uncledison.com/" />
                <meta property="og:type" content="website" />
                <meta property="og:title" content="자녀 진로탐색·진로가이드 | AI 진로적성검사" />
                <meta property="og:description" content="성격 유형부터 추천 직업까지, AI가 분석하는 우리 아이 맞춤 진로가이드. 5분 진로적성 검사." />
                <meta property="og:url" content="https://career.uncledison.com/" />
                <meta property="og:image" content="https://fun.uncledison.com/assets/career_share_square_v2.png" />
                <meta name="google-site-verification" content="gafyxybm6dpWY1dRDbk02J00e05KAD5QRgg34khfozM" />
                {/* 네이버 인증: 코드 받으면 아래 채우기
                <meta name="naver-site-verification" content="" /> */}

                <script type="module" src="https://unpkg.com/@google/model-viewer/dist/model-viewer.min.js"></script>
                <link rel="apple-touch-icon" href="/icon.png" />
                <link rel="icon" type="image/png" sizes="192x192" href="/icon.png" />
                <link rel="icon" type="image/png" sizes="512x512" href="/icon.png" />

                {/* Using raw CSS styles to enforce non-scalable UI and prevent touch artifacts */}
                <style dangerouslySetInnerHTML={{
                    __html: `
            html, body { 
                background-color: #F2F2F7; 
                touch-action: none; /* Block all native browser gestures for zooming/panning at the root */
                overscroll-behavior: none; /* Disable pull-to-refresh and bounce */
                -webkit-text-size-adjust: 100%; 
                user-select: none; /* Prevent text selection to help with "app-like" feel */
                overflow: hidden; /* Prevent body scrolling if handled by ScrollViews */
                height: 100%;
                width: 100%;
                position: fixed; /* Extra layer for iOS to prevent scroll-to-zoom bugs */
            }
            * {
                -webkit-tap-highlight-color: transparent; 
            }
            /* Re-enable touch-action for ScrollViews if they need specific behavior */
            [data-scrollview="true"] {
                touch-action: pan-y;
            }
          ` }} />

                {/* Robust JS Zoom prevention for iOS Safari and multi-touch gestures */}
                <script dangerouslySetInnerHTML={{
                    __html: `
            // 1. Prevent Multi-touch zoom
            document.addEventListener('touchstart', function(event) {
                if (event.touches.length > 1) {
                    event.preventDefault();
                }
            }, { passive: false });

            // 2. Prevent iOS Gesture Zoom
            document.addEventListener('gesturestart', function(event) {
                event.preventDefault();
            });

            // 3. Prevent Double Tap Zoom
            let lastTouchEnd = 0;
            document.addEventListener('touchend', function(event) {
                const now = (new Date()).getTime();
                if (now - lastTouchEnd <= 300) {
                    event.preventDefault();
                }
                lastTouchEnd = now;
            }, false);

            // 4. Prevent Mouse Wheel Zoom (Ctrl + Wheel)
            document.addEventListener('wheel', function(event) {
                if (event.ctrlKey) {
                    event.preventDefault();
                }
            }, { passive: false });

            // 5. Prevent Keyboard Zoom (Ctrl + +/-)
            document.addEventListener('keydown', function(event) {
                if (event.ctrlKey && (event.key === '+' || event.key === '=' || event.key === '-' || event.key === '_')) {
                    event.preventDefault();
                }
            });

            // 6. Security: Disable Right Click
            document.addEventListener('contextmenu', function(event) {
                event.preventDefault();
            });

            // 7. Security: Disable F12, Ctrl+Shift+I/J/C, Ctrl+U
            document.addEventListener('keydown', function(event) {
                // F12
                if (event.key === 'F12' || event.keyCode === 123) {
                    event.preventDefault();
                    return false;
                }
                // Ctrl+Shift+I (DevTools)
                if (event.ctrlKey && event.shiftKey && (event.key === 'I' || event.key === 'i' || event.keyCode === 73)) {
                    event.preventDefault();
                    return false;
                }
                // Ctrl+Shift+J (Console)
                if (event.ctrlKey && event.shiftKey && (event.key === 'J' || event.key === 'j' || event.keyCode === 74)) {
                    event.preventDefault();
                    return false;
                }
                // Ctrl+Shift+C (Inspect)
                if (event.ctrlKey && event.shiftKey && (event.key === 'C' || event.key === 'c' || event.keyCode === 67)) {
                    event.preventDefault();
                    return false;
                }
                // Ctrl+U (View Source)
                if (event.ctrlKey && (event.key === 'U' || event.key === 'u' || event.keyCode === 85)) {
                    event.preventDefault();
                    return false;
                }
            });
          ` }} />

                {/* Google Analytics (GA4) Script */}
                <script async src="https://www.googletagmanager.com/gtag/js?id=G-V9WBTTWR46"></script>
                <script dangerouslySetInnerHTML={{
                    __html: `
            window.dataLayer = window.dataLayer || [];
            window.gtag = function(){ window.dataLayer.push(arguments); }
            window.gtag('config', 'G-V9WBTTWR46', {
              send_page_view: false
            });
          `
                }} />

                <script dangerouslySetInnerHTML={{
                    __html: `
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', function() {
                navigator.serviceWorker.register('/sw.js').then(function(registration) {
                  console.log('ServiceWorker registration successful with scope: ', registration.scope);
                }, function(err) {
                  console.log('ServiceWorker registration failed: ', err);
                });
              });
            }
          `
                }} />
            </head>
            <body>{children}</body>
        </html>
    );
}
