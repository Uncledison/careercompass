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

                <script type="module" src="https://unpkg.com/@google/model-viewer/dist/model-viewer.min.js"></script>
                <link rel="apple-touch-icon" href="/assets/icon.png" />
                <link rel="icon" type="image/png" sizes="192x192" href="/assets/icon.png" />
                <link rel="icon" type="image/png" sizes="512x512" href="/assets/icon.png" />

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
          ` }} />

                {/* Google Analytics (GA4) Script */}
                <script async src="https://www.googletagmanager.com/gtag/js?id=G-V9WBTTWR46"></script>
                <script dangerouslySetInnerHTML={{
                    __html: `
            window.dataLayer = window.dataLayer || [];
            window.gtag = function(){ window.dataLayer.push(arguments); }
            window.gtag('js', new Date());
            window.gtag('config', 'G-V9WBTTWR46', {
              send_page_view: false
            });
          `
                }} />
            </head>
            <body>{children}</body>
        </html>
    );
}
