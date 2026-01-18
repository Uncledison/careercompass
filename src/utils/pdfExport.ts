/**
 * PDF 내보내기 유틸리티
 * 검사 결과를 PDF로 저장/인쇄
 */

import { Platform } from 'react-native';
import { CareerScores, CareerField } from '../types';

// 계열 정보
const careerFieldInfo: Record<CareerField, {
  label: string;
  icon: string;
  color: string;
  description: string;
  traits: string[];
  jobs: string[];
  futureJobs: string[];
}> = {
  humanities: {
    label: '인문',
    icon: '📚',
    color: '#8B5CF6',
    description: '언어와 문화, 역사에 관심이 많고 깊이 있는 사고를 좋아해요.',
    traits: ['창의적 글쓰기', '공감 능력', '비판적 사고', '언어 감각'],
    jobs: ['작가', '기자', '번역가', '심리상담사'],
    futureJobs: ['AI 콘텐츠 작가', '문화기획자', '데이터 스토리텔러', '심리 AI 개발자'],
  },
  social: {
    label: '사회',
    icon: '🌍',
    color: '#F59E0B',
    description: '사람들과 소통하고 사회 문제 해결에 관심이 많아요.',
    traits: ['리더십', '협상력', '논리적 사고', '의사소통'],
    jobs: ['CEO', '마케터', '변호사', '외교관'],
    futureJobs: ['ESG 컨설턴트', '스타트업 CEO', '국제기구 전문가', '디지털 정책 전문가'],
  },
  natural: {
    label: '자연',
    icon: '🔬',
    color: '#10B981',
    description: '자연 현상의 원리를 탐구하고 실험하는 것을 좋아해요.',
    traits: ['탐구심', '분석력', '논리적 사고', '인내심'],
    jobs: ['과학자', '연구원', '기후전문가', '수학자'],
    futureJobs: ['기후과학자', '바이오 연구원', '양자컴퓨팅 전문가', '우주 과학자'],
  },
  engineering: {
    label: '공학',
    icon: '🤖',
    color: '#3B82F6',
    description: '기술로 문제를 해결하고 새로운 것을 만드는 것을 좋아해요.',
    traits: ['창의력', '문제해결력', '기술 감각', '도전정신'],
    jobs: ['AI개발자', '로봇공학자', '건축가', '게임개발자'],
    futureJobs: ['AI 엔지니어', '메타버스 개발자', '자율주행 엔지니어', '드론 전문가'],
  },
  medicine: {
    label: '의학',
    icon: '🏥',
    color: '#EF4444',
    description: '생명을 소중히 여기고 다른 사람을 돕는 것에 보람을 느껴요.',
    traits: ['봉사정신', '꼼꼼함', '책임감', '인내심'],
    jobs: ['의사', '간호사', '약사', '수의사'],
    futureJobs: ['정밀의료 전문의', '바이오 헬스케어 전문가', 'AI 진단 개발자', '유전자 치료 전문가'],
  },
  arts: {
    label: '예체능',
    icon: '🎨',
    color: '#EC4899',
    description: '자신만의 방식으로 표현하고 창작하는 것을 즐겨요.',
    traits: ['창의성', '표현력', '감성', '끈기'],
    jobs: ['디자이너', '음악가', '운동선수', '유튜버'],
    futureJobs: ['UX/UI 디자이너', '버추얼 아티스트', 'e스포츠 선수', '콘텐츠 크리에이터'],
  },
};

// 레벨 한글 변환
const getLevelLabel = (level: string): string => {
  switch (level) {
    case 'elementary_lower':
    case 'elementary_upper':
      return '초등학생';
    case 'middle':
      return '중학생';
    case 'high':
      return '고등학생';
    default:
      return '검사';
  }
};

// 날짜 포맷
const formatDate = (timestamp: number): string => {
  const date = new Date(timestamp);
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;
};

// 순위 계산
const getCareerRankings = (scores: CareerScores) => {
  const fields: CareerField[] = ['humanities', 'social', 'natural', 'engineering', 'medicine', 'arts'];
  return fields
    .map((field) => ({ field, score: scores[field] }))
    .sort((a, b) => b.score - a.score);
};

