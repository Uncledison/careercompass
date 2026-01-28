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
    shadow-intensity="0"
    environment-image="neutral"
  ></model-viewer>

  <script>
    const viewer = document.getElementById('viewer');
    const animations = ${JSON.stringify(animations)};
    let currentIndex = 0;

    viewer.addEventListener('load', () => {
      // 사용 가능한 애니메이션 목록 확인
      const availableAnimations = viewer.availableAnimations;
      console.log('Available animations:', availableAnimations);

      // 첫 번째 애니메이션 재생
      if (animations.length > 0 && availableAnimations.includes(animations[0])) {
        viewer.animationName = animations[0];
        viewer.play();
      } else if (availableAnimations.length > 0) {
        // 지정된 애니메이션이 없으면 첫 번째 애니메이션 재생
        viewer.animationName = availableAnimations[0];
        viewer.play();
      }
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

  const viewerRef = React.useRef<any>(null);

  // 웹 애니메이션 처리
  React.useEffect(() => {
    if (Platform.OS === 'web' && viewerRef.current) {
      const viewer = viewerRef.current;
      let currentIndex = 0;

      const handleLoad = () => {
        const availableAnimations = viewer.availableAnimations;
        if (animations.length > 0 && availableAnimations.includes(animations[0])) {
          viewer.animationName = animations[0];
          viewer.play();
        }
      };

      const handleFinished = () => {
        const availableAnimations = viewer.availableAnimations;
        const nextIndex = Math.floor(Math.random() * animations.length);
        const nextAnimation = animations[nextIndex];
        if (availableAnimations.includes(nextAnimation)) {
          viewer.animationName = nextAnimation;
          viewer.play();
        }
      };

      const handleError = (error: any) => {
        console.error('3D Model Load Error:', error);
      };

      viewer.addEventListener('load', handleLoad);
      viewer.addEventListener('finished', handleFinished);
      viewer.addEventListener('error', handleError);

      return () => {
        viewer.removeEventListener('load', handleLoad);
        viewer.removeEventListener('finished', handleFinished);
        viewer.removeEventListener('error', handleError);
      };
    }
  }, [animations, modelPath]);

  if (Platform.OS === 'web') {
    return (
      <View style={[styles.container, { width, height, borderRadius }]}>
        <style dangerouslySetInnerHTML={{
          __html: `
          model-viewer {
            width: 100%;
            height: 100%;
            --poster-color: transparent;
            --progress-bar-color: transparent;
            display: block;
          }
          model-viewer::part(default-progress-bar) {
            display: none;
          }
        `}} />
        {/* @ts-ignore */}
        <model-viewer
          ref={viewerRef}
          src={modelPath}
          auto-rotate={autoRotate ? '' : undefined}
          auto-rotate-delay="0"
          rotation-per-second="30deg"
          camera-controls={disableControls ? '' : undefined}
          camera-orbit={cameraOrbit || `0deg 75deg ${cameraDistance || '2.5m'}`}
          camera-target={cameraTarget || 'auto auto auto'}
          interaction-prompt="none"
          autoplay
          loading="eager"
          reveal="auto"
          shadow-intensity="0"
          environment-image="neutral"
          draco-decoder-path="https://www.gstatic.com/draco/versioned/decoders/1.5.7/"
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
