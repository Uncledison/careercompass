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
                <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
                <script type="module" src="https://unpkg.com/@google/model-viewer/dist/model-viewer.min.js"></script>
                <link rel="apple-touch-icon" href="/assets/icon.png" />
                <link rel="icon" type="image/png" sizes="192x192" href="/assets/icon.png" />
                <link rel="icon" type="image/png" sizes="512x512" href="/assets/icon.png" />

                {/* 
          This viewport meta tag effectively disables zooming on mobile web, which is often 
          desirable for "app-like" PWA experiences. 
        */}
                <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" />

                {/* Link the PWA manifest file. Validating the path to your manifest is important! */}
                {/* Expo handles manifest generation automatically via app.json configuration */}

                {/* 
          Disable body scrolling on web. This makes ScrollView components work closer to how they do on native. 
          However, body scrolling is often nice to have for mobile web. If you want to enable it, remove this line.
        */}
                <ScrollViewStyleReset />

                {/* Using raw CSS styles as an escape hatch to ensure the background is set 
            before the React app hydrates. This prevents a flash of white. */}
                <style dangerouslySetInnerHTML={{ __html: `body { background-color: #F2F2F7; }` }} />

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