// 레이더 차트 SVG 생성
const generateRadarChartSVG = (scores: CareerScores): string => {
  const fields: CareerField[] = ['humanities', 'social', 'natural', 'engineering', 'medicine', 'arts'];
  const size = 300;
  const center = size / 2;
  const radius = 100;
  const angleStep = (2 * Math.PI) / 6;

  const getPoint = (index: number, value: number) => {
    const angle = angleStep * index - Math.PI / 2;
    const r = (value / 100) * radius;
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle),
    };
  };

  // 배경 그리드
  const gridLevels = [0.25, 0.5, 0.75, 1.0];
  let gridLines = '';
  gridLevels.forEach((level) => {
    const points = fields.map((_, i) => {
      const p = getPoint(i, level * 100);
      return `${p.x},${p.y}`;
    }).join(' ');
    gridLines += `<polygon points="${points}" fill="none" stroke="#e5e7eb" stroke-width="1"/>`;
  });

  // 축 라인
  let axisLines = '';
  fields.forEach((_, i) => {
    const p = getPoint(i, 100);
    axisLines += `<line x1="${center}" y1="${center}" x2="${p.x}" y2="${p.y}" stroke="#e5e7eb" stroke-width="1"/>`;
  });

  // 데이터 폴리곤
  const dataPoints = fields.map((field, i) => {
    const p = getPoint(i, scores[field]);
    return `${p.x},${p.y}`;
  }).join(' ');

  // 데이터 포인트
  let dataCircles = '';
  fields.forEach((field, i) => {
    const p = getPoint(i, scores[field]);
    const info = careerFieldInfo[field];
    dataCircles += `<circle cx="${p.x}" cy="${p.y}" r="6" fill="${info.color}" stroke="white" stroke-width="2"/>`;
  });

  // 라벨
  let labels = '';
  fields.forEach((field, i) => {
    const p = getPoint(i, 130);
    const info = careerFieldInfo[field];
    labels += `
      <text x="${p.x}" y="${p.y - 8}" text-anchor="middle" font-size="12" font-weight="600" fill="#374151">${info.icon} ${info.label}</text>
      <text x="${p.x}" y="${p.y + 8}" text-anchor="middle" font-size="11" font-weight="bold" fill="${info.color}">${scores[field]}점</text>
    `;
  });

  return `
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
      ${gridLines}
      ${axisLines}
      <polygon points="${dataPoints}" fill="rgba(99, 102, 241, 0.3)" stroke="#6366f1" stroke-width="2"/>
      ${dataCircles}
      ${labels}
    </svg>
  `;
};

// 색상을 rgba로 변환하는 헬퍼 함수
const hexToRgba = (hex: string, alpha: number): string => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

// 종합 코멘트 생성
const getSummaryComment = (label: string, score: number): string => {
  if (score >= 85) {
    return `${label} 계열에 대한 적성이 매우 높아요! 이 분야에서 뛰어난 성과를 낼 가능성이 커요.`;
  } else if (score >= 70) {
    return `${label} 계열에 좋은 적성을 보여주고 있어요. 꾸준히 관심을 가지면 더 성장할 수 있어요.`;
  } else {
    return `여러 분야에 고르게 관심이 있네요! 다양한 경험을 통해 나만의 강점을 찾아보세요.`;
  }
};

