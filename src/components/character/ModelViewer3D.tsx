/**
 * 3D 모델 뷰어 컴포넌트
 * Google model-viewer를 사용하여 GLB 파일 렌더링
 * 애니메이션 순차 재생 및 자동 회전 지원
 */

import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { WebView } from 'react-native-webview';

interface ModelViewer3DProps {
  modelPath: string;
  animations?: string[];
  width?: number;
  height?: number;
  autoRotate?: boolean;
  backgroundColor?: string;
  borderRadius?: number;
  cameraDistance?: string; // 카메라 거리 (예: "4m", "5m")
  disableControls?: boolean; // 컨트롤(회전/줌) 비활성화 여부
  cameraTarget?: string; // 카메라 타겟 (예: "0m 1m 0m")
  cameraOrbit?: string; // 카메라 궤도 (예: "90deg 75deg auto")
}

export const ModelViewer3D: React.FC<ModelViewer3DProps> = ({
  modelPath,
  animations = ['Idle_Peck', 'Run'],
  width = 200,
  height = 180,
  autoRotate = true,
  backgroundColor = 'transparent',
  borderRadius = 16,
  cameraDistance,
  disableControls = false,
  cameraTarget,
  cameraOrbit,
}) => {
  // 애니메이션 순차 재생을 위한 HTML
  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script type="module" src="https://unpkg.com/@google/model-viewer/dist/model-viewer.min.js"></script>
  <style>
    * { margin: 0; padding: 0; }
    body {
      background: ${backgroundColor};
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      overflow: hidden;
    }
    model-viewer {
      width: 100%;
      height: 100%;
      --poster-color: transparent;
      --progress-bar-color: transparent;
      --progress-bar-height: 0px;
    }
    model-viewer::part(default-progress-bar) {
      display: none;
      opacity: 0;
    }
  </style>
</head>
<body>
    <model-viewer
    id="viewer"
    src="${modelPath}"
    ${autoRotate ? 'auto-rotate' : ''}
    auto-rotate-delay="0"
    rotation-per-second="60deg"
    ${disableControls ? '' : 'camera-controls'}
    camera-orbit="${cameraOrbit || `0deg 75deg ${cameraDistance || '2.5m'}`}"
    camera-target="${cameraTarget || 'auto auto auto'}"
    min-camera-orbit="auto auto auto"
    max-camera-orbit="auto auto auto"
    interaction-prompt="none"
    autoplay
    loading="eager"
    reveal="auto"
    draco-decoder-path="https://www.gstatic.com/draco/versioned/decoders/1.5.7/"
    shadow-intensity="1"
    environment-image="neutral"
  ></model-viewer>

  <script>
    const viewer = document.getElementById('viewer');
    const animations = ${JSON.stringify(animations)};
    let currentIndex = 0;

    viewer.addEventListener('load', () => {
      console.log('3D Model loaded successfully:', '${modelPath}');
      const availableAnimations = viewer.availableAnimations;
      if (animations.length > 0 && availableAnimations.includes(animations[0])) {
        viewer.animationName = animations[0];
        viewer.play();
      } else if (availableAnimations.length > 0) {
        viewer.animationName = availableAnimations[0];
        viewer.play();
      }
    });

    viewer.addEventListener('error', (e) => {
      console.error('3D Model Error:', e.detail || e);
    });

    // 애니메이션 종료 시 다음 애니메이션으로 전환
    viewer.addEventListener('finished', () => {
      const availableAnimations = viewer.availableAnimations;
      // Randomly select next animation
      let nextIndex;
      do {
        nextIndex = Math.floor(Math.random() * animations.length);
      } while (animations.length > 1 && nextIndex === currentIndex); // Avoid repeating same animation if possible
      
      currentIndex = nextIndex;

      const nextAnimation = animations[currentIndex];
      if (availableAnimations.includes(nextAnimation)) {
        viewer.animationName = nextAnimation;
        viewer.play();
      }
    });
  </script>
</body>
</html>
  `;

  // 웹 환경: iframe 대신 직접 model-viewer 태그 사용 (속도 최적화)
  if (Platform.OS === 'web') {
    // Custom Element 타입 정의가 없으므로 any로 처리
    const ModelViewer = 'model-viewer' as any;
    const modelViewerRef = React.useRef<any>(null);

    React.useEffect(() => {
      // 라이브러리가 로드되지 않았다면 동적으로 로드
      if (typeof window !== 'undefined' && !customElements.get('model-viewer')) {
        console.log('Injecting model-viewer script dynamically...');
        const script = document.createElement('script');
        script.type = 'module';
        script.src = 'https://unpkg.com/@google/model-viewer/dist/model-viewer.min.js';
        script.onload = () => console.log('ModelViewer script loaded successfully');
        script.onerror = (e) => console.error('Failed to load ModelViewer script', e);
        document.head.appendChild(script);
      }
    }, []);

    // 애니메이션 제어 로직 복구
    React.useEffect(() => {
      const viewer = modelViewerRef.current;
      if (!viewer) return;

      let currentIndex = 0;

      const handleLoad = () => {
        const availableAnimations = viewer.availableAnimations || [];
        if (animations && animations.length > 0 && availableAnimations.includes(animations[0])) {
          viewer.animationName = animations[0];
          viewer.play();
        } else if (availableAnimations.length > 0) {
          viewer.animationName = availableAnimations[0];
          viewer.play();
        }
      };

      const handleFinished = () => {
        if (!animations || animations.length === 0) return;

        const availableAnimations = viewer.availableAnimations || [];
        let nextIndex;
        // 이전 iframe 로직과 동일하게 랜덤 선택 (중복 최소화)
        do {
          nextIndex = Math.floor(Math.random() * animations.length);
        } while (animations.length > 1 && nextIndex === currentIndex);

        currentIndex = nextIndex;
        const nextAnimation = animations[currentIndex];

        if (availableAnimations.includes(nextAnimation)) {
          viewer.animationName = nextAnimation;
          viewer.play();
        }
      };

      viewer.addEventListener('load', handleLoad);
      viewer.addEventListener('finished', handleFinished);

      return () => {
        if (viewer) {
          viewer.removeEventListener('load', handleLoad);
          viewer.removeEventListener('finished', handleFinished);
        }
      };
    }, [modelPath, animations]);

    return (
      <View
        style={[
          styles.container,
          {
            width, // Props로 받은 width (예: 200)
            height,
            borderRadius,
            backgroundColor: backgroundColor || 'transparent', // 배경색 명시
          }
        ]}
      >
        <ModelViewer
          ref={modelViewerRef}
          src={modelPath}

          // 중요: Web Component가 부모 View를 가득 채우도록 설정
          style={{
            width: '100%',
            height: '100%',
            display: 'block',
            backgroundColor: 'transparent',
            // 로딩 바 숨기기
            '--progress-bar-color': 'transparent',
            '--progress-bar-height': '0px',
            '--poster-color': 'transparent',
          }}
          auto-rotate={autoRotate ? 'true' : null}
          rotation-per-second="60deg" // 2배 속도 (기본 30deg -> 60deg)
          camera-controls={disableControls ? null : 'true'}
          camera-orbit={cameraOrbit || `0deg 75deg ${cameraDistance || '2.5m'}`}
          camera-target={cameraTarget || 'auto auto auto'}
          shadow-intensity="1"
          autoplay
          loading="eager" // 즉시 로딩
        />
      </View>
    );
  }

  // 네이티브에서는 WebView 사용
  return (
    <View style={[styles.container, { width, height, borderRadius }]}>
      <WebView
        source={{ html: htmlContent }}
        style={styles.webview}
        scrollEnabled={false}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
        originWhitelist={['*']}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
});

export default ModelViewer3D;
