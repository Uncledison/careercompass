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
    rotation-per-second="30deg"
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

  // 웹 환경: iframe 대신 직접 model-viewer 태그 사용 (성능 최적화)
  if (Platform.OS === 'web') {
    // Custom Element 타입 정의가 없으므로 any로 처리하거나 ts-ignore 사용
    const ModelViewer = 'model-viewer' as any;

    React.useEffect(() => {
      // 컴포넌트 마운트 시 스크립트가 로드되었는지 확인 (app/+html.tsx에서 로드됨)
      // 필요한 경우 추가 로직 작성
    }, []);

    return (
      <View
        style={[
          styles.container,
          {
            width,
            height,
            borderRadius,
            backgroundColor,
          }
        ]}
      >
        <ModelViewer
          src={modelPath}
          style={{ width: '100%', height: '100%' }}
          auto-rotate={autoRotate ? 'true' : null}
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