// PDF용 HTML 생성
export const generatePDFHTML = (
  scores: CareerScores,
  level: string,
  timestamp: number,
  nickname?: string,
  grade?: string
): string => {
  const rankings = getCareerRankings(scores);
  const topCareer = rankings[0];
  const topInfo = careerFieldInfo[topCareer.field];
  const bottomCareer = rankings[rankings.length - 1];
  const bottomInfo = careerFieldInfo[bottomCareer.field];

  const radarChart = generateRadarChartSVG(scores);

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Career Compass 검사 결과</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      color-adjust: exact !important;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Noto Sans KR', sans-serif;
      background: #f8fafc !important;
      color: #1f2937;
      padding: 20px;
      line-height: 1.6;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    .container {
      max-width: 800px;
      margin: 0 auto;
      background: white !important;
      border-radius: 12px;
      padding: 20px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    .header {
      text-align: center;
      margin-bottom: 16px;
      padding-bottom: 12px;
      border-bottom: 2px solid #e5e7eb;
    }
    .header h1 {
      font-size: 22px;
      color: #6366f1;
      margin-bottom: 4px;
    }
    .header .info {
      color: #6b7280;
      font-size: 12px;
    }
    .theory-marquee {
      background: linear-gradient(90deg, rgba(99, 102, 241, 0.1), rgba(168, 85, 247, 0.1)) !important;
      padding: 8px 0;
      margin-bottom: 16px;
      border-radius: 8px;
      overflow: hidden;
      position: relative;
    }
    .theory-marquee-track {
      display: flex;
      width: fit-content;
      animation: marquee 20s linear infinite;
    }
    .theory-marquee-content {
      display: flex;
      white-space: nowrap;
      font-size: 11px;
      color: #6366f1;
      font-weight: 500;
      padding-right: 50px;
    }
    @keyframes marquee {
      0% { transform: translateX(0); }
      100% { transform: translateX(-50%); }
    }
    .highlight-section {
      background: ${topInfo.color} !important;
      color: white !important;
      border-radius: 12px;
      padding: 16px;
      text-align: center;
      margin-bottom: 16px;
    }
    .highlight-section .label {
      font-size: 11px;
      opacity: 0.9;
      margin-bottom: 4px;
    }
    .highlight-section .main {
      font-size: 22px;
      font-weight: 700;
      margin-bottom: 4px;
    }
    .highlight-section .score {
      font-size: 32px;
      font-weight: 800;
    }
    .chart-section {
      text-align: center;
      margin-bottom: 16px;
    }
    .chart-section h2 {
      font-size: 14px;
      margin-bottom: 12px;
      color: #374151;
    }
    .rankings-section {
      margin-bottom: 16px;
    }
    .rankings-section h2 {
      font-size: 14px;
      margin-bottom: 10px;
      color: #374151;
    }
    .ranking-card {
      display: flex;
      align-items: center;
      padding: 10px;
      border-radius: 8px;
      margin-bottom: 8px;
      background: #f3f4f6 !important;
      border-left: 3px solid;
    }
    .ranking-rank {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: #e5e7eb !important;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 11px;
      color: #6b7280;
      margin-right: 8px;
    }
    .ranking-icon {
      font-size: 18px;
      margin-right: 8px;
    }
    .ranking-info {
      flex: 1;
    }
    .ranking-label {
      font-weight: 600;
      font-size: 13px;
    }
    .ranking-score {
      font-size: 11px;
      color: #6b7280;
    }
    .ranking-jobs {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
      margin-top: 6px;
    }
    .job-chip {
      padding: 2px 8px;
      border-radius: 10px;
      font-size: 10px;
      font-weight: 500;
    }
    .analysis-section {
      margin-bottom: 16px;
      padding: 14px;
      background: #f3f4f6 !important;
      border-radius: 10px;
    }
    .analysis-section h2 {
      font-size: 14px;
      margin-bottom: 10px;
      color: #374151;
    }
    .analysis-section h3 {
      font-size: 12px;
      margin-bottom: 6px;
      color: #4b5563;
    }
    .analysis-section p {
      font-size: 11px;
      color: #6b7280;
      margin-bottom: 8px;
    }
    .traits-list {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
      margin-bottom: 8px;
    }
    .trait-chip {
      padding: 3px 8px;
      border-radius: 12px;
      font-size: 10px;
      font-weight: 500;
    }
    .strength-points {
      margin-top: 6px;
    }
    .strength-point {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 2px 0;
      font-size: 10px;
      color: #4b5563;
    }
    .strength-bullet {
      font-weight: 700;
    }
    .growth-section {
      margin-top: 12px;
      padding: 10px;
      background: #e5e7eb !important;
      border-radius: 8px;
    }
    .growth-tip {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 2px 0;
      font-size: 10px;
      color: #4b5563;
    }
    .future-jobs-section {
      margin-bottom: 16px;
    }
    .future-jobs-section h2 {
      font-size: 14px;
      margin-bottom: 6px;
      color: #374151;
    }
    .future-jobs-section .subtitle {
      font-size: 10px;
      color: #6b7280;
      margin-bottom: 10px;
    }
    .future-jobs-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
    }
    .future-job-card {
      padding: 10px;
      background: #f3f4f6 !important;
      border-radius: 8px;
    }
    .future-job-card h4 {
      font-size: 11px;
      margin-bottom: 6px;
      font-weight: 600;
    }
    .future-job-list {
      padding-left: 0;
    }
    .future-job-item {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 10px;
      color: #6b7280;
      padding: 2px 0;
    }
    .future-job-bullet {
      width: 4px;
      height: 4px;
      border-radius: 50%;
      flex-shrink: 0;
    }
    .summary-section {
      margin-bottom: 16px;
      padding: 14px;
      border-radius: 12px;
      border: 2px solid ${topInfo.color};
      background: white !important;
    }
    .summary-header {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-bottom: 8px;
    }
    .summary-icon {
      font-size: 16px;
    }
    .summary-title {
      font-size: 14px;
      font-weight: 600;
      color: #374151;
    }
    .summary-text {
      font-size: 12px;
      color: #374151;
      line-height: 1.6;
      margin-bottom: 10px;
    }
    .summary-tip {
      display: flex;
      gap: 6px;
      padding: 8px;
      background: #f3f4f6 !important;
      border-radius: 6px;
    }
    .summary-tip-icon {
      font-size: 12px;
      flex-shrink: 0;
    }
    .summary-tip-text {
      font-size: 10px;
      color: #6b7280;
      line-height: 1.4;
    }
    .footer {
      text-align: center;
      padding-top: 12px;
      border-top: 1px solid #e5e7eb;
      color: #9ca3af;
      font-size: 10px;
    }
    .footer .logo {
      font-size: 12px;
      font-weight: 700;
      color: #6366f1;
      margin-bottom: 4px;
    }
    @media print {
      * {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        color-adjust: exact !important;
      }
      body {
        background: white !important;
        padding: 0;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      .container {
        box-shadow: none;
        padding: 20px;
      }
      .highlight-section {
        background: ${topInfo.color} !important;
      }
      .ranking-card, .analysis-section, .future-job-card, .growth-section, .summary-tip {
        background: #f3f4f6 !important;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Career Compass</h1>
      <p class="info">
        ${nickname ? `${nickname}님의 ` : ''}${grade || getLevelLabel(level)} 진로적성검사 결과<br>
        검사일: ${formatDate(timestamp)}
      </p>
    </div>

    <div class="theory-marquee">
      <div class="theory-marquee-track">
        <div class="theory-marquee-content">🎓 HOLLAND 직업흥미이론 · 다중지능이론 · 진로발달이론 기반 검사</div>
        <div class="theory-marquee-content">🎓 HOLLAND 직업흥미이론 · 다중지능이론 · 진로발달이론 기반 검사</div>
        <div class="theory-marquee-content">🎓 HOLLAND 직업흥미이론 · 다중지능이론 · 진로발달이론 기반 검사</div>
        <div class="theory-marquee-content">🎓 HOLLAND 직업흥미이론 · 다중지능이론 · 진로발달이론 기반 검사</div>
      </div>
    </div>

    <div class="highlight-section">
      <p class="label">나의 1순위 진로</p>
      <p class="main">${topInfo.icon} ${topInfo.label} 계열</p>
      <p class="score">${topCareer.score}점</p>
    </div>

    <div class="chart-section">
      <h2>적성 분석 차트</h2>
      ${radarChart}
    </div>

    <div class="rankings-section">
      <h2>맞춤 진로 추천</h2>
      ${rankings.slice(0, 3).map((item, idx) => {
        const info = careerFieldInfo[item.field];
        return `
          <div class="ranking-card" style="border-left-color: ${info.color}">
            <div class="ranking-rank">#${idx + 1}</div>
            <span class="ranking-icon">${info.icon}</span>
            <div class="ranking-info">
              <div class="ranking-label">${info.label} 계열</div>
              <div class="ranking-score">${item.score}점 · ${item.score >= 80 ? '최적합' : item.score >= 60 ? '적합' : '관심'}</div>
              <div class="ranking-jobs">
                ${info.jobs.map(job => `<span class="job-chip" style="background: ${hexToRgba(info.color, 0.15)} !important; color: ${info.color};">${job}</span>`).join('')}
              </div>
            </div>
          </div>
        `;
      }).join('')}
    </div>

    <div class="analysis-section">
      <h2>나의 강점</h2>
      <h3>${topInfo.icon} ${topInfo.label} 계열</h3>
      <p>${topInfo.description}</p>
      <div class="traits-list">
        ${topInfo.traits.map(trait => `<span class="trait-chip" style="background: ${hexToRgba(topInfo.color, 0.15)} !important; color: ${topInfo.color};">${trait}</span>`).join('')}
      </div>
      <div class="strength-points">
        <div class="strength-point"><span class="strength-bullet" style="color: ${topInfo.color}">✓</span> 다양한 관점으로 생각해요</div>
        <div class="strength-point"><span class="strength-bullet" style="color: ${topInfo.color}">✓</span> 이야기를 잘 만들어요</div>
        <div class="strength-point"><span class="strength-bullet" style="color: ${topInfo.color}">✓</span> 감정을 잘 표현해요</div>
      </div>

      <div class="growth-section">
        <h3 style="margin-bottom: 8px;">🌱 성장 포인트</h3>
        <p style="margin-bottom: 8px;">${bottomInfo.label} 계열 역량을 키워보면 더 다양한 가능성이 열려요!</p>
        <div class="growth-tip">💡 관련 활동에 도전해보세요</div>
      </div>
    </div>

    <div class="future-jobs-section">
      <h2>미래 유망 직업</h2>
      <p class="subtitle">AI 시대에 주목받는 직업들이에요</p>
      <div class="future-jobs-grid">
        ${rankings.slice(0, 2).map(item => {
          const info = careerFieldInfo[item.field];
          return `
            <div class="future-job-card">
              <h4 style="color: ${info.color}">${info.icon} ${info.label} 계열</h4>
              <div class="future-job-list">
                ${info.futureJobs.map(job => `<div class="future-job-item"><span class="future-job-bullet" style="background: ${info.color} !important;"></span>${job}</div>`).join('')}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>

    <div class="summary-section">
      <div class="summary-header">
        <span class="summary-icon">✨</span>
        <span class="summary-title">종합 코멘트</span>
      </div>
      <p class="summary-text">${getSummaryComment(topInfo.label, topCareer.score)}</p>
      <div class="summary-tip">
        <span class="summary-tip-icon">📌</span>
        <span class="summary-tip-text">검사 결과는 현재 시점의 적성을 보여줘요. 다양한 경험을 하면서 새로운 가능성을 발견해 보세요!</span>
      </div>
    </div>

    <div class="footer">
      <p class="logo">Career Compass</p>
      <p>이 결과는 현재 시점의 적성을 보여줍니다.<br>
      다양한 경험을 하면서 새로운 가능성을 발견해 보세요!</p>
    </div>
  </div>
</body>
</html>
  `;
};

// PDF 내보내기 함수
export const exportToPDF = async (
  scores: CareerScores,
  level: string,
  timestamp: number,
  nickname?: string,
  grade?: string
): Promise<void> => {
  const html = generatePDFHTML(scores, level, timestamp, nickname, grade);

  if (Platform.OS === 'web') {
    // 웹: 새 창에서 인쇄
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.onload = () => {
        printWindow.print();
      };
    }
  } else {
    // 네이티브: expo-print 사용 (설치 필요)
    try {
      const Print = require('expo-print');
      const Sharing = require('expo-sharing');

      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri, {
        UTI: '.pdf',
        mimeType: 'application/pdf',
      });
    } catch (error) {
      console.error('PDF export failed:', error);
      // fallback: alert
      if (typeof alert !== 'undefined') {
        alert('PDF 내보내기는 앱에서만 지원됩니다.');
      }
    }
  }
};
